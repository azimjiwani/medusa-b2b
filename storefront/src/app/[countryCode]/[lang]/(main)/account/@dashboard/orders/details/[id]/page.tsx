import { retrieveOrder } from "@/lib/data/orders"
import OrderDetailsTemplate from "@/modules/order/templates/order-details-template"
import { Metadata } from "next"
import { notFound } from "next/navigation"

interface PageProps { params: { countryCode: string, lang: string, id: string } }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const order = await retrieveOrder(params.id).catch(() => null)
  if (!order) {
    notFound()
  }
  return {
    title: `Order #${order.display_id}`,
    description: `View your order`,
  }
}

export default async function OrderDetailPage({ params }: PageProps) {
  const order = await retrieveOrder(params.id).catch(() => null)
  if (!order) {
    notFound()
  }
  return <OrderDetailsTemplate order={order} />
}
