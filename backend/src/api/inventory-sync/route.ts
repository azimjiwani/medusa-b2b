import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import dailyInventorySyncWorkflow from "../../workflows/inventory/daily-inventory-sync"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { result } = await dailyInventorySyncWorkflow(req.scope)
      .run({
        input: {},
      })

    const success = result.inventoryResult.success && result.priceResult.success

    res.status(success ? 200 : 500).json({
      success,
      message: success ? "Inventory sync completed" : "Inventory sync failed",
      result
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to trigger inventory sync",
      error: error.message
    })
  }
}
