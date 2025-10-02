import { CoolSwitch } from "../components/common/cool-switch";
import { useCallback, useState, useEffect } from "react";
import { toast, Input, Button, Text } from "@medusajs/ui";
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { sdk } from "../lib/client";
import { useParams } from "react-router-dom";

const CustomerApprovalWidget = () => {
  const { id } = useParams<{ id: string }>();
  const [isApproved, setIsApproved] = useState(false);
  const [creditLimit, setCreditLimit] = useState<string>("");
  const [savedCreditLimit, setSavedCreditLimit] = useState<number>(0);
  const [usedCredit, setUsedCredit] = useState<number>(0);
  const [isLoadingCredit, setIsLoadingCredit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!id) return;

      try {
        const { customer } = await sdk.admin.customer.retrieve(id);
        setIsApproved(!!customer.metadata?.approved);

        // Get credit limit from metadata (stored in cents, display in dollars)
        const limit = customer.metadata?.credit_limit as number;
        setSavedCreditLimit(limit || 0);
        setCreditLimit(limit ? (limit / 100).toString() : "0");
      } catch (error) {
        console.error("Error fetching customer:", error);
      }
    };

    fetchCustomer();
  }, [id]);

  useEffect(() => {
    const fetchUsedCredit = async () => {
      if (!id) return;

      setIsLoadingCredit(true);
      try {
        // Fetch payment data from the payments API
        const response = await fetch(`/admin/payments?limit=1000`, {
          credentials: 'include'
        });
        const data = await response.json();

        // Find this customer's data
        const customerData = data.orders?.find((order: any) => order.customer_id === id);

        if (customerData) {
          setUsedCredit((customerData.total_outstanding || 0) * 100);
        } else {
          setUsedCredit(0);
        }
      } catch (error) {
        console.error("Error fetching used credit:", error);
      } finally {
        setIsLoadingCredit(false);
      }
    };

    fetchUsedCredit();
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

  const handleSaveCreditLimit = useCallback(
    async () => {
      if (!id) return;

      const limitValue = parseFloat(creditLimit);
      if (isNaN(limitValue) || limitValue < 0) {
        toast.error("Please enter a valid credit limit");
        return;
      }

      // Convert dollars to cents for storage
      const limitInCents = Math.round(limitValue * 100);

      setIsSaving(true);
      try {
        await sdk.admin.customer.update(id, {
          metadata: {
            credit_limit: limitInCents,
          },
        });
        setSavedCreditLimit(limitInCents);
        toast.success("Credit limit updated");
      } catch (error) {
        console.error("Error updating credit limit:", error);
        toast.error("Failed to update credit limit");
      } finally {
        setIsSaving(false);
      }
    },
    [id, creditLimit]
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount / 100);
  };

  if (!id) {
    return null;
  }

  const hasChanges = Math.round(parseFloat(creditLimit || "0") * 100) !== savedCreditLimit;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-ui-bg-subtle border border-ui-border-base rounded-lg p-4">
        <div className="text-ui-fg-base text-sm">
          <p className="font-medium mb-2">Instructions:</p>
          <ol className="list-decimal list-inside space-y-1 text-ui-fg-subtle">
            <li>First, approve the customer.</li>
            <li>Then, set their credit limit.</li>
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

      <div className="bg-ui-bg-subtle border border-ui-border-base rounded-lg p-4">
        <div className="flex flex-col gap-3">
          <div>
            <Text className="text-ui-fg-base font-medium text-sm mb-1">Credit Limit</Text>
            <Text className="text-ui-fg-subtle text-xs mb-3">
              Set the maximum credit limit for this customer
            </Text>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                placeholder="Enter credit limit (e.g., 500 for $500)"
                min="0"
                step="0.01"
                className="flex-1"
              />
              <Button
                onClick={handleSaveCreditLimit}
                disabled={!hasChanges || isSaving}
                isLoading={isSaving}
                variant="secondary"
                size="small"
              >
                Save
              </Button>
            </div>
            <Text className="text-ui-fg-subtle text-xs">
              Current limit: {formatCurrency(savedCreditLimit)}
            </Text>
          </div>

          <div className="border-t border-ui-border-base pt-3 mt-2">
            {isLoadingCredit ? (
              <Text className="text-ui-fg-muted text-sm">Loading credit usage...</Text>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <Text className="text-ui-fg-base font-medium text-sm">Used Credit:</Text>
                  <Text className={`font-semibold ${usedCredit > savedCreditLimit ? 'text-red-600' : 'text-ui-fg-base'}`}>
                    {formatCurrency(usedCredit)} / {formatCurrency(savedCreditLimit)}
                  </Text>
                </div>
                {savedCreditLimit > 0 && (
                  <div className="w-full bg-ui-bg-base rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        usedCredit > savedCreditLimit ? 'bg-red-600' : 'bg-green-600'
                      }`}
                      style={{ width: `${Math.min((usedCredit / savedCreditLimit) * 100, 100)}%` }}
                    />
                  </div>
                )}
                {usedCredit > savedCreditLimit && (
                  <Text className="text-red-600 text-xs font-medium">
                    ⚠️ Customer has exceeded their credit limit
                  </Text>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// The widget's configurations
export const config = defineWidgetConfig({
  zone: "customer.details.before",
});

export default CustomerApprovalWidget; 