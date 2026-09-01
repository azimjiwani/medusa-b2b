import { HttpTypes } from "@medusajs/types";
import { Button, Drawer, toast } from "@medusajs/ui";
import { AdminCreateEmployee, QueryCompany } from "../../../../../types";
import { useState } from "react";
import {
  useAdminCreateCustomer,
  useCreateEmployee,
} from "../../../../hooks/api";
import { sdk } from "../../../../lib/client";
import { EmployeesCreateForm } from "./employees-create-form";

export function EmployeeCreateDrawer({ company }: { company: QueryCompany }) {
  const [open, setOpen] = useState(false);

  const {
    mutateAsync: createEmployee,
    isPending: createEmployeeLoading,
    error: createEmployeeError,
  } = useCreateEmployee(company.id);

  const {
    mutateAsync: createCustomer,
    isPending: createCustomerLoading,
    error: createCustomerError,
  } = useAdminCreateCustomer();

  const handleSubmit = async (
    formData: AdminCreateEmployee & HttpTypes.AdminCreateCustomer
  ) => {
    const email = formData.email!.trim().toLowerCase();

    // Attach-or-create: a customer may already exist for this email
    // (e.g. they signed up on the storefront). Attach them instead of
    // creating a duplicate customer record.
    let customer: HttpTypes.AdminCustomer | undefined;
    let attachedExisting = false;

    try {
      const { customers } = await sdk.admin.customer.list({
        email,
        limit: 1,
        fields: "*employee",
      } as HttpTypes.AdminCustomerFilters);
      customer = customers?.[0];
      attachedExisting = !!customer;
    } catch {
      try {
        const { customers } = await sdk.admin.customer.list({ email, limit: 1 });
        customer = customers?.[0];
        attachedExisting = !!customer;
      } catch {
        // Lookup failure shouldn't block creating a brand-new customer
      }
    }

    if (customer && (customer as any).employee) {
      toast.error(
        `${email} is already an employee of a company. Remove that employee record first.`
      );
      return;
    }

    if (!customer) {
      ({ customer } = await createCustomer({
        email,
        first_name: formData.first_name!,
        last_name: formData.last_name!,
        phone: formData.phone!,
        company_name: company.name,
      }));
    }

    if (!customer?.id) {
      toast.error("Failed to create customer");
      return;
    }

    const employee = await createEmployee({
      spending_limit: formData.spending_limit!,
      is_admin: formData.is_admin!,
      customer_id: customer.id,
    });

    if (!employee) {
      toast.error("Failed to create employee");
      return;
    }

    setOpen(false);
    toast.success(
      attachedExisting
        ? `Existing customer ${customer?.first_name} ${customer?.last_name} attached to ${company.name}`
        : `Employee ${customer?.first_name} ${customer?.last_name} created successfully`
    );
  };

  const loading = createCustomerLoading || createEmployeeLoading;
  const error = createCustomerError || createEmployeeError;

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <Drawer.Trigger asChild>
        <Button variant="secondary" size="small">
          Add
        </Button>
      </Drawer.Trigger>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Add Company Customer</Drawer.Title>
        </Drawer.Header>
        <EmployeesCreateForm
          handleSubmit={handleSubmit}
          loading={loading}
          error={error}
          company={company}
        />
      </Drawer.Content>
    </Drawer>
  );
}
