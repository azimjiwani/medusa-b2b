import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import EmailService from "../../../services/email.service"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { email, firstName, lastName, companyName } = req.body as {
    email: string
    firstName?: string
    lastName?: string
    companyName?: string
  }

  if (!email) {
    return res.status(400).json({ error: "Email is required" })
  }

  try {
    const normalizedEmail = email.toLowerCase()
    const emailService = req.scope.resolve("emailService") as EmailService
    const sent = await emailService.sendCustomerConfirmationEmail({
      to: normalizedEmail,
      customer: {
        email: normalizedEmail,
        first_name: firstName || "Customer",
        last_name: lastName || "",
        company: companyName ? { name: companyName } : undefined,
      },
    })

    if (!sent) {
      return res.status(502).json({
        success: false,
        message: "Failed to send welcome email",
      })
    }

    return res.json({
      success: true,
      message: "Welcome email sent successfully",
    })
  } catch (error: any) {
    console.error("[WELCOME EMAIL] Error:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to send welcome email",
      debug: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
}
