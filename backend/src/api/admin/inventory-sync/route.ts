import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import dailyInventorySyncWorkflow from "../../../workflows/inventory/daily-inventory-sync"
import { isBngProductOptionSyncEnabled } from "../../../workflows/inventory/bng-product-option-sync"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    console.log("Manual inventory sync triggered via API");
    
    const { result } = await dailyInventorySyncWorkflow(req.scope)
      .run({
        input: {
          syncProductOptions: isBngProductOptionSyncEnabled(),
        },
      })

    const success = result.inventoryResult.success && result.priceResult.success

    res.status(success ? 200 : 500).json({
      success,
      message: success ? "Inventory sync completed" : "Inventory sync failed",
      result: result
    })
  } catch (error: any) {
    console.error("Error during manual inventory sync:", error);
    res.status(500).json({
      success: false,
      message: "Inventory sync failed",
      error: error.message
    })
  }
}
