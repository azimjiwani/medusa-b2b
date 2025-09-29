import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { syncInventoryStep } from "./steps/sync-inventory-step"
import { syncPricesEmbeddedStep } from "./steps/sync-prices-embedded"

type WorkflowInput = Record<string, any>

const dailyInventorySyncWorkflow = createWorkflow(
  "daily-inventory-sync-workflow",
  function (input: WorkflowInput) {
    // Step 1: Sync inventory quantities
    const inventoryResult = syncInventoryStep({})
    
    // Step 2: Sync prices using embedded price rules approach
    const priceResult = syncPricesEmbeddedStep({
      priceData: (inventoryResult as any).priceData || [],
      customerGroups: {
        wholesale1: "cusgroup_01JZE2HPC55BK2694XKDMME92X",
        wholesale2: "cusgroup_01JZE2J7YB302W5F46CEKFJ1TZ",
        wholesale3: "cusgroup_01JZE2JH53DVYMSXQ0M7ADH9SX"
      }
    })
    
    return new WorkflowResponse({
      inventoryResult: inventoryResult,
      priceResult: priceResult
    })
  }
)

export default dailyInventorySyncWorkflow