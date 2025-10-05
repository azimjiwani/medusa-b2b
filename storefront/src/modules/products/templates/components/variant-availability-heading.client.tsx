"use client"
import { useTranslations } from "next-intl"

export default function VariantAvailabilityHeading() {
  const t = useTranslations()
  return <h2 className="mb-4 text-lg font-semibold text-gray-900">{t("product.variantAvailability")}</h2>
}
