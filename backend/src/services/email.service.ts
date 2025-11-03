import sgMail from "@sendgrid/mail";

export type EmailServiceOptions = {
  apiKey: string;
  fromEmail: string;
  customerConfirmationTemplateId: string;
  orderPlacedTemplateId: string;
  orderShippedTemplateId: string;
  customerResetPasswordTemplateId: string;
  paymentReminderTemplateId: string;
  invoiceGeneratedTemplateId: string;
};

export default class EmailService {
  protected logger: any = console;
  protected options: EmailServiceOptions;

  constructor() {
    this.logger = {
      info: (...args: any[]) => console.log(...args),
      debug: (...args: any[]) => console.log(...args),
      warn: (...args: any[]) => console.warn(...args),
      error: (...args: any[]) => console.error(...args),
    };

    this.options = {
      apiKey: process.env.SENDGRID_API_KEY || "",
      fromEmail: process.env.SENDGRID_FROM || "noreply@example.com",
      customerConfirmationTemplateId: process.env.SENDGRID_CUSTOMER_CONFIRMATION_TEMPLATE || "",
      orderPlacedTemplateId: process.env.SENDGRID_ORDER_PLACED_TEMPLATE || "",
      orderShippedTemplateId: process.env.SENDGRID_ORDER_SHIPPED_TEMPLATE || "",
      customerResetPasswordTemplateId: process.env.SENDGRID_CUSTOMER_RESET_PASSWORD_TEMPLATE || "",
      paymentReminderTemplateId: process.env.SENDGRID_PAYMENT_REMINDER_TEMPLATE || "",
      invoiceGeneratedTemplateId: process.env.SENDGRID_INVOICE_GENERATED_TEMPLATE || "d-e125b10a2a48434e963bd59d01a0e111",
    };

    if (this.options.apiKey) {
      sgMail.setApiKey(this.options.apiKey);
    }
  }

  async sendOrderPlacedEmail(data: {
    to: string;
    order: any;
    customer: any;
  }): Promise<boolean> {
    this.logger.info("========== ORDER PLACED EMAIL START ==========");
    this.logger.info("📧 [EMAIL SERVICE] sendOrderPlacedEmail called with:", {
      to: data.to,
      order_id: data.order.id,
      order_display_id: data.order.display_id,
      customer_email: data.customer.email,
    });

    if (!this.options.apiKey) {
      this.logger.error("❌ [EMAIL SERVICE] SendGrid API key not configured!");
      return false;
    }

    if (!this.options.orderPlacedTemplateId) {
      this.logger.error("❌ [EMAIL SERVICE] Order placed template ID not configured!");
      return false;
    }

    this.logger.info("✅ [EMAIL SERVICE] Configuration check passed:", {
      hasApiKey: !!this.options.apiKey,
      templateId: this.options.orderPlacedTemplateId,
      fromEmail: this.options.fromEmail,
    });

    try {
      // Helper function to convert BigNumber to number
      const toNumber = (value: any): number => {
        if (value === null || value === undefined) return 0;
        if (typeof value === 'number') return value;
        if (typeof value === 'string') return parseFloat(value) || 0;
        // Handle BigNumber or other objects with numeric conversion
        return Number(value) || 0;
      };

      // Calculate order totals
      const subtotal = data.order.items?.reduce((sum: number, item: any) =>
        sum + (toNumber(item.unit_price) * toNumber(item.quantity)), 0) || 0;
      const shippingTotal = data.order.shipping_methods?.reduce((sum: number, method: any) =>
        sum + toNumber(method.amount), 0) || 0;
      const taxTotal = toNumber(data.order.tax_total);
      const orderTotal = toNumber(data.order.total) || subtotal + shippingTotal + taxTotal;

      // Format template data to match SendGrid template
      const templateData = {
        // Customer info
        first_name: data.customer.first_name || data.order.shipping_address?.first_name || "",
        last_name: data.customer.last_name || data.order.shipping_address?.last_name || "",
        customer_name: `${data.customer.first_name} ${data.customer.last_name}`,
        customer_email: data.customer.email,

        // Order info
        order_number: data.order.display_id || data.order.id,
        order_id: data.order.id,
        order_display_id: data.order.display_id,
        order_date: new Date(data.order.created_at || Date.now()).toLocaleDateString(),

        // Line items
        line_items: data.order.items?.map((item: any) => {
          const unitPrice = toNumber(item.unit_price);
          const quantity = toNumber(item.quantity);
          return {
            name: item.title || item.product_title || "Product",
            sku: item.variant?.sku || item.sku || "N/A",
            quantity: quantity,
            price: unitPrice.toFixed(2),
            total: (unitPrice * quantity).toFixed(2),
          };
        }) || [],

        // Order summary
        order_summary: {
          subtotal: subtotal.toFixed(2),
          shipping: shippingTotal.toFixed(2),
          tax: taxTotal.toFixed(2),
          total: orderTotal.toFixed(2),
        },
        
        // Shipping address
        shipping_address: {
          first_name: data.order.shipping_address?.first_name || "",
          last_name: data.order.shipping_address?.last_name || "",
          address_1: data.order.shipping_address?.address_1 || "",
          address_2: data.order.shipping_address?.address_2 || "",
          city: data.order.shipping_address?.city || "",
          province: data.order.shipping_address?.province || data.order.shipping_address?.province_code || "",
          postal_code: data.order.shipping_address?.postal_code || "",
          country: data.order.shipping_address?.country || data.order.shipping_address?.country_code || "",
        },
        billing_address: data.order.billing_address,
      };

      const msg = {
        to: [data.to, 'info@bntbng.com'],
        from: this.options.fromEmail,
        templateId: this.options.orderPlacedTemplateId,
        dynamicTemplateData: templateData,
      };

      this.logger.info("📤 [EMAIL SERVICE] Sending email to SendGrid...", {
        to: msg.to,
        from: msg.from,
        templateId: msg.templateId,
        itemCount: templateData.line_items.length,
        orderTotal: templateData.order_summary.total,
      });

      const [response] = await sgMail.send(msg);

      this.logger.info("✅ [EMAIL SERVICE] Email sent successfully!", {
        statusCode: response.statusCode,
        messageId: response.headers?.['x-message-id'],
      });
      this.logger.info("========== ORDER PLACED EMAIL END ==========");

      return true;
    } catch (error: any) {
      this.logger.error("❌ [EMAIL SERVICE] Failed to send order placed email:", {
        message: error.message,
        code: error.code,
        response: error.response?.body,
      });
      this.logger.error("❌ [EMAIL SERVICE] Full error:", error);
      this.logger.info("========== ORDER PLACED EMAIL END ==========");
      return false;
    }
  }

