import { convertToLocale } from "@/lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { useTranslations } from "next-intl"

type OrderSummaryProps = {
  order: HttpTypes.StoreOrder
}

const OrderSummary = ({ order }: OrderSummaryProps) => {
  const getAmount = (amount?: number | null) => {
    if (!amount) {
      return
    }

    return convertToLocale({
      amount,
      currency_code: order.currency_code,
    })
  }

  const t = useTranslations("account")
  return (
    <div>
      <h2 className="text-base-semi">{t("orders.orderSummary")}</h2>
      <div className="text-small-regular text-ui-fg-base my-2">
        <div className="flex flex-col gap-y-1">
          <div className="flex items-center justify-between">
            <span>{t("orders.subtotal")}</span>
            <span>{getAmount(order.item_subtotal || order.subtotal)}</span>
          </div>

          {order.discount_total > 0 && (
            <div className="flex items-center justify-between">
              <span>{t("orders.discount")}</span>
              <span>- {getAmount(order.discount_total)}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span>{t("orders.shipping")}</span>
            <span>{getAmount(order.shipping_methods?.[0]?.amount || order.shipping_total)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>{t("orders.taxes")}</span>
            <span>{getAmount(order.tax_total)}</span>
          </div>
        </div>
        <div className="h-px w-full border-b border-gray-200 border-dashed my-4" />
        <div className="flex items-center justify-between text-base-regular text-ui-fg-base mb-2">
          <span>{t("orders.total")}</span>
          <span>{getAmount(order.total)}</span>
        </div>
      </div>
    </div>
  )
}

export default OrderSummary
