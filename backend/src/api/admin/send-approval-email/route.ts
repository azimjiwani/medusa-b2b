import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import EmailService from "../../../services/email.service"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { customerId } = req.body as { customerId: string }

  if (!customerId) {
    return res.status(400).json({ error: "Customer ID is required" })
  }

  try {
    const customerModuleService = req.scope.resolve(Modules.CUSTOMER)
    const customer = await customerModuleService.retrieveCustomer(customerId)

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" })
    }

    const emailService = req.scope.resolve("emailService") as EmailService
    const sent = await emailService.sendApprovalEmail({
      to: customer.email.toLowerCase(),
      customer,
    })

    if (!sent) {
      return res.status(502).json({
        success: false,
        message: "Failed to send approval email",
      })
    }

    return res.json({
      success: true,
      message: "Approval email sent successfully",
    })
  } catch (error: any) {
    console.error("[APPROVAL EMAIL] Error:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to send approval email",
      debug: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}
