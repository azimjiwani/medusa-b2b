"use client"

import OrderCard from "@/modules/account/components/order-card"
import Button from "@/modules/common/components/button"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { useTranslations } from "next-intl"

const OrderOverview = ({ orders }: { orders: HttpTypes.StoreOrder[] }) => {
  const t = useTranslations("account")

  if (orders?.length) {
    return (
      <div className="flex flex-col gap-y-2 w-full">
        {orders.map((o) => (
          <div key={o.id}>
            <OrderCard order={o} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      className="w-full flex flex-col items-center gap-y-4"
      data-testid="no-orders-container"
    >
      <h2 className="text-large-semi">{t("orders.nothingHereTitle")}</h2>
      <p className="text-base-regular">{t("orders.nothingHereBody")}</p>
      <div className="mt-4">
        <LocalizedClientLink href="/" passHref>
          <Button data-testid="continue-shopping-button">{t("orders.continueShopping")}</Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default OrderOverview
