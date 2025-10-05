"use client"

import { clx, Heading } from "@medusajs/ui"
import { useTranslations } from "next-intl"

type OrdersHeadingProps = {
  textKey: string // e.g. orders.title, orders.completed
  level?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
  className?: string
}

const OrdersHeading = ({ textKey, level = "h1", className = "" }: OrdersHeadingProps) => {
  const t = useTranslations("account")
  return (
    <Heading level={level as any} className={clx(className)}>
      {t(textKey)}
    </Heading>
  )
}

export default OrdersHeading
