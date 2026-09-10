import { Resend } from "resend"
import { createHash } from "node:crypto"

export type EmailServiceOptions = {
  apiKey: string
  fromEmail: string
  replyTo?: string
  orderBcc: string[]
  welcomeBcc: string[]
  approvalBcc: string[]
}

type SendEmailInput = {
  to: string | string[]
  subject: string
  html: string
  text: string
  bcc?: string[]
  idempotencyKey?: string
}

type EmailResult = {
  success: boolean
  messageId?: string
  error?: string
  statusCode?: number
}

const splitAddresses = (value: string | undefined, defaults: string[]) =>
  value === undefined
    ? defaults
    : value
        .split(",")
        .map((address) => address.trim())
        .filter(Boolean)

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")

const toNumber = (value: unknown): number => {
  if (value === null || value === undefined) return 0
  if (typeof value === "number") return value
  if (typeof value === "string") return Number.parseFloat(value) || 0
  return Number(value) || 0
}

const formatMoney = (value: unknown, currency = "CAD") =>
  new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(toNumber(value))

const renderAddress = (address: any) => {
  if (!address) return ""

  const lines = [
    [address.first_name, address.last_name].filter(Boolean).join(" "),
    address.company,
    address.address_1,
    address.address_2,
    [address.city, address.province || address.province_code, address.postal_code]
      .filter(Boolean)
      .join(", "),
    address.country || address.country_code,
  ].filter(Boolean)

  return lines.map((line) => escapeHtml(line)).join("<br>")
}

const layout = (title: string, content: string) => `
  <!doctype html>
  <html>
    <body style="margin:0;background:#f5f5f5;font-family:Arial,sans-serif;color:#222;">
      <div style="max-width:640px;margin:0 auto;padding:32px 20px;">
        <div style="background:#fff;border-radius:8px;padding:32px;">
          <h1 style="font-size:24px;margin:0 0 24px;">${escapeHtml(title)}</h1>
          ${content}
          <p style="margin:32px 0 0;color:#666;">Best,<br>The BNT Wholesale Team<br>
            <a href="https://www.bntwholesale.com">www.bntwholesale.com</a>
          </p>
        </div>
      </div>
    </body>
  </html>
`

export default class EmailService {
  protected logger: any = console
  protected options: EmailServiceOptions
  private resend: Resend

  constructor() {
    this.logger = {
      info: (...args: any[]) => console.log(...args),
      debug: (...args: any[]) => console.log(...args),
      warn: (...args: any[]) => console.warn(...args),
      error: (...args: any[]) => console.error(...args),
    }

    this.options = {
      apiKey: process.env.RESEND_API_KEY || "",
      fromEmail: process.env.RESEND_FROM || "",
      replyTo: process.env.RESEND_REPLY_TO || undefined,
      orderBcc: splitAddresses(process.env.EMAIL_ORDER_BCC, [
        "info@bntbng.com",
        "bntwarehouse@rogers.com",
      ]),
      welcomeBcc: splitAddresses(process.env.EMAIL_WELCOME_BCC, [
        "info@bntbng.com",
        "bntwarehouse@rogers.com",
      ]),
      approvalBcc: splitAddresses(process.env.EMAIL_APPROVAL_BCC, [
        "info@bntbng.com",
      ]),
    }
    this.resend = new Resend(this.options.apiKey)
  }

  private configurationError(): string | undefined {
    if (!this.options.apiKey) return "Resend API key not configured"
    if (!this.options.fromEmail) return "Resend sender not configured"
    return undefined
  }

