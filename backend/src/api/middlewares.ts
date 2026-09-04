import {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { defineMiddlewares } from "@medusajs/medusa";
import { adminMiddlewares } from "./admin/middlewares";
import { storeMiddlewares } from "./store/middlewares";
import { z } from "@medusajs/framework/zod";
import { Modules } from "@medusajs/framework/utils";
import EmailService from "../services/email.service";
import { serveLocalUpload } from "./uploads-middleware";

// Order email middleware
const sendOrderEmailAfterComplete = async (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  // Store original json method
  const originalJson = res.json.bind(res);
  
  // Override json method to intercept response
  res.json = function(data: any) {
    // Check if this is a successful order creation
    if (data?.order?.id) {
      // Use the order data from the response directly
      const order = data.order;
      let customerEmail = order.email;
      
      // Send email asynchronously
      (async () => {
        try {
          // First try to get customer from auth token
          const authToken = req.headers.authorization;
          let customer: any = null;
          
          if (!customerEmail && authToken) {
            try {
              const tokenPayload = authToken.split('.')[1];
              const decodedToken = JSON.parse(Buffer.from(tokenPayload, 'base64').toString());
              const customerId = decodedToken.actor_id || decodedToken.app_metadata?.customer_id;
              
              if (customerId && customerId.startsWith('cus_')) {
                const customerModule = req.scope.resolve(Modules.CUSTOMER);
                customer = await customerModule.retrieveCustomer(customerId);
                customerEmail = customer?.email;
              }
            } catch (e) {
              // Silently fail
            }
          }
          
          // If no email on order and we have customer_id, try to fetch from customer
          if (!customerEmail && order.customer_id) {
            const customerModule = req.scope.resolve(Modules.CUSTOMER);
            try {
              customer = await customerModule.retrieveCustomer(order.customer_id);
              customerEmail = customer?.email;
            } catch (e) {
              // Silently fail
            }
          }
          
          if (!customerEmail) {
            return;
          }
          
          const emailService = req.scope.resolve("emailService") as EmailService;
          
          // Use the customer we already fetched, or create a fallback
          if (!customer) {
            customer = {
              id: order.customer_id || "guest",
              email: customerEmail,
              first_name: order.shipping_address?.first_name || order.billing_address?.first_name || "",
              last_name: order.shipping_address?.last_name || order.billing_address?.last_name || "",
            };
          }
          
          await emailService.sendOrderPlacedEmail({
            to: customerEmail,
            order: order,
            customer: customer,
          });
          
        } catch (error: any) {
          // Silently fail - don't block order completion
        }
      })();
    }
    
    // Call original json method
    return originalJson(data);
  };
  
  next();
};

export default defineMiddlewares({
  routes: [
    ...adminMiddlewares,
    ...storeMiddlewares,
    {
      matcher: "/store/uploads/*path",
      method: "GET",
      middlewares: [serveLocalUpload],
    },
    {
      matcher: "/admin/uploads/*path",
      method: "GET",
      middlewares: [serveLocalUpload],
    },
    {
      matcher: "/store/carts/:id/complete",
      method: "POST",
      middlewares: [sendOrderEmailAfterComplete],
    },
    {
      matcher: "/admin/orders/{id}/fulfillments",
      method: "POST",
      additionalDataValidator: {
        shipping_amount: z.string().optional(),
      },
    },
  ],
});
