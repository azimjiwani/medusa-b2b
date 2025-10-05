import { sdk } from "@/lib/config"
import { retrieveOrder } from "@/lib/data/orders"
import OrderCompletedTemplate from "@/modules/order/templates/order-completed-template"
import { B2BOrder } from "@/types/global"
import { Metadata } from "next"
import { notFound } from "next/navigation"

type Props = {
  params: Promise<{ countryCode: string; lang: string; id: string }>
}

export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "You purchase was successful",
}

export default async function OrderConfirmedPage(props: Props) {
  const params = await props.params
  const { id } = params

  const order = (await retrieveOrder(id).catch(() => null)) as B2BOrder

  const orderData = await sdk.client.fetch<{ order: { metadata: any } }>(
    `/store/orders/${id}?fields=metadata`
  )

  if (!order) {
    return notFound()
  }

  return (
    <OrderCompletedTemplate
      order={order}
      paymentMode={orderData?.order?.metadata?.payment_mode}
    />
  )
}
export const dynamic = "force-dynamic"