  private async sendEmail(input: SendEmailInput): Promise<EmailResult> {
    const configurationError = this.configurationError()
    if (configurationError) {
      this.logger.error(`[EMAIL SERVICE] ${configurationError}`)
      return { success: false, error: configurationError }
    }

    try {
      const payload = {
        from: this.options.fromEmail,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        ...(input.bcc?.length ? { bcc: input.bcc } : {}),
        ...(this.options.replyTo ? { replyTo: this.options.replyTo } : {}),
      }
      const { data, error } = input.idempotencyKey
        ? await this.resend.emails.send(payload, {
            idempotencyKey: input.idempotencyKey,
          })
        : await this.resend.emails.send(payload)

      if (error) {
        this.logger.error("[EMAIL SERVICE] Resend delivery failed", {
          to: input.to,
          subject: input.subject,
          message: error.message,
          statusCode: error.statusCode ?? undefined,
        })
        return {
          success: false,
          error: error.message,
          statusCode: error.statusCode ?? undefined,
        }
      }

      this.logger.info("[EMAIL SERVICE] Email sent with Resend", {
        to: input.to,
        subject: input.subject,
        messageId: data?.id,
      })
      return { success: true, messageId: data?.id }
    } catch (error: any) {
      const message = this.formatResendError(error)
      this.logger.error("[EMAIL SERVICE] Resend delivery failed", {
        to: input.to,
        subject: input.subject,
        message,
      })
      return { success: false, error: message, statusCode: error?.statusCode }
    }
  }

  async sendOrderPlacedEmail(data: {
    to: string
    order: any
    customer: any
  }): Promise<boolean> {
    const currency = data.order.currency_code || "CAD"
    const items = data.order.items || []
    const subtotal =
      items.reduce(
        (sum: number, item: any) =>
          sum + toNumber(item.unit_price) * toNumber(item.quantity),
        0
      ) || 0
    const shippingTotal =
      data.order.shipping_methods?.reduce(
        (sum: number, method: any) => sum + toNumber(method.amount),
        0
      ) || 0
    const taxTotal = toNumber(data.order.tax_total)
    const orderTotal =
      toNumber(data.order.total) || subtotal + shippingTotal + taxTotal
    const orderNumber = data.order.display_id || data.order.id
    const firstName =
      data.customer.first_name || data.order.shipping_address?.first_name || "Customer"

    const rows = items
      .map((item: any) => {
        const quantity = toNumber(item.quantity)
        const unitPrice = toNumber(item.unit_price)
        return `<tr>
          <td style="padding:10px;border-bottom:1px solid #ddd;">${escapeHtml(item.title || item.product_title || "Product")}</td>
          <td style="padding:10px;border-bottom:1px solid #ddd;">${escapeHtml(item.variant?.sku || item.variant_sku || item.sku || "N/A")}</td>
          <td style="padding:10px;border-bottom:1px solid #ddd;text-align:center;">${quantity}</td>
          <td style="padding:10px;border-bottom:1px solid #ddd;text-align:right;">${escapeHtml(formatMoney(unitPrice * quantity, currency))}</td>
        </tr>`
      })
      .join("")

    const html = layout(
      `Order ${orderNumber} confirmed`,
      `<p>Hi ${escapeHtml(firstName)},</p>
       <p>Thanks for your order. We’ve received it and will let you know when it ships.</p>
       <table style="width:100%;border-collapse:collapse;margin:24px 0;">
         <thead><tr><th align="left">Item</th><th align="left">SKU</th><th>Qty</th><th align="right">Total</th></tr></thead>
         <tbody>${rows}</tbody>
       </table>
       <p style="text-align:right;">Subtotal: ${escapeHtml(formatMoney(subtotal, currency))}<br>
       Shipping: ${escapeHtml(formatMoney(shippingTotal, currency))}<br>
       Tax: ${escapeHtml(formatMoney(taxTotal, currency))}<br>
       <strong>Total: ${escapeHtml(formatMoney(orderTotal, currency))}</strong></p>
       ${data.order.shipping_address ? `<h2 style="font-size:18px;">Shipping address</h2><p>${renderAddress(data.order.shipping_address)}</p>` : ""}`
    )

    const result = await this.sendEmail({
      to: data.to,
      bcc: this.options.orderBcc,
      subject: `Order ${orderNumber} confirmed`,
      html,
      text: `Hi ${firstName}, your order ${orderNumber} has been received. Total: ${formatMoney(orderTotal, currency)}.`,
      idempotencyKey: `order-confirmed/${data.order.id}`,
    })
    return result.success
  }

