import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { syncInventoryStep } from "./steps/sync-inventory-step"
import { syncPricesEmbeddedStep } from "./steps/sync-prices-embedded"
import { getInventorySyncReferences } from "./inventory-sync-helpers"

interface WorkflowInput {
  syncProductOptions?: boolean
}

const dailyInventorySyncWorkflow = createWorkflow(
  "daily-inventory-sync-workflow",
  function (input: WorkflowInput) {
    const { customerGroups } = getInventorySyncReferences()
    // Step 1: Sync inventory quantities
    const inventoryResult = syncInventoryStep({
      syncProductOptions: input.syncProductOptions ?? false,
    })
    
    // Step 2: Sync prices using embedded price rules approach
    const priceResult = syncPricesEmbeddedStep({
      priceData: (inventoryResult as any).priceData || [],
      customerGroups
    })
    
    return new WorkflowResponse({
      inventoryResult: inventoryResult,
      priceResult: priceResult
    })
  }
)

export default dailyInventorySyncWorkflow