  async sendCustomerConfirmationEmail(data: {
    to: string;
    customer: any;
  }): Promise<boolean> {
    this.logger.info("========== CUSTOMER CONFIRMATION EMAIL START ==========");
    this.logger.info("📧 [EMAIL SERVICE] sendCustomerConfirmationEmail called with:", {
      to: data.to,
      customer_email: data.customer.email,
      customer_name: `${data.customer.first_name} ${data.customer.last_name}`,
    });

    if (!this.options.apiKey) {
      this.logger.error("❌ [EMAIL SERVICE] SendGrid API key not configured!");
      return false;
    }

    if (!this.options.customerConfirmationTemplateId) {
      this.logger.error("❌ [EMAIL SERVICE] Customer confirmation template ID not configured!");
      return false;
    }

    this.logger.info("✅ [EMAIL SERVICE] Configuration check passed:", {
      hasApiKey: !!this.options.apiKey,
      templateId: this.options.customerConfirmationTemplateId,
      fromEmail: this.options.fromEmail,
    });

    try {
      const templateData = {
        first_name: data.customer.first_name || "Customer",
        last_name: data.customer.last_name || "",
        customer_name: `${data.customer.first_name} ${data.customer.last_name}`,
        customer_email: data.customer.email,
        company_name: data.customer.company?.name || "",
      };

      const msg = {
        to: data.to,
        from: this.options.fromEmail,
        templateId: this.options.customerConfirmationTemplateId,
        dynamicTemplateData: templateData,
      };

      this.logger.info("📤 [EMAIL SERVICE] Sending welcome email to SendGrid...", {
        to: msg.to,
        from: msg.from,
        templateId: msg.templateId,
      });

      const [response] = await sgMail.send(msg);

      this.logger.info("✅ [EMAIL SERVICE] Welcome email sent successfully!", {
        statusCode: response.statusCode,
        messageId: response.headers?.['x-message-id'],
      });
      this.logger.info("========== CUSTOMER CONFIRMATION EMAIL END ==========");

      return true;
    } catch (error: any) {
      this.logger.error("❌ [EMAIL SERVICE] Failed to send welcome email:", {
        message: error.message,
        code: error.code,
        response: error.response?.body,
      });
      this.logger.error("❌ [EMAIL SERVICE] Full error:", error);
      this.logger.info("========== CUSTOMER CONFIRMATION EMAIL END ==========");
      return false;
    }
  }