  async sendCustomerConfirmationEmail(data: {
    to: string
    customer: any
  }): Promise<boolean> {
    const firstName = data.customer.first_name || "Customer"
    const accountUrl = `${process.env.MEDUSA_STOREFRONT_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"}/account`
    const company = data.customer.company?.name
    const html = layout(
      "Welcome to BNT Wholesale",
      `<p>Hi ${escapeHtml(firstName)},</p>
       <p>Thank you for creating an account with us. We’re excited to have you on board.</p>
       ${company ? `<p>Your company <strong>${escapeHtml(company)}</strong> has been registered.</p>` : ""}
       <p><a href="${escapeHtml(accountUrl)}" style="display:inline-block;background:#111;color:#fff;padding:12px 20px;border-radius:4px;text-decoration:none;">Access your account</a></p>`
    )

    const result = await this.sendEmail({
      to: data.to,
      bcc: this.options.welcomeBcc,
      subject: "Welcome to BNT Wholesale",
      html,
      text: `Hi ${firstName}, thank you for creating a BNT Wholesale account. Access your account: ${accountUrl}`,
    })
    return result.success
  }

  async sendApprovalEmail(data: {
    to: string
    customer: any
  }): Promise<boolean> {
    const firstName = data.customer.first_name || "Customer"
    const html = layout(
      "Your BNT Wholesale account is approved",
      `<p>Hi ${escapeHtml(firstName)},</p>
       <p>Your account has been approved — welcome to BNT Wholesale! You now have full access to shop our store, where you’ll find the best deals on top technology products across the country.</p>
       <p>Happy shopping!</p>`
    )

    const result = await this.sendEmail({
      to: data.to,
      bcc: this.options.approvalBcc,
      subject: "Welcome to BNT Wholesale!",
      html,
      text: `Hi ${firstName}, your BNT Wholesale account has been approved. You now have full access to shop our store.`,
    })
    return result.success
  }

  async sendOrderShippedEmail(data: {
    to: string
    order: any
    fulfillment: any
    customer: any
  }): Promise<boolean> {
    const orderNumber = data.order.display_id || data.order.id
    const firstName = data.customer.first_name || "Customer"
    const trackingNumbers: string[] = data.fulfillment.tracking_numbers || []
    const trackingLinks = trackingNumbers.map((number, index) => ({
      number,
      url: data.fulfillment.tracking_links?.[index]?.url,
    }))
    const trackingHtml = trackingLinks.length
      ? `<ul>${trackingLinks
          .map(({ number, url }) =>
            url
              ? `<li><a href="${escapeHtml(url)}">${escapeHtml(number)}</a></li>`
              : `<li>${escapeHtml(number)}</li>`
          )
          .join("")}</ul>`
      : "<p>Tracking information will be available soon.</p>"
    const itemRows = (data.fulfillment.items || [])
      .map((fulfillmentItem: any) => {
        const lineItemId = fulfillmentItem.line_item_id || fulfillmentItem.id
        const orderItem = data.order.items?.find(
          (item: any) => item.id === lineItemId
        )
        return `<li>${escapeHtml(orderItem?.title || fulfillmentItem.title || "Product")} × ${escapeHtml(fulfillmentItem.quantity || 1)}</li>`
      })
      .join("")

    const html = layout(
      `Order ${orderNumber} has shipped`,
      `<p>Hi ${escapeHtml(firstName)},</p>
       <p>Your order is on its way.</p>
       <h2 style="font-size:18px;">Tracking</h2>${trackingHtml}
       ${itemRows ? `<h2 style="font-size:18px;">Items</h2><ul>${itemRows}</ul>` : ""}
       ${data.order.shipping_address ? `<h2 style="font-size:18px;">Shipping address</h2><p>${renderAddress(data.order.shipping_address)}</p>` : ""}`
    )

    const result = await this.sendEmail({
      to: data.to,
      subject: `Order ${orderNumber} has shipped`,
      html,
      text: `Hi ${firstName}, your order ${orderNumber} has shipped.${trackingNumbers.length ? ` Tracking: ${trackingNumbers.join(", ")}` : ""}`,
      idempotencyKey: `shipment-created/${data.fulfillment.id}`,
    })
    return result.success
  }

