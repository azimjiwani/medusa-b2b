import PDFDocument from "pdfkit"
import AWS from "aws-sdk"
import fs from "fs"
import path from "path"
import OrderInvoiceGenerator from "./order-invoice"
import FulfillmentInvoiceGenerator from "./fulfillment-invoice"
import { Client } from "pg"
import { randomUUID } from "crypto"

class InvoiceService {
  private orderInvoiceGenerator: OrderInvoiceGenerator
  private fulfillmentInvoiceGenerator: FulfillmentInvoiceGenerator
  private s3: AWS.S3

  constructor() {
    this.orderInvoiceGenerator = new OrderInvoiceGenerator()
    this.fulfillmentInvoiceGenerator = new FulfillmentInvoiceGenerator()

    // Initialize S3
    this.s3 = new AWS.S3({
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      region: process.env.S3_REGION
    })
  }

  private async saveInvoice(pdfBuffer: Buffer, folder: string, fileName: string): Promise<{ localPath: string, s3Url: string }> {
    // Save locally - COMMENTED OUT
    // const localFolder = path.join(__dirname, `../../../uploads/invoices/${folder}`)
    // const localPath = path.join(localFolder, fileName)
    // await fs.promises.mkdir(localFolder, { recursive: true })
    // await fs.promises.writeFile(localPath, pdfBuffer)
    // console.log(`[InvoiceService] Successfully saved invoice locally: ${localPath}`)

    const localPath = '' // Not saving locally anymore

    // Save to S3
    const s3Key = `${folder}/${fileName}`
    const bucketName = process.env.S3_INVOICES_BUCKET || process.env.S3_BUCKET
    const hasS3Config = bucketName && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY && process.env.S3_REGION
    

    
    if (!hasS3Config) {
      console.warn('[InvoiceService] S3 not fully configured, using local file endpoint')
      // Return a local file endpoint URL instead of file:// URL
      const localUrl = `${process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'}/uploads/invoices/${folder}/${fileName}`
      return {
        localPath,
        s3Url: localUrl
      }
    }
    
    try {
      const uploadResult = await this.s3.upload({
        Bucket: bucketName,
        Key: s3Key,
        Body: pdfBuffer,
        ContentType: 'application/pdf'
      }).promise()

      console.log(`[InvoiceService] Successfully uploaded invoice to S3: ${uploadResult.Location}`)

      return {
        localPath,
        s3Url: uploadResult.Location
      }
    } catch (s3Error) {
      console.error('[InvoiceService] S3 upload failed, falling back to local URL:', s3Error)
      // If S3 upload fails, fall back to local URL
      const localUrl = `${process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'}/uploads/invoices/${folder}/${fileName}`
      return {
        localPath,
        s3Url: localUrl
      }
    }
  }

