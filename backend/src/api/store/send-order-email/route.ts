import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils";
import EmailService from "../../../services/email.service";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    console.log("🧪 [API] Order email endpoint called...");
    
    const { order_id } = req.body;
    
    if (!order_id) {
      return res.status(400).json({ 
        success: false, 
        message: "order_id is required" 
      });
    }
    
    console.log("📧 [API] Sending email for order:", order_id);
    
    const emailService = req.scope.resolve("emailService") as EmailService;
    const orderModuleService = req.scope.resolve(Modules.ORDER);
    const customerModuleService = req.scope.resolve(Modules.CUSTOMER);
    
    // Get full order details with relations
    const order = await orderModuleService.retrieveOrder(order_id, {
      relations: [
        "items",
        "items.variant",
        "items.product",
        "shipping_address",
        "billing_address",
        "shipping_methods",
        "payment_collections",
      ],
    });

    console.log("📦 [API] Order details:", {
      id: order.id,
      display_id: order.display_id,
      customer_id: order.customer_id,
      total: order.total,
      items_count: order.items?.length || 0,
    });

    if (!order?.customer_id) {
      return res.status(400).json({ 
        success: false, 
        message: "Order has no customer" 
      });
    }

    // Get customer details
    const customer = await customerModuleService.retrieveCustomer(order.customer_id, {
      relations: ["addresses"],
    });

    console.log("👤 [API] Customer details:", {
      customerId: customer.id,
      email: customer.email,
      name: `${customer.first_name} ${customer.last_name}`,
    });

    if (!customer?.email) {
      return res.status(400).json({ 
        success: false, 
        message: "Customer has no email address" 
      });
    }

    console.log("📤 [API] Sending order placed email...");

    const emailSent = await emailService.sendOrderPlacedEmail({
      to: customer.email,
      order: order,
      customer: customer,
    });

    if (emailSent) {
      console.log("✅ [API] Order confirmation email sent successfully!");
      res.json({ 
        success: true, 
        message: "Order confirmation email sent successfully!",
        order_id: order.id,
        order_display_id: order.display_id,
        email: customer.email
      });
    } else {
      console.log("❌ [API] Order confirmation email failed to send");
      res.status(500).json({ 
        success: false, 
        message: "Order confirmation email failed to send" 
      });
    }
    
  } catch (error: any) {
    console.error("❌ [API] Error sending order email:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error sending order email",
      error: error.message 
    });
  }
}
