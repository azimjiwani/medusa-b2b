"use client"

import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/i18n/config"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function LanguageSwitcher() {
  const pathname = usePathname()
  const t = useTranslations()

  // Identifica se il primo segmento è una locale supportata
  const localePattern = new RegExp(`^/(${SUPPORTED_LOCALES.join("|")})(?=/|$)`) // ^/(it|en)(/|fine)
  const match = pathname.match(localePattern)
  const currentLocale = match ? match[1] : DEFAULT_LOCALE
  // Rimuove la locale attuale dal path per ottenere il path "nudo"
  const pathWithoutLocale = pathname.replace(localePattern, "") || "/"

  return (
    <div className="flex items-center gap-1 ml-1" aria-label={t("nav.language")}> 
      {SUPPORTED_LOCALES.map((loc) => {
        const isActive = loc === currentLocale
        const href = pathWithoutLocale === "/" ? `/${loc}` : `/${loc}${pathWithoutLocale}`
        return (
          <Link
            key={loc}
            href={href}
            className={
              `px-2 py-1 rounded-md text-xs font-medium transition-colors ` +
              (isActive
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700")
            }
            aria-current={isActive ? "true" : undefined}
          >
            {loc.toUpperCase()}
          </Link>
        )
      })}
    </div>
  )
}
