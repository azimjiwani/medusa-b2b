import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import dailyInventorySyncWorkflow from "../../../workflows/inventory/daily-inventory-sync"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    console.log("Manual inventory sync triggered via API");
    
    const { result } = await dailyInventorySyncWorkflow(req.scope)
      .run({
        input: {},
      })

    res.json({
      success: true,
      message: "Inventory sync completed",
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