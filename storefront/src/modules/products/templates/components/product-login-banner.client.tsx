"use client"
import { useTranslations } from "next-intl"
import Link from "next/link"

export default function ProductLoginBanner({ countryCode }: { countryCode: string }) {
  const t = useTranslations()
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex-1">
        <h2 className="text-base md:text-lg font-semibold text-blue-900 mb-1">
          {t("product.loginCtaTitle")}
        </h2>
        <p className="text-sm text-blue-800 leading-relaxed">
          {t("product.loginCtaBody")}
        </p>
      </div>
      <div className="flex w-full md:w-auto md:items-end">
        <Link
          href={`/${countryCode}/account`}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 transition-colors"
        >
          {t("product.loginCtaButton")}
        </Link>
      </div>
    </div>
  )
}