  async generateInvoice(orderId: string, fulfillmentId?: string, orderOverride?: any, orderService?: any, fulfillmentIndex?: number): Promise<string> {
    console.log(`[InvoiceService] Starting invoice generation for order ${orderId}${fulfillmentId ? `, fulfillment ${fulfillmentId}` : ''}`)

    let order
    let fulfillment
    
    if (orderOverride) {
      order = orderOverride
    } else if (orderService) {
      const orders = await orderService.listOrders(
        { id: orderId },
        {
          relations: [
            "items",
            "shipping_address",
            "billing_address",
            "region",
            "shipping_methods",
            "fulfillments",
            "fulfillments.items",
            "customer"
          ],
          select: [
            "id",
            "display_id",
            "currency_code",
            "subtotal",
            "tax_total",
            "shipping_total",
            "total",
            "metadata",
            "items.id",
            "items.title",
            "items.unit_price",
            "items.quantity",
            "region.automatic_taxes"
          ]
        }
      )

      if (!orders.length) {
        throw new Error(`No order found with id ${orderId}`)
      }
      
      order = orders[0]
    }

    // Handle fulfillment logic regardless of how order was loaded
    if (fulfillmentId) {
      // Find the fulfillment from the order data
      const orderFulfillment = order.fulfillments?.find((f: any) => f.id === fulfillmentId);
      
              if (orderFulfillment) {
          // Transform the fulfillment items to match the expected structure
          const rawItems = orderFulfillment.items || [];
          const transformedItems = rawItems.map((item: any) => ({
            id: item.id,
            item_id: item.item_id || item.line_item_id || item.id, // Try to find the reference to order item
            quantity: item.quantity || 1
          }));
          
          fulfillment = { 
            id: orderFulfillment.id,
            items: transformedItems,
            shipping_details: { price: 0, option_name: 'Standard Shipping' } // Initialize with default values
          };
          
          // Get the fulfillment shipping price from the database
          const connectionString = process.env.DATABASE_URL as string | undefined;
          if (connectionString) {
            const client = new Client({ connectionString });
            await client.connect();
            
            const priceResult = await client.query(`
              SELECT price
              FROM fulfillment_shipping_price
              WHERE fulfillment_id = $1
            `, [fulfillmentId]);
            
            if (priceResult.rows[0]) {
              fulfillment.shipping_details = {
                price: priceResult.rows[0].price, // Keep in cents - formatAmount will handle conversion
                option_name: fulfillment.shipping_details.option_name || 'Standard Shipping'
              }
            }
            
            await client.end();
          }
        } else {
        // Fallback to database query if fulfillment not found in order
        const connectionString = process.env.DATABASE_URL as string | undefined;
        if (connectionString) {
          const client = new Client({ connectionString });
          await client.connect();
          
          // Get fulfillment details with items
          const fulfillmentResult = await client.query(`
            SELECT id, items
            FROM fulfillment
            WHERE id = $1
          `, [fulfillmentId]);
          
          if (fulfillmentResult.rows[0]) {
            // Transform the raw fulfillment items to match the expected structure
            const rawItems = fulfillmentResult.rows[0].items || [];
            const transformedItems = rawItems.map((item: any) => ({
              id: item.id,
              item_id: item.item_id || item.line_item_id || item.id, // Try to find the reference to order item
              quantity: item.quantity || 1
            }));
            
            fulfillment = { 
              id: fulfillmentResult.rows[0].id,
              items: transformedItems,
              shipping_details: { price: 0, option_name: 'Standard Shipping' } // Initialize with default values
            };
            
            // Get the fulfillment shipping price
            const priceResult = await client.query(`
              SELECT price
              FROM fulfillment_shipping_price
              WHERE fulfillment_id = $1
            `, [fulfillmentId]);
            
            if (priceResult.rows[0]) {
              fulfillment.shipping_details = {
                price: priceResult.rows[0].price, // Keep in cents - formatAmount will handle conversion
                option_name: fulfillment.shipping_details.option_name || 'Standard Shipping'
              }
            }
          }
          
          await client.end();
        }
      }
    }

    const doc = new PDFDocument({ margin: 50 })
    const isFulfillment = fulfillmentId ? true : false
    
    // Determine the folder and filename
    const folder = isFulfillment ? 'fulfillments' : 'orders'
    const fileName = `invoice-${order.display_id}${isFulfillment ? `-fulfillment-${fulfillmentId}` : ''}.pdf`

    // Create a buffer to store the PDF
    const chunks: Buffer[] = []
    doc.on('data', chunks.push.bind(chunks))

    // Choose the appropriate generator
    const generator = isFulfillment
      ? this.fulfillmentInvoiceGenerator 
      : this.orderInvoiceGenerator

    // Ensure fulfillment object exists for fulfillment invoices
    if (isFulfillment && !fulfillment) {
      throw new Error('Fulfillment object is required for fulfillment invoices');
    }

    // Generate the invoice
    generator.generateInvoice(doc, order, fulfillment, fulfillmentIndex)
    doc.end()

    // Wait for PDF generation to complete
    await new Promise((resolve) => doc.on('end', resolve))

    try {
      const pdfBuffer = Buffer.concat(chunks)
      const { localPath, s3Url } = await this.saveInvoice(pdfBuffer, folder, fileName)
      
      // If this is a fulfillment invoice, store the information in the database
      if (isFulfillment) {
        const connectionString = process.env.DATABASE_URL as string | undefined;
        if (connectionString) {
          const client = new Client({ connectionString });
          await client.connect();
          
          await client.query(`
            INSERT INTO fulfillment_invoice (id, fulfillment_id, invoice_url, generated_at, created_at, updated_at)
            VALUES ($1, $2, $3, NOW(), NOW(), NOW())
            ON CONFLICT (fulfillment_id) 
            DO UPDATE SET 
              invoice_url = EXCLUDED.invoice_url,
              generated_at = NOW(),
              updated_at = NOW()
          `, [randomUUID(), fulfillmentId, s3Url]);
          
          await client.end();
        }
      }

      // Return the S3 URL as the primary path
      return s3Url
    } catch (error) {
      console.error('[InvoiceService] Failed to save invoice:', error)
      throw error
    }
  }

  async retrieveInvoice(orderId: string, fulfillmentId?: string, orderService?: any): Promise<{ invoice_url: string, generated_at: string } | null> {
    if (fulfillmentId) {
      const connectionString = process.env.DATABASE_URL as string | undefined;
      if (connectionString) {
        const client = new Client({ connectionString });
        await client.connect();
        
        const result = await client.query(`
          SELECT invoice_url, generated_at::text
          FROM fulfillment_invoice
          WHERE fulfillment_id = $1
        `, [fulfillmentId]);
        
        await client.end();
        
        return result.rows[0] || null;
      }
      return null;
    }
    
    // For order invoices, we currently store the URL in order metadata
    if (orderService) {
      const orders = await orderService.listOrders({ id: orderId })
      const order = orders[0]
      return order.metadata?.invoice_path 
        ? { 
            invoice_url: order.metadata.invoice_path as string, 
            generated_at: new Date(order.updated_at).toISOString() 
          }
        : null
    }
    return null;
  }
}

export default InvoiceService
