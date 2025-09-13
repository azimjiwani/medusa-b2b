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

    res.json({
      success: true,
      message: "Inventory sync triggered successfully",
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