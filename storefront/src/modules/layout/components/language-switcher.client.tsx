"use client"

import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/i18n/config"
import { useLocale, useTranslations } from "next-intl"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useMemo, useState } from "react"

type LocaleOption = {
  value: string
  label: string
}

// Mapping etichette leggibili (scalabile in futuro)
const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  it: "Italiano",
}

export default function LanguageSwitcher() {
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations()
  const current = useLocale() || DEFAULT_LOCALE

  // Regex per intercettare il primo segmento come locale
  const localePattern = useMemo(
    () => new RegExp(`^/(${SUPPORTED_LOCALES.join("|")})(?=/|$)`),
    []
  )

  const match = pathname.match(localePattern)
  const currentLocale = match ? match[1] : current
  const pathWithoutLocale = useMemo(
    () => pathname.replace(localePattern, "") || "/",
    [pathname, localePattern]
  )

  const options: LocaleOption[] = useMemo(
    () =>
      SUPPORTED_LOCALES.map((loc) => ({
        value: loc,
        label: LOCALE_LABELS[loc] || loc.toUpperCase(),
      })),
    []
  )

  const [open, setOpen] = useState(false)

  const onSelect = useCallback(
    (newLocale: string) => {
      if (newLocale === currentLocale) {
        setOpen(false)
        return
      }
      const target = pathWithoutLocale === "/" ? `/${newLocale}` : `/${newLocale}${pathWithoutLocale}`
      router.push(target)
      setOpen(false)
    },
    [currentLocale, pathWithoutLocale, router]
  )

  return (
    <div className="relative inline-block text-left" aria-label={t("nav.language")}> 
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 px-2 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 text-xs font-medium text-neutral-700 transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{(LOCALE_LABELS[currentLocale] || currentLocale.toUpperCase())}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : "rotate-0"}`}
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 w-48 origin-top-right rounded-md border border-neutral-200 bg-white shadow-lg focus:outline-none p-1"
        >
          {options.map((opt) => {
            const active = opt.value === currentLocale
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={active}
                onClick={() => onSelect(opt.value)}
                className={`flex cursor-pointer items-center justify-between rounded-sm px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-100 ${active ? "font-semibold bg-neutral-50" : ""}`}
              >
                <span>{opt.label}</span>
                {active && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-4 h-4 text-green-600"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 5.29a1 1 0 010 1.42l-7.25 7.25a1 1 0 01-1.42 0l-3.25-3.25a1 1 0 011.42-1.42L8.75 11.59l6.54-6.54a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// Nota: quando aggiungerai nuove lingue, basta:
// 1. Aggiungere la locale in SUPPORTED_LOCALES
// 2. Inserire l'etichetta in LOCALE_LABELS (facoltativo, altrimenti fallback upper-case)
// 3. Creare i file di traduzione in /src/locales/<locale>/
