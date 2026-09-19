import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import EmailService from "../services/email.service"

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
  container,
}: SubscriberArgs<PasswordResetEventData>) {
  const { entity_id: email, token, actor_type, metadata } = data

  if (!token || !email || !["customer", "user"].includes(actor_type)) {
    return
  }

  const isCustomer = actor_type === "customer"

  try {
    const emailService = container.resolve("emailService") as EmailService
    await emailService.sendPasswordResetEmail({
      to: email,
      customer: {
        email,
        first_name: isCustomer ? metadata?.first_name || "Customer" : "Admin",
      },
      token,
      actorType: actor_type as "customer" | "user",
    })

    console.log("[PASSWORD RESET] Reset email sent", {
      actor_type,
    })
  } catch (error: any) {
    console.error("[PASSWORD RESET] Failed to send reset email", {
      actor_type,
      message: error.message,
    })
  }
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
  context: {
    subscriberId: "password-reset-email-delivery",
  },
}
