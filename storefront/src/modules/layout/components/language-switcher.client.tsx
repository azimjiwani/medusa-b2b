"use client"

import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/i18n/config"
import { useLocale, useTranslations } from "next-intl"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

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
  const searchParams = useSearchParams()
  const initialIntlLocale = useLocale() || DEFAULT_LOCALE
  const [persistedLocale, setPersistedLocale] = useState<string | null>(null)

  // Legge il cookie preferred_lang (solo client)
  useEffect(() => {
    try {
      const match = document.cookie.match(/(?:^|; )preferred_lang=([^;]+)/)
      if (match) {
        const val = decodeURIComponent(match[1])
        if (SUPPORTED_LOCALES.includes(val as any)) {
          setPersistedLocale(val)
        }
      }
    } catch (_) {
      // ignore
    }
  }, [])

  // Struttura attesa: /:countryCode/:lang(/...)
  const segments = useMemo(
    () => pathname.split("?")[0].split("/").filter(Boolean),
    [pathname]
  )

  const countryCode = segments[0] // può essere undefined se middleware non ha ancora riscritto
  const urlLocaleCandidate = segments[1]
  const currentLocale = SUPPORTED_LOCALES.includes(urlLocaleCandidate as any)
    ? (urlLocaleCandidate as string)
    : (persistedLocale || initialIntlLocale)

  const restSegments = segments.slice(2)

  const options: LocaleOption[] = useMemo(
    () =>
      SUPPORTED_LOCALES.map((loc) => ({
        value: loc,
        label: LOCALE_LABELS[loc] || loc.toUpperCase(),
      })),
    []
  )

  const [open, setOpen] = useState(false)
  const [announce, setAnnounce] = useState<string>("")
  const announceRef = useRef<HTMLDivElement | null>(null)

  const onSelect = useCallback(
    (newLocale: string) => {
      if (newLocale === currentLocale) {
        setOpen(false)
        return
      }

      // Salva cookie preferenza (1 anno)
      try {
        document.cookie = `preferred_lang=${encodeURIComponent(newLocale)}; Path=/; Max-Age=${60 * 60 * 24 * 365}`
      } catch (_) {
        // ignore cookie errors
      }

      // Annuncio accessibilità
      setAnnounce(
        LOCALE_LABELS[newLocale] ? `${LOCALE_LABELS[newLocale]} selected` : `${newLocale.toUpperCase()} selected`
      )

      if (!countryCode) {
        router.push(`/${newLocale}`)
        setOpen(false)
        return
      }

      const newPath = `/${countryCode}/${newLocale}` + (restSegments.length ? `/${restSegments.join("/")}` : "")
      const query = searchParams?.toString()
      router.push(query ? `${newPath}?${query}` : newPath)
      setOpen(false)
    },
    [countryCode, currentLocale, restSegments, router, searchParams]
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
  <span>{LOCALE_LABELS[currentLocale] || currentLocale.toUpperCase()}</span>
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
      <div
        ref={announceRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announce}
      </div>
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
