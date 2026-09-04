import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import sgMail from "@sendgrid/mail"

type PasswordResetEventData = {
  entity_id: string
  token: string
  actor_type: string
  metadata?: {
    first_name?: string
  }
}

export default async function passwordResetHandler({
  event: { data },
}: SubscriberArgs<PasswordResetEventData>) {
  const { entity_id: email, token, actor_type, metadata } = data

  if (!token || !email || !["customer", "user"].includes(actor_type)) {
    return
  }

  const apiKey = process.env.SENDGRID_API_KEY
  const templateId = process.env.SENDGRID_CUSTOMER_RESET_PASSWORD_TEMPLATE
  const fromEmail = process.env.SENDGRID_FROM || "noreply@example.com"

  if (!apiKey || !templateId) {
    console.error("[PASSWORD RESET] SendGrid configuration is incomplete")
    return
  }

  const isCustomer = actor_type === "customer"
  const baseUrl = isCustomer
    ? process.env.MEDUSA_STOREFRONT_URL || "http://localhost:8000"
    : process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
  const resetPath = isCustomer ? "/reset-password" : "/app/reset-password"
  const resetUrl = `${baseUrl}${resetPath}?token=${token}`

  try {
    sgMail.setApiKey(apiKey)
    const [response] = await sgMail.send({
      to: email,
      from: fromEmail,
      templateId,
      dynamicTemplateData: {
        first_name: isCustomer ? metadata?.first_name || "Customer" : "Admin",
        reset_password_url: resetUrl,
        reset_password_url_text: resetUrl,
        email,
        subject: isCustomer
          ? "Reset Your Password"
          : "Reset Your Admin Password",
      },
    })

    console.log("[PASSWORD RESET] Reset email sent", {
      actor_type,
      statusCode: response.statusCode,
      messageId: response.headers?.["x-message-id"],
    })
  } catch (error: any) {
    console.error("[PASSWORD RESET] Failed to send reset email", {
      actor_type,
      message: error.message,
      code: error.code,
      response: error.response?.body,
    })
  }
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
  context: {
    subscriberId: "password-reset-email-delivery",
  },
}