  async sendOrderShippedEmail(data: {
    to: string;
    order: any;
    fulfillment: any;
    customer: any;
  }): Promise<boolean> {
    this.logger.info("========== ORDER SHIPPED EMAIL START ==========");
    this.logger.info("📧 [EMAIL SERVICE] sendOrderShippedEmail called with:", {
      to: data.to,
      order_id: data.order.id,
      order_display_id: data.order.display_id,
      customer_email: data.customer.email,
      tracking_numbers: data.fulfillment.tracking_numbers,
    });

    if (!this.options.apiKey) {
      this.logger.error("❌ [EMAIL SERVICE] SendGrid API key not configured!");
      return false;
    }

    if (!this.options.orderShippedTemplateId) {
      this.logger.error("❌ [EMAIL SERVICE] Order shipped template ID not configured!");
      return false;
    }

    this.logger.info("✅ [EMAIL SERVICE] Configuration check passed:", {
      hasApiKey: !!this.options.apiKey,
      templateId: this.options.orderShippedTemplateId,
      fromEmail: this.options.fromEmail,
    });

    try {
      // Format tracking links for template
      const trackingLinks = data.fulfillment.tracking_numbers?.map((num: string, index: number) => ({
        number: num,
        url: data.fulfillment.tracking_links?.[index]?.url || "#"
      })) || [];

      // Format items for template - need to match order items with fulfillment items
      const formattedItems = data.fulfillment.items?.map((fulfillmentItem: any) => {
        // Find the corresponding order item
        const orderItem = data.order.items?.find((oi: any) => oi.id === fulfillmentItem.id);
        
        return {
          item: {
            title: orderItem?.title || orderItem?.product_title || fulfillmentItem.title || "Product",
            variant: {
              sku: orderItem?.variant_sku || orderItem?.variant?.sku || orderItem?.sku || "N/A"
            }
          },
          quantity: fulfillmentItem.quantity || 1,
        };
      }) || [];

      const templateData = {
        // Customer info - matching template variable names
        first_name: data.customer.first_name || "",
        last_name: data.customer.last_name || "",
        customer_name: `${data.customer.first_name} ${data.customer.last_name}`,
        customer_email: data.customer.email,
        
        // Order info - matching template variable names
        order_number: data.order.display_id || data.order.id,
        order_id: data.order.id,
        order_display_id: data.order.display_id,
        
        // Shipment info
        shipped_date: new Date().toLocaleDateString(),
        carrier: data.fulfillment.provider_id || "Standard Shipping",
        
        // Tracking info - as array for template
        tracking_links: trackingLinks,
        tracking_number: data.fulfillment.tracking_numbers?.[0] || "N/A", // Keep for backwards compatibility
        tracking_url: data.fulfillment.tracking_links?.[0]?.url || "", // Keep for backwards compatibility
        
        // Items - matching template structure
        items: formattedItems,
        
        // Address
        shipping_address: data.order.shipping_address,
      };

      const msg = {
        to: data.to,
        from: this.options.fromEmail,
        templateId: this.options.orderShippedTemplateId,
        dynamicTemplateData: templateData,
      };

      this.logger.info("📤 [EMAIL SERVICE] Sending shipment email to SendGrid...", {
        to: msg.to,
        from: msg.from,
        templateId: msg.templateId,
        itemCount: formattedItems.length,
        trackingCount: trackingLinks.length,
      });

      const [response] = await sgMail.send(msg);

      this.logger.info("✅ [EMAIL SERVICE] Shipment email sent successfully!", {
        statusCode: response.statusCode,
        messageId: response.headers?.['x-message-id'],
      });
      this.logger.info("========== ORDER SHIPPED EMAIL END ==========");

      return true;
    } catch (error: any) {
      this.logger.error("❌ [EMAIL SERVICE] Failed to send shipment email:", {
        message: error.message,
        code: error.code,
        response: error.response?.body,
      });
      this.logger.error("❌ [EMAIL SERVICE] Full error:", error);
      this.logger.info("========== ORDER SHIPPED EMAIL END ==========");
      return false;
    }
  }

