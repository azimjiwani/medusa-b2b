import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { captureToken } from "../api/store/send-password-reset-email/route";
import sgMail from "@sendgrid/mail";

export default async function passwordResetHandler({
  event: { data },
}: SubscriberArgs<{ entity_id: string; token: string; actor_type: string }>) {
  const { entity_id: email, token, actor_type } = data;
  
  console.log("========== PASSWORD RESET SUBSCRIBER START ==========");
  console.log("📧 [PASSWORD RESET] Event received:", {
    email,
    actor_type,
    has_token: !!token,
  });

  if (!token || !email) {
    console.log("❌ [PASSWORD RESET] Missing token or email, skipping");
    return;
  }

  // Handle customer password resets - capture token for custom API route
  if (actor_type === "customer") {
    console.log("📧 [PASSWORD RESET] Customer reset - capturing token for API route");
    try {
      captureToken(email, token);
    } catch (error: any) {
      console.error("Failed to capture password reset token:", error.message);
    }
    return;
  }

  // Handle admin user password resets - send email directly
  if (actor_type === "user") {
    console.log("📧 [PASSWORD RESET] Admin user reset - sending email directly");
    
    const apiKey = process.env.SENDGRID_API_KEY;
    const templateId = process.env.SENDGRID_CUSTOMER_RESET_PASSWORD_TEMPLATE;
    const fromEmail = process.env.SENDGRID_FROM || "noreply@example.com";
    
    if (!apiKey) {
      console.error("❌ [PASSWORD RESET] SendGrid API key not configured!");
      return;
    }
    
    if (!templateId) {
      console.error("❌ [PASSWORD RESET] Password reset template ID not configured!");
      return;
    }
    
    try {
      sgMail.setApiKey(apiKey);
      
      // Admin panel reset URL (different from storefront)
      const backendUrl = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000";
      const resetUrl = `${backendUrl}/app/reset-password?token=${token}`;
      
      console.log("📧 [PASSWORD RESET] Sending email to:", email);
      console.log("📧 [PASSWORD RESET] Reset URL:", resetUrl);
      
      const msg = {
        to: email,
        from: fromEmail,
        templateId: templateId,
        dynamicTemplateData: {
          first_name: "Admin",
          reset_password_url: resetUrl,
          reset_password_url_text: resetUrl,
          email: email,
          subject: "Reset Your Admin Password"
        }
      };
      
      const [response] = await sgMail.send(msg);
      
      console.log("✅ [PASSWORD RESET] Admin password reset email sent successfully!", {
        statusCode: response.statusCode,
        messageId: response.headers?.['x-message-id'],
      });
      
    } catch (error: any) {
      console.error("❌ [PASSWORD RESET] Failed to send admin password reset email:", {
        message: error.message,
        code: error.code,
        response: error.response?.body,
      });
    }
  }
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
  context: {
    subscriberId: "password-reset-token-capture",
  },
};