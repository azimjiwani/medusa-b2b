import { listApprovals } from "@/lib/data/approvals"
import { retrieveCompany } from "@/lib/data/companies"
import { retrieveCustomer } from "@/lib/data/customer"
import { listOrders } from "@/lib/data/orders"
import { accountPath } from "@/lib/util/path-builder"
import OrderOverview from "@/modules/account/components/order-overview"
import OrdersHeading from "@/modules/account/components/orders-heading"
import PendingCustomerApprovals from "@/modules/account/components/pending-customer-approvals"
import { ApprovalStatusType } from "@/types/approval"
import { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Orders",
  description: "Overview of your previous orders.",
}

export default async function Orders({ params }: { params: { countryCode: string, lang: string } }) {
  try {
    const customer = await retrieveCustomer()
    if (!customer) {
      redirect(accountPath(params, "login"))
    }

    const orders = await listOrders(100).catch(() => [])

    const { approval_settings } =
      (await retrieveCompany(customer?.employee?.company_id!)) || {}

    const approval_required =
      approval_settings?.requires_admin_approval ||
      approval_settings?.requires_sales_manager_approval

    const { carts_with_approvals } = await listApprovals({
      status: ApprovalStatusType.PENDING,
    }).catch(() => ({ carts_with_approvals: [] }))

    return (
      <div className="w-full flex flex-col gap-y-4" data-testid="orders-page-wrapper">
        <div className="mb-4">
          <OrdersHeading textKey="orders.title" />
        </div>
        {approval_required && (
          <div>
            <OrdersHeading
              textKey="orders.pendingApprovals"
              level="h2"
              className="text-neutral-700 mb-4"
            />
            <PendingCustomerApprovals cartsWithApprovals={carts_with_approvals} />
          </div>
        )}
        <div>
          <OrdersHeading
            textKey="orders.completed"
            level="h2"
            className="text-neutral-700 mb-4"
          />
          <OrderOverview orders={orders || []} />
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error in orders page:", error)
  redirect(accountPath(params, "login"))
  }
}
