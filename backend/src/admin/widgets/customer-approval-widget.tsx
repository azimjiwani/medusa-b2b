import { CoolSwitch } from "../components/common/cool-switch";
import { useCallback, useState, useEffect } from "react";
import { toast } from "@medusajs/ui";
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { sdk } from "../lib/client";
import { useParams } from "react-router-dom";

const CustomerApprovalWidget = () => {
  const { id } = useParams<{ id: string }>();
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!id) return;
      
      try {
        const { customer } = await sdk.admin.customer.retrieve(id);
        setIsApproved(!!customer.metadata?.approved);
      } catch (error) {
        console.error("Error fetching customer:", error);
      }
    };

    fetchCustomer();
  }, [id]);

  const handleApprovalChange = useCallback(
    async (checked: boolean) => {
      if (!id) return;

      try {
        await sdk.admin.customer.update(id, {
          metadata: {
            approved: checked,
          },
        });
        setIsApproved(checked);
        toast.success("Customer approval status updated");
      } catch (error) {
        console.error("Error updating customer:", error);
        toast.error("Failed to update customer approval status");
      }
    },
    [id]
  );

  if (!id) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-ui-bg-subtle border border-ui-border-base rounded-lg p-4">
        <div className="text-ui-fg-base text-sm">
          <p className="font-medium mb-2">Instructions:</p>
          <ol className="list-decimal list-inside space-y-1 text-ui-fg-subtle">
            <li>First, approve the customer.</li>
            <li>Then, scroll down to customer groups and add the customer to a wholesale pricing group.</li>
          </ol>
        </div>
      </div>
      <CoolSwitch
        checked={isApproved}
        onChange={handleApprovalChange}
        fieldName="customer-approval"
        label="Customer Approval"
        description="Toggle customer approval status"
        tooltip="Approved customers can access the store"
      />
    </div>
  );
};

// The widget's configurations
export const config = defineWidgetConfig({
  zone: "customer.details.before",
});

export default CustomerApprovalWidget; 