  async sendPasswordResetEmail(data: {
    to: string
    customer: any
    token: string
    actorType?: "customer" | "user"
  }): Promise<void> {
    const actorType = data.actorType || "customer"
    const isCustomer = actorType === "customer"
    const firstName = isCustomer
      ? data.customer.first_name || "Customer"
      : "Admin"
    const baseUrl = isCustomer
      ? process.env.MEDUSA_STOREFRONT_URL || "http://localhost:8000"
      : process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
    const resetUrl = new URL(
      isCustomer ? "/reset-password" : "/app/reset-password",
      baseUrl
    )
    resetUrl.searchParams.set("token", data.token)
    const subject = isCustomer
      ? "Reset your BNT Wholesale password"
      : "Reset your BNT Wholesale admin password"
    const html = layout(
      subject,
      `<p>Hi ${escapeHtml(firstName)},</p>
       <p>We received a request to reset your password. This link is single-use.</p>
       <p><a href="${escapeHtml(resetUrl.toString())}" style="display:inline-block;background:#111;color:#fff;padding:12px 20px;border-radius:4px;text-decoration:none;">Reset password</a></p>
       <p>If you didn’t request this, you can ignore this email.</p>`
    )

    let lastError = "Password reset email failed"
    const tokenHash = createHash("sha256").update(data.token).digest("hex")
    for (let attempt = 1; attempt <= 3; attempt++) {
      const result = await this.sendEmail({
        to: data.to,
        subject,
        html,
        text: `Hi ${firstName}, reset your password using this single-use link: ${resetUrl.toString()}`,
        idempotencyKey: `password-reset/${tokenHash}`,
      })
      if (result.success) return
      lastError = result.error || lastError
      const retryable =
        result.statusCode === undefined ||
        result.statusCode === 429 ||
        result.statusCode >= 500
      if (attempt < 3 && retryable) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
      } else {
        break
      }
    }

    throw new Error(lastError)
  }

  async sendPaymentReminderEmail(data: {
    to: string
    customer: any
    order: any
  }): Promise<EmailResult> {
    const firstName = data.customer.first_name || "there"
    const orderNumber = data.order.display_id || data.order.id
    const total = formatMoney(
      data.order.total,
      data.order.currency_code || "CAD"
    )
    const html = layout(
      `Payment reminder for order ${orderNumber}`,
      `<p>Hi ${escapeHtml(firstName)},</p>
       <p>This is a friendly reminder that payment for order <strong>${escapeHtml(orderNumber)}</strong> is outstanding.</p>
       <p>Amount due: <strong>${escapeHtml(total)}</strong></p>
       <p>Please contact us if you have already paid or need assistance.</p>`
    )

    return this.sendEmail({
      to: data.to,
      subject: `Payment reminder for order ${orderNumber}`,
      html,
      text: `Hi ${firstName}, payment of ${total} for order ${orderNumber} is outstanding. Please contact us if you have already paid or need assistance.`,
    })
  }

  async sendInvoiceGeneratedEmail(data: {
    to: string
    customer: any
    order: any
  }): Promise<EmailResult> {
    const firstName = data.customer.first_name || "there"
    const orderNumber = data.order.display_id || data.order.id
    const html = layout(
      `Invoice generated for order ${orderNumber}`,
      `<p>Hi ${escapeHtml(firstName)},</p>
       <p>Your invoice for order <strong>${escapeHtml(orderNumber)}</strong> has been generated and is ready.</p>
       <p>Please contact us if you have any questions.</p>`
    )

    return this.sendEmail({
      to: data.to,
      subject: `Invoice generated for order ${orderNumber}`,
      html,
      text: `Hi ${firstName}, your invoice for order ${orderNumber} has been generated and is ready.`,
    })
  }

  private formatResendError(error: any): string {
    return error?.message || error?.name || "Unknown Resend error"
  }
}
