import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Button, Container, Heading } from "@medusajs/ui";
import { AdminOrder, DetailWidgetProps } from "@medusajs/framework/types";

const formatCurrency = (amount: number, currency?: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

const PrintOrderWidget = ({ data }: DetailWidgetProps<AdminOrder>) => {
  const handlePrintOrder = () => {
    const order = data;
    if (!order) return;

    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    // Calculate totals
    const subtotal = order.items?.reduce((sum: number, item: any) => {
      return sum + (item.unit_price * item.quantity);
    }, 0) || 0;

    const tax = order.total - subtotal - (order.shipping_total || 0);

    // Build the order print HTML
    const orderHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order #${order.display_id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .company-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .order-info { margin-bottom: 20px; }
          .customer-info { margin-bottom: 20px; }
          .shipping-info { margin-bottom: 20px; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .items-table th { background-color: #f2f2f2; }
          .items-table .amount { text-align: right; }
          .summary { margin-top: 20px; text-align: right; }
          .summary-row { margin-bottom: 8px; }
          .summary-row strong { display: inline-block; width: 150px; }
          .total-row { font-size: 18px; font-weight: bold; margin-top: 15px; padding-top: 15px; border-top: 2px solid #333; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">Batteries-N-Things Inc</div>
          <div>5-2800 John Street, Markham ON L3R0E2</div>
          <div>(416)-368-0023 | info@bntbng.com</div>
        </div>

        <div class="order-info">
          <h2>ORDER DETAILS</h2>
          <p><strong>Order #:</strong> ${order.display_id}</p>
          <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
          <p><strong>Payment Mode:</strong> ${
            order.metadata?.payment_mode === "debit-card"
              ? "💳 Debit Card"
              : order.metadata?.payment_mode === "credit-card"
              ? "💳 Credit Card"
              : order.metadata?.payment_mode === "cheque"
              ? "🧾 Cheque"
              : order.metadata?.payment_mode === "cash"
              ? "💵 Cash"
              : order.metadata?.payment_mode === "e-transfer"
              ? "💸 E-Transfer"
              : "Unknown"
          }</p>
        </div>

        <div class="customer-info">
          <h3>Customer:</h3>
          <p><strong>${order.customer?.first_name || ''} ${order.customer?.last_name || ''}</strong></p>
          <p>${order.email || ''}</p>
        </div>

        <div class="shipping-info">
          <h3>Ship To:</h3>
          <p><strong>${order.shipping_address?.first_name || ''} ${order.shipping_address?.last_name || ''}</strong></p>
          ${order.shipping_address?.address_1 ? `<p>${order.shipping_address.address_1}</p>` : ''}
          ${order.shipping_address?.address_2 ? `<p>${order.shipping_address.address_2}</p>` : ''}
          <p>${order.shipping_address?.city || ''}, ${order.shipping_address?.province || ''} ${order.shipping_address?.postal_code || ''}</p>
          <p>${order.shipping_address?.country_code || ''}</p>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>SKU</th>
              <th class="amount">Unit Price</th>
              <th class="amount">Quantity</th>
              <th class="amount">Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items?.map((item: any) => {
              const itemTotal = item.unit_price * item.quantity;
              return `
                <tr>
                  <td>${item.title}</td>
                  <td>${item.variant_sku || '—'}</td>
                  <td class="amount">${formatCurrency(item.unit_price, order.currency_code)}</td>
                  <td class="amount">${item.quantity}</td>
                  <td class="amount">${formatCurrency(itemTotal, order.currency_code)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-row">
            <strong>Subtotal:</strong> ${formatCurrency(subtotal, order.currency_code)}
          </div>
          <div class="summary-row">
            <strong>Shipping:</strong> ${formatCurrency(order.shipping_total || 0, order.currency_code)}
          </div>
          <div class="summary-row">
            <strong>Tax:</strong> ${formatCurrency(tax, order.currency_code)}
          </div>
          <div class="summary-row total-row">
            <strong>Total:</strong> ${formatCurrency(order.total, order.currency_code)}
          </div>
        </div>

        <div class="no-print" style="margin-top: 30px;">
          <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Print Order</button>
          <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">Close</button>
        </div>
      </body>
      </html>
    `;

    // Write the HTML to the new window
    printWindow.document.write(orderHTML);
    printWindow.document.close();
  };

  return (
    <Container className="p-6 space-y-6">
      <Heading level="h2">Print Order</Heading>
      <Button
        variant="secondary"
        onClick={handlePrintOrder}
        className="w-full"
      >
        🖨️ Print Order
      </Button>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "order.details.side.after",
});

export default PrintOrderWidget;