  async sendPasswordResetEmail(data: {
    to: string;
    customer: any;
    token: string;
  }): Promise<void> {
    this.logger.info("========== PASSWORD RESET EMAIL START ==========");
    this.logger.info("📧 [EMAIL SERVICE] sendPasswordResetEmail called with:", {
      to: data.to,
      customer_email: data.customer.email,
      customer_name: `${data.customer.first_name} ${data.customer.last_name}`,
      has_token: !!data.token,
    });

    if (!this.options.apiKey) {
      this.logger.error("❌ [EMAIL SERVICE] SendGrid API key not configured!");
      return;
    }

    if (!this.options.customerResetPasswordTemplateId) {
      this.logger.error("❌ [EMAIL SERVICE] Password reset template ID not configured!");
      return;
    }

    this.logger.info("✅ [EMAIL SERVICE] Configuration check passed:", {
      hasApiKey: !!this.options.apiKey,
      templateId: this.options.customerResetPasswordTemplateId,
      fromEmail: this.options.fromEmail,
    });

    // Simple retry mechanism - try 3 times
    let lastError: any = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        this.logger.info(`🔄 [EMAIL SERVICE] Attempt ${attempt}/3 to send password reset email`);

        const resetUrl = `${process.env.MEDUSA_STOREFRONT_URL || "http://localhost:8000"}/reset-password?token=${data.token}`;

        const templateData = {
          first_name: data.customer.first_name,
          reset_password_url: resetUrl,
        };

        const msg = {
          to: data.to,
          from: this.options.fromEmail,
          templateId: this.options.customerResetPasswordTemplateId,
          dynamicTemplateData: templateData,
        };

        this.logger.info("📤 [EMAIL SERVICE] Sending password reset email to SendGrid...", {
          to: msg.to,
          from: msg.from,
          templateId: msg.templateId,
          attempt: attempt,
        });

        const [response] = await sgMail.send(msg);

        this.logger.info("✅ [EMAIL SERVICE] Password reset email sent successfully!", {
          statusCode: response.statusCode,
          messageId: response.headers?.['x-message-id'],
          attempt: attempt,
        });
        this.logger.info("========== PASSWORD RESET EMAIL END ==========");

        return; // Success - exit retry loop
      } catch (error: any) {
        lastError = error;
        this.logger.error(`❌ [EMAIL SERVICE] Attempt ${attempt}/3 failed:`, {
          message: error.message,
          code: error.code,
          response: error.response?.body,
        });

        if (attempt < 3) {
          this.logger.info(`⏳ [EMAIL SERVICE] Waiting 2 seconds before retry...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    // All attempts failed
    this.logger.error("❌ [EMAIL SERVICE] All 3 attempts failed to send password reset email");
    this.logger.error("❌ [EMAIL SERVICE] Final error:", lastError);
    this.logger.info("========== PASSWORD RESET EMAIL END ==========");
    throw lastError;
  }

  async sendPaymentReminderEmail(data: {
    to: string;
    customer: any;
    order: any;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    this.logger.info("📧 [EMAIL SERVICE] Starting payment reminder email send...");
    this.logger.info("📧 [EMAIL SERVICE] Email data:", {
      to: data.to,
      customer_name: `${data.customer.first_name} ${data.customer.last_name}`,
      order_number: data.order.display_id,
      order_id: data.order.id
    });

    if (!this.options.apiKey) {
      const errorMsg = "SendGrid API key not configured";
      this.logger.error("❌ [EMAIL SERVICE] Error:", errorMsg);
      return { success: false, error: errorMsg };
    }

    if (!this.options.paymentReminderTemplateId) {
      const errorMsg = "Payment reminder template ID not configured";
      this.logger.error("❌ [EMAIL SERVICE] Error:", errorMsg);
      return { success: false, error: errorMsg };
    }

    try {
      // Helper function to convert BigNumber to number
      const toNumber = (value: any): number => {
        if (value === null || value === undefined) return 0;
        if (typeof value === 'number') return value;
        if (typeof value === 'string') return parseFloat(value) || 0;
        return Number(value) || 0;
      };

      // Prepare template data for SendGrid
      const templateData = {
        first_name: data.customer.first_name || 'there',
        order_number: data.order.display_id,
        order_id: data.order.id,
        customer_name: `${data.customer.first_name || ''} ${data.customer.last_name || ''}`.trim(),
        customer_email: data.customer.email,
        order_total: toNumber(data.order.total).toFixed(2),
        currency_code: data.order.currency_code || 'CAD'
      };

      this.logger.info("📧 [EMAIL SERVICE] Template data:", templateData);

      const msg = {
        to: data.to,
        from: this.options.fromEmail,
        templateId: this.options.paymentReminderTemplateId,
        dynamicTemplateData: templateData,
      };

      this.logger.info("📧 [EMAIL SERVICE] Sending email with SendGrid template...");
      this.logger.info("📧 [EMAIL SERVICE] Email message:", {
        to: msg.to,
        from: msg.from,
        templateId: msg.templateId,
        template_data: templateData
      });

      const [response] = await sgMail.send(msg);
      
      this.logger.info("✅ [EMAIL SERVICE] Email sent successfully!");
      this.logger.info("✅ [EMAIL SERVICE] SendGrid response:", {
        statusCode: response.statusCode,
        messageId: response.headers?.['x-message-id'],
        headers: response.headers
      });

      return { 
        success: true, 
        messageId: response.headers?.['x-message-id'] as string 
      };
    } catch (error: any) {
      const errorMsg = this.formatSendGridError(error);
      this.logger.error("❌ [EMAIL SERVICE] Failed to send email:", errorMsg);
      this.logger.error("❌ [EMAIL SERVICE] Full error:", error);
      
      return { 
        success: false, 
        error: errorMsg 
      };
    }
  }

  async sendInvoiceGeneratedEmail(data: {
    to: string;
    customer: any;
    order: any;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    this.logger.info("========== INVOICE GENERATED EMAIL START ==========");
    this.logger.info("📧 [EMAIL SERVICE] sendInvoiceGeneratedEmail called with:", {
      to: data.to,
      customer_name: `${data.customer.first_name} ${data.customer.last_name}`,
      order_number: data.order.display_id,
      order_id: data.order.id
    });

    if (!this.options.apiKey) {
      const errorMsg = "SendGrid API key not configured";
      this.logger.error("❌ [EMAIL SERVICE] Error:", errorMsg);
      return { success: false, error: errorMsg };
    }

    if (!this.options.invoiceGeneratedTemplateId) {
      const errorMsg = "Invoice generated template ID not configured";
      this.logger.error("❌ [EMAIL SERVICE] Error:", errorMsg);
      return { success: false, error: errorMsg };
    }

    try {
      // Prepare template data for SendGrid
      const templateData = {
        first_name: data.customer.first_name || 'there',
        customer_name: `${data.customer.first_name || ''} ${data.customer.last_name || ''}`.trim(),
        order_number: data.order.display_id,
        order_id: data.order.id,
      };

      this.logger.info("📧 [EMAIL SERVICE] Template data:", templateData);

      const msg = {
        to: data.to,
        from: this.options.fromEmail,
        templateId: this.options.invoiceGeneratedTemplateId,
        dynamicTemplateData: templateData,
      };

      this.logger.info("📧 [EMAIL SERVICE] Sending invoice notification email with SendGrid template...");
      this.logger.info("📧 [EMAIL SERVICE] Email message:", {
        to: msg.to,
        from: msg.from,
        templateId: msg.templateId,
      });

      const [response] = await sgMail.send(msg);

      this.logger.info("✅ [EMAIL SERVICE] Invoice notification email sent successfully!");
      this.logger.info("✅ [EMAIL SERVICE] SendGrid response:", {
        statusCode: response.statusCode,
        messageId: response.headers?.['x-message-id'],
      });
      this.logger.info("========== INVOICE GENERATED EMAIL END ==========");

      return {
        success: true,
        messageId: response.headers?.['x-message-id'] as string
      };
    } catch (error: any) {
      const errorMsg = this.formatSendGridError(error);
      this.logger.error("❌ [EMAIL SERVICE] Failed to send invoice notification email:", errorMsg);
      this.logger.error("❌ [EMAIL SERVICE] Full error:", error);
      this.logger.info("========== INVOICE GENERATED EMAIL END ==========");

      return {
        success: false,
        error: errorMsg
      };
    }
  }

  private formatSendGridError(error: any): string {
    if (error.response?.body?.errors) {
      return error.response.body.errors.map((e: any) => e.message).join(', ');
    }
    return error.message || 'Unknown error';
  }
}