import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { z } from "zod";

const PaymentsQuerySchema = z.object({
  limit: z.string().optional().default("50"),
  offset: z.string().optional().default("0"),
  q: z.string().optional(),
  order: z.string().optional().default("-created_at"),
});

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  try {
    // Validate query parameters
    const result = PaymentsQuerySchema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid query parameters" });
    }

    const { limit, offset, q, order } = result.data;

    // Get the query service from the request scope
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
    const paymentService = req.scope.resolve(Modules.PAYMENT);

    // Get all orders with customer and payment information
    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "created_at",
        "total",
        "currency_code",
        "status",
        "customer_id",
        "customer.first_name",
        "customer.last_name",
        "customer.email",
        "customer.company_name",
        "customer.metadata",
        "metadata",
        "payment_collections.*",
        "payment_collections.payments.*"
      ]
    });

    console.log("Total orders fetched:", orders.length);

    // Filter out canceled orders
    const validOrders = orders.filter((order: any) => order.status !== "canceled");
    console.log("Valid orders (not canceled):", validOrders.length);

    // Process each order individually and group by customer
    const customerGroups: Record<string, any> = {};
    
    for (const order of validOrders) {
      let totalPaid = 0;
      
      // Calculate total paid for this specific order
      const payments = order.payment_collections?.flatMap((pc: any) => pc.payments || []) || [];
      
      for (const payment of payments) {
        try {
          // Get all captures for this payment
          const captures = await paymentService.listCaptures({
            payment_id: payment.id
          });
          
          // Sum up all capture amounts
          const paymentTotal = captures.reduce((sum: number, capture: any) => {
            return sum + (Number(capture.amount) || 0);
          }, 0);
          
          totalPaid += paymentTotal;
        } catch (error) {
          console.error(`Error fetching captures for payment ${payment.id}:`, error);
        }
      }
      
      const orderTotal = Number(order.total) || 0;
      const outstandingAmount = Math.max(orderTotal - totalPaid, 0);
      
      // Get reminder data from order metadata (or customer metadata as fallback)
      let reminderLastSentAt: any = null;
      if (order.metadata?.reminder_last_sent_at) {
        reminderLastSentAt = order.metadata.reminder_last_sent_at as any;
      } else if (order.customer?.metadata?.reminder_last_sent_at) {
        reminderLastSentAt = order.customer.metadata.reminder_last_sent_at as any;
      }
      
      const customerId = order.customer_id || 'anonymous';
      const customerKey = `${customerId}_${order.customer?.email || 'no-email'}`;
      
      const orderData = {
        order_id: order.id,
        order_number: (order as any).display_id || order.id,
        order_date: order.created_at,
        customer_name: `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim(),
        company_name: order.customer?.company_name || '',
        email: order.customer?.email || '',
        order_total: orderTotal,
        total_paid: totalPaid,
        outstanding_amount: outstandingAmount,
        reminder_last_sent_at: reminderLastSentAt,
        customer_id: customerId,
        credit_limit: (order.customer?.metadata?.credit_limit as number) || 0
      };
      
      // Initialize customer group if it doesn't exist
      if (!customerGroups[customerKey]) {
        customerGroups[customerKey] = {
          customer_id: customerId,
          customer_name: orderData.customer_name,
          company_name: orderData.company_name,
          email: orderData.email,
          total_order_total: 0,
          total_paid: 0,
          total_outstanding: 0,
          orders: [],
          reminder_last_sent_at: reminderLastSentAt,
          credit_limit: orderData.credit_limit
        };
      }
      
      // Add to customer totals
      customerGroups[customerKey].total_order_total += orderTotal;
      customerGroups[customerKey].total_paid += totalPaid;
      customerGroups[customerKey].total_outstanding += outstandingAmount;
      
      // Add order to customer's orders list
      customerGroups[customerKey].orders.push(orderData);
    }
    
    // Convert customer groups to array format
    const orderData: any[] = Object.values(customerGroups).map((customer: any) => ({
      ...customer,
      // For backward compatibility, set these fields for the main row
      order_total: customer.total_order_total,
      total_paid: customer.total_paid,
      outstanding_amount: customer.total_outstanding,
      is_customer_group: true
    }));

    console.log("Orders processed:", orderData.length);

    // Apply search filter
    let filteredOrders = orderData;
    if (q) {
      const searchTerm = q.toLowerCase();
      filteredOrders = orderData.filter((customer: any) => 
        customer.customer_name.toLowerCase().includes(searchTerm) ||
        customer.company_name.toLowerCase().includes(searchTerm) ||
        customer.email.toLowerCase().includes(searchTerm) ||
        customer.orders.some((order: any) => 
          order.order_number.toString().includes(searchTerm)
        )
      );
      console.log("Customer groups after search filter:", filteredOrders.length);
    }

    // Apply sorting
    if (order.includes('.')) {
      // New format: field.direction (e.g., "order_total.desc")
      const [field, direction] = order.split('.');
      filteredOrders.sort((a: any, b: any) => {
        let aVal = a[field];
        let bVal = b[field];
        
        // Handle date fields - use the most recent order date for customer groups
        if (field === 'order_date' || field === 'created_at') {
          const aLatestOrder = a.orders.reduce((latest: any, order: any) => 
            new Date(order.order_date) > new Date(latest.order_date) ? order : latest
          );
          const bLatestOrder = b.orders.reduce((latest: any, order: any) => 
            new Date(order.order_date) > new Date(latest.order_date) ? order : latest
          );
          aVal = new Date(aLatestOrder.order_date).getTime();
          bVal = new Date(bLatestOrder.order_date).getTime();
        }
        
        // Handle string fields
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        
        // Handle numeric fields
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          aVal = aVal || 0;
          bVal = bVal || 0;
        }
        
        if (direction === 'desc') {
          return bVal > aVal ? 1 : -1;
        } else {
          return aVal > bVal ? 1 : -1;
        }
      });
    } else if (order.startsWith('-')) {
      // Legacy format: -field (descending)
      const field = order.substring(1);
      filteredOrders.sort((a: any, b: any) => {
        if (field === 'created_at' || field === 'order_date') {
          const aLatestOrder = a.orders.reduce((latest: any, order: any) => 
            new Date(order.order_date) > new Date(latest.order_date) ? order : latest
          );
          const bLatestOrder = b.orders.reduce((latest: any, order: any) => 
            new Date(order.order_date) > new Date(latest.order_date) ? order : latest
          );
          return new Date(bLatestOrder.order_date).getTime() - new Date(aLatestOrder.order_date).getTime();
        }
        return (b[field] || 0) - (a[field] || 0);
      });
    } else {
      // Legacy format: field (ascending)
      const field = order;
      filteredOrders.sort((a: any, b: any) => {
        if (field === 'created_at' || field === 'order_date') {
          const aLatestOrder = a.orders.reduce((latest: any, order: any) => 
            new Date(order.order_date) > new Date(latest.order_date) ? order : latest
          );
          const bLatestOrder = b.orders.reduce((latest: any, order: any) => 
            new Date(order.order_date) > new Date(latest.order_date) ? order : latest
          );
          return new Date(aLatestOrder.order_date).getTime() - new Date(bLatestOrder.order_date).getTime();
        }
        return (a[field] || 0) - (b[field] || 0);
      });
    }

    // Apply pagination
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);
    const paginatedOrders = filteredOrders.slice(offsetNum, offsetNum + limitNum);

    console.log("Final response - customer groups:", paginatedOrders.length, "total count:", filteredOrders.length);

    return res.json({
      orders: paginatedOrders,
      count: filteredOrders.length,
      offset: offsetNum,
      limit: limitNum
    });

  } catch (error) {
    console.error("Error in payments API:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};