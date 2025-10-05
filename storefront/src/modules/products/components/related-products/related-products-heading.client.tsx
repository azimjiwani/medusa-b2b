"use client"
import { Heading } from "@medusajs/ui"
import { useTranslations } from "next-intl"

export default function RelatedProductsHeading() {
  const t = useTranslations()
  return (
    <Heading level="h2" className="text-xl text-neutral-950 font-normal">
      {t("product.related.title")}
    </Heading>
  )
}
