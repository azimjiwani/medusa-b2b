"use client"

import { SUPPORTED_LOCALES } from "@/i18n/config"
import Link from "next/link"
import { useParams } from "next/navigation"
import React from "react"

/**
 * Link localizzato che pre-pende la locale corrente se l'href non ne contiene già una.
 * Evita duplicazioni tipo /it/en/...
 */
const LocalizedClientLink = ({ children, href, ...props }: {
  children?: React.ReactNode
  href: string
  className?: string
  onClick?: () => void
  passHref?: true
  [x: string]: any
}) => {
  const params = useParams() as Record<string, string | undefined>
  const countryCode = params.countryCode
  const lang = params.lang // nuovo secondo segmento

  // Esterni, anchor, hash o mailto: lasciati intatti
  if (/^(https?:)?\/\//i.test(href) || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return <Link href={href} {...props}>{children}</Link>
  }

  // Normalizza assicurando leading slash
  const normalized = href.startsWith('/') ? href : `/${href}`

  // Riconosciamo tre casi in cui NON dobbiamo pre-pendere segmenti:
  // 1. Href già in formato dual segment /{countryCode}/{lang}/...
  // 2. Href che inizia con locale supportata (schema single-locale pre-esistente)
  // 3. Href esterno già gestito sopra
  const dualSegmentPrefix = countryCode && lang ? `/${countryCode}/${lang}` : undefined
  const isAlreadyDual = dualSegmentPrefix && normalized.startsWith(dualSegmentPrefix + '/')
  const hasLocale = SUPPORTED_LOCALES.some(l => normalized === `/${l}` || normalized.startsWith(`/${l}/`))

  let finalHref: string
  if (isAlreadyDual || hasLocale) {
    finalHref = normalized
  } else if (countryCode && lang) {
    finalHref = `/${countryCode}/${lang}${normalized}`
  } else if (countryCode) {
    finalHref = `/${countryCode}${normalized}`
  } else {
    finalHref = normalized
  }

  return (
    <Link href={finalHref} {...props}>
      {children}
    </Link>
  )
}

export default LocalizedClientLink
