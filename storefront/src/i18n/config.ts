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
  async function load(ns: string) {
    try {
      return (await import(`../locales/${locale}/${ns}.json`)).default as Record<string,string>
    } catch (_) {
      if (locale !== DEFAULT_LOCALE) {
        try {
          return (await import(`../locales/${DEFAULT_LOCALE}/${ns}.json`)).default as Record<string,string>
        } catch (e2) {
          console.warn(`[i18n] Missing fallback namespace ${ns}`, e2)
          return {}
        }
      }
      return {}
    }
  }
  const merged = {
    ...(await load('common')),
    ...(await load('product')),
    ...(await load('form')),
    ...(await load('account'))
  }
  if (Object.keys(merged).length === 0) {
    notFound()
  }
  return merged
}

// Helper per integrazione con next-intl (se in futuro aggiungiamo routing i18n pieno)
// Integrazione con next-intl on-demand (quando sarà configurato il middleware)
// Placeholder esportabile se necessario in futuro.
export async function getMessagesFor(locale?: string) {
  const loc = resolveLocale(locale)
  return await loadMessages(loc)
}
