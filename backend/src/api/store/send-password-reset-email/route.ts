import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

const genericSuccessResponse = {
  success: true,
  message: "If an account exists with this email, a password reset link has been sent.",
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { email } = req.body as { email: string }

  if (!email) {
    return res.status(400).json({ error: "Email is required" })
  }

  if (!process.env.SENDGRID_CUSTOMER_RESET_PASSWORD_TEMPLATE) {
    return res.status(500).json({
      success: false,
      error: "Email template not configured. Please contact support.",
    })
  }

  const normalizedEmail = email.toLowerCase()

  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data: customers } = await query.graph({
      entity: "customer",
      fields: ["id", "email", "first_name", "last_name"],
      filters: { email: normalizedEmail },
    })

    if (customers.length === 0) {
      return res.json(genericSuccessResponse)
    }

    const customer = customers[0]

    // Auth identities are keyed by email and shared across actor types. Verify
    // this identity belongs to the customer before requesting a reset token.
    const authModule = req.scope.resolve(Modules.AUTH)
    const [providerIdentity] = await authModule.listProviderIdentities(
      { entity_id: normalizedEmail, provider: "emailpass" },
      { select: ["id", "auth_identity_id"] }
    )

    if (!providerIdentity?.auth_identity_id) {
      return res.json(genericSuccessResponse)
    }

    const authIdentity = await authModule.retrieveAuthIdentity(
      providerIdentity.auth_identity_id
    )

    if (authIdentity.app_metadata?.customer_id !== customer.id) {
      return res.json(genericSuccessResponse)
    }

    // Medusa emits auth.password_reset with the real, single-use token. The
    // subscriber sends that exact token instead of handing it through memory.
    const resetResponse = await fetch(
      `${process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"}/auth/customer/emailpass/reset-password`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: normalizedEmail,
          metadata: {
            first_name: customer.first_name || "Customer",
          },
        }),
      }
    )

    if (!resetResponse.ok) {
      throw new Error("Failed to generate reset token")
    }

    return res.json({
      success: true,
      message: "Password reset email sent successfully",
    })
  } catch (error: any) {
    console.error("[PASSWORD RESET] Failed to request customer reset token", {
      message: error.message,
    })
    return res.json(genericSuccessResponse)
  }
}
