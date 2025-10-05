import { notFound } from 'next/navigation'

// Lingue supportate (usiamo countryCode come locale per lo step attuale - Opzione C)
export const SUPPORTED_LOCALES = ['it', 'en'] as const
export type AppLocale = typeof SUPPORTED_LOCALES[number]
export const DEFAULT_LOCALE: AppLocale = 'it'

export function resolveLocale(countryCode?: string): AppLocale {
  if (!countryCode) return DEFAULT_LOCALE
  const lc = countryCode.toLowerCase()
  return (SUPPORTED_LOCALES.find(l => l === lc) || DEFAULT_LOCALE) as AppLocale
}

export async function loadMessages(locale: AppLocale) {
  try {
    const messages = (await import(`../locales/${locale}/common.json`)).default
    return messages
  } catch (e) {
    console.warn('[i18n] Missing messages for locale', locale, e)
    if (locale !== DEFAULT_LOCALE) {
      return import(`../locales/${DEFAULT_LOCALE}/common.json`).then(m => m.default)
    }
    notFound()
  }
}

// Helper per integrazione con next-intl (se in futuro aggiungiamo routing i18n pieno)
// Integrazione con next-intl on-demand (quando sarà configurato il middleware)
// Placeholder esportabile se necessario in futuro.
export async function getMessagesFor(locale?: string) {
  const loc = resolveLocale(locale)
  return await loadMessages(loc)
}
