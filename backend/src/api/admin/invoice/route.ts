import type { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { RemoteQueryFunction } from "@medusajs/framework/types"
import { INVOICE_MODULE } from "../../../modules/invoice"
import InvoiceService from "../../../services/invoice"
import EmailService from "../../../services/email.service"

type InvoiceRequestBody = {
  order_id: string
  fulfillment_id?: string
  fulfillment_index?: number
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { order_id, fulfillment_id } = req.query

  if (!order_id) {
    return res.status(400).json({ 
      message: "order_id is required" 
    })
  }

  const invoiceService: InvoiceService = req.scope.resolve(INVOICE_MODULE)

  try {
    const invoice = await invoiceService.retrieveInvoice(
      order_id as string,
      fulfillment_id as string
    )
    
    if (!invoice) {
      return res.status(404).json({ 
        message: "Invoice not found" 
      })
    }
    
    return res.json(invoice)
  } catch (error) {
    console.error('[AdminInvoiceRoute] Error retrieving invoice:', error)
    res.status(500).json({
      message: "Failed to retrieve invoice",
      error: error.message
    })
  }
}

export const POST = async (req: MedusaRequest<InvoiceRequestBody>, res: MedusaResponse) => {
  const { order_id, fulfillment_id, fulfillment_index } = req.body

  if (!order_id) {
    return res.status(400).json({ 
      message: "order_id is required" 
    })
  }

  const invoiceService: InvoiceService = req.scope.resolve(INVOICE_MODULE)

  try {
    if (fulfillment_id) {
            // Get the order with fulfillments and items using Remote Query
      const query = req.scope.resolve<RemoteQueryFunction>(ContainerRegistrationKeys.QUERY);
      
      const {
        data: [order],
      } = await query.graph(
        {
          entity: "order",
          fields: [
            "id",
            "display_id",
            "currency_code",
            "subtotal",
            "tax_total",
            "shipping_total",
            "total",
            "metadata",
            "items.*",
            "shipping_address.*",
            "billing_address.*",
            "fulfillments.id",
            "fulfillments.items.*",
            "region.*",
            "shipping_methods.*",
            "customer.*"
          ],
          filters: { id: order_id },
        },
        { throwIfKeyNotFound: true }
      );
      
      if (!order) {
        return res.status(404).json({ 
          message: `Order ${order_id} not found` 
        })
      }
      
      // Verify fulfillment exists in the order
      if (!order.fulfillments?.some((f: any) => f.id === fulfillment_id)) {
        return res.status(404).json({ 
          message: `Fulfillment ${fulfillment_id} not found in order ${order_id}` 
        })
      }

      const invoiceUrl = await invoiceService.generateInvoice(
        order_id,
        fulfillment_id,
        order,
        undefined,
        fulfillment_index
      )
      
      // Get the updated invoice details
      const invoice = await invoiceService.retrieveInvoice(
        order_id,
        fulfillment_id
      )

      // Send invoice notification email
      try {
        const emailService = req.scope.resolve("emailService") as EmailService;

        if (order.customer && order.customer.email) {
          console.log("📧 [INVOICE] Sending invoice notification email to customer:", order.customer.email);

          const emailResult = await emailService.sendInvoiceGeneratedEmail({
            to: order.customer.email,
            customer: order.customer,
            order: order,
          });

          if (emailResult.success) {
            console.log("✅ [INVOICE] Invoice notification email sent successfully!");
          } else {
            console.warn("⚠️ [INVOICE] Failed to send invoice notification email:", emailResult.error);
          }
        } else {
          console.warn("⚠️ [INVOICE] No customer email found for order:", order_id);
        }
      } catch (emailError: any) {
        console.error("❌ [INVOICE] Error sending invoice notification email:", emailError);
        // Don't fail the request if email fails
      }

      return res.json(invoice)
    } else {
      // Generate order invoice - get order data first
      const query = req.scope.resolve<RemoteQueryFunction>(ContainerRegistrationKeys.QUERY);
      
      const {
        data: [order],
      } = await query.graph(
        {
          entity: "order",
          fields: [
            "id",
            "display_id",
            "currency_code",
            "subtotal",
            "tax_total",
            "shipping_total",
            "total",
            "metadata",
            "items.*",
            "shipping_address.*",
            "billing_address.*",
            "region.*",
            "shipping_methods.*",
            "customer.*"
          ],
          filters: { id: order_id },
        },
        { throwIfKeyNotFound: true }
      );
      
      if (!order) {
        return res.status(404).json({ 
          message: `Order ${order_id} not found` 
        })
      }
      
      const invoiceUrl = await invoiceService.generateInvoice(order_id, undefined, order, undefined)

      // Get the updated invoice details
      const invoice = await invoiceService.retrieveInvoice(order_id, undefined)

      // Send invoice notification email
      try {
        const emailService = req.scope.resolve("emailService") as EmailService;

        if (order.customer && order.customer.email) {
          console.log("📧 [INVOICE] Sending invoice notification email to customer:", order.customer.email);

          const emailResult = await emailService.sendInvoiceGeneratedEmail({
            to: order.customer.email,
            customer: order.customer,
            order: order,
          });

          if (emailResult.success) {
            console.log("✅ [INVOICE] Invoice notification email sent successfully!");
          } else {
            console.warn("⚠️ [INVOICE] Failed to send invoice notification email:", emailResult.error);
          }
        } else {
          console.warn("⚠️ [INVOICE] No customer email found for order:", order_id);
        }
      } catch (emailError: any) {
        console.error("❌ [INVOICE] Error sending invoice notification email:", emailError);
        // Don't fail the request if email fails
      }

      return res.json(invoice)
    }
  } catch (error) {
    console.error('[AdminInvoiceRoute] Error generating invoice:', error)
    res.status(500).json({
      message: "Failed to generate invoice",
      error: error.message
    })
  }
}
