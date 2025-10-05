import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import { useLocale, useTranslations } from "next-intl"

type OrderDetailsProps = {
  order: HttpTypes.StoreOrder
}

const OrderDetails = ({ order }: OrderDetailsProps) => {
  const createdAt = new Date(order.created_at)
  const t = useTranslations("account")
  const locale = useLocale()

  return (
    <>
      <Heading level="h3" className="mb-2">
        {t("orders.details")}
      </Heading>

      <div className="text-sm text-ui-fg-subtle overflow-auto">
        <div className="flex justify-between">
          <Text>{t("orders.orderNumber")}</Text>
          <Text>#{order.display_id}</Text>
        </div>

        <div className="flex justify-between mb-2">
          <Text>{t("orders.orderDate")}</Text>
          <Text>
            {createdAt.toLocaleDateString(locale, { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </Text>
        </div>

        <Text>
          {t.rich("orders.orderConfirmationSent", {
            email: () => <span className="font-semibold">{order.email}</span>
          })}
        </Text>
      </div>
    </>
  )
}

export default OrderDetails
