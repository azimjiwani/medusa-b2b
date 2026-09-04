import { MedusaContainer } from "@medusajs/framework/types"
import dailyInventorySyncWorkflow from "../workflows/inventory/daily-inventory-sync"
import { isBngProductOptionSyncEnabled } from "../workflows/inventory/bng-product-option-sync"

export default async function dailyInventorySyncJob(
  container: MedusaContainer
) {
  const { result } = await dailyInventorySyncWorkflow(container)
    .run({
      input: {
        syncProductOptions: isBngProductOptionSyncEnabled(),
      },
    })

  console.log("Daily inventory sync result:", result)

  if (!result.inventoryResult.success || !result.priceResult.success) {
    const errors = [result.inventoryResult.error, result.priceResult.error]
      .filter(Boolean)
      .join("; ")
    throw new Error(`Daily inventory sync failed: ${errors || "unknown error"}`)
  }
}

export const config = {
    name: "daily-inventory-sync",
    schedule: "*/30 * * * *", // Run every 30 minutes
};
