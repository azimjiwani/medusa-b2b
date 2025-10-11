import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { customer_id } = req.auth_context.app_metadata as {
      customer_id: string;
    };

    if (!customer_id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
    const paymentService = req.scope.resolve(Modules.PAYMENT);

    // Get customer with credit limit from metadata
    const {
      data: [customer],
    } = await query.graph({
      entity: "customer",
      fields: ["id", "metadata"],
      filters: { id: customer_id },
    });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const creditLimit = (customer.metadata?.credit_limit as number) || 0;

    // Get all orders for this customer (excluding canceled orders)
    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "total",
        "status",
        "payment_collections.*",
        "payment_collections.payments.*"
      ],
      filters: {
        customer_id: customer_id,
        status: { $ne: "canceled" }
      }
    });

    // Calculate total outstanding across all orders
    let totalOutstanding = 0;

    for (const order of orders) {
      let totalPaid = 0;

      // Calculate total paid for this order
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

      totalOutstanding += outstandingAmount;
    }

    return res.json({
      credit_limit: creditLimit,
      credit_used: totalOutstanding * 100
    });

  } catch (error) {
    console.error("Error in customer credit API:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
