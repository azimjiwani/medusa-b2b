"use client"

import { NextIntlClientProvider } from 'next-intl'
import { ReactNode } from 'react'
import { AppLocale } from './config'

interface IntlProviderProps {
  locale: AppLocale
  messages: Record<string, string>
  children: ReactNode
}

export function IntlProvider({ locale, messages, children }: IntlProviderProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Europe/Rome">
      {children}
    </NextIntlClientProvider>
  )
}
