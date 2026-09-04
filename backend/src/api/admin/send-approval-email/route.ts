import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";
import sgMail from "@sendgrid/mail";

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { customerId } = req.body as {
    customerId: string;
  };

  if (!customerId) {
    return res.status(400).json({
      error: "Customer ID is required"
    });
  }

  try {
    // Fetch customer data using Medusa v2 module
    const customerModuleService = req.scope.resolve(Modules.CUSTOMER);
    const customer = await customerModuleService.retrieveCustomer(customerId);

    if (!customer) {
      return res.status(404).json({
        error: "Customer not found"
      });
    }

    const email = customer.email.toLowerCase();
    const firstName = customer.first_name || "Customer";

    // Initialize SendGrid
    sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p style="font-size: 16px; color: #333;">Hi ${firstName},</p>

        <p style="font-size: 16px; color: #333; line-height: 1.6;">
          Your account has been approved — welcome to BNT Wholesale! You now have full access to shop our store,
          where you'll find the best deals on top technology products across the country.
        </p>

        <p style="font-size: 16px; color: #333;">Happy shopping!</p>

        <p style="font-size: 16px; color: #333; margin-top: 30px;">
          Best,<br>
          The BNT Wholesale Team<br>
          <a href="https://www.bntwholesale.com" style="color: #007bff; text-decoration: none;">www.bntwholesale.com</a>
        </p>
      </div>
    `;

    // Send email to customer and BCC to info@bntbng.com
    const msg = {
      to: [email, 'info@bntbng.com'],
      from: process.env.SENDGRID_FROM || "noreply@example.com",
      subject: "Welcome to BNT Wholesale!",
      html: htmlContent,
    };

    try {
      const [response] = await sgMail.send(msg);

      return res.json({
        success: true,
        message: "Approval email sent successfully"
      });

    } catch (sendGridError: any) {
      console.error("[APPROVAL EMAIL] SendGrid error:", sendGridError);

      // Fallback: Direct HTTP request to SendGrid API
      const fallbackResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: email }, { email: 'info@bntbng.com' }]
          }],
          from: {
            email: process.env.SENDGRID_FROM || "noreply@example.com",
            name: "BNT Wholesale Team"
          },
          subject: "Welcome to BNT Wholesale!",
          content: [{
            type: 'text/html',
            value: htmlContent
          }]
        })
      });

      if (fallbackResponse.ok || fallbackResponse.status === 202) {
        return res.json({
          success: true,
          message: "Approval email sent successfully"
        });
      } else {
        const errorText = await fallbackResponse.text();
        console.error("[APPROVAL EMAIL] Fallback error:", errorText);
        throw new Error(`Email sending failed: ${errorText}`);
      }
    }

  } catch (error: any) {
    console.error("[APPROVAL EMAIL] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send approval email",
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
