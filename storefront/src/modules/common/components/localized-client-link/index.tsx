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
  const { countryCode } = useParams()

  // Esterni, anchor, hash o mailto: lasciati intatti
  if (/^(https?:)?\/\//i.test(href) || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return <Link href={href} {...props}>{children}</Link>
  }

  // Normalizza assicurando leading slash
  const normalized = href.startsWith('/') ? href : `/${href}`

  // Se href contiene già una locale supportata come primo segmento, non pre-pendere
  const hasLocale = SUPPORTED_LOCALES.some(l => normalized === `/${l}` || normalized.startsWith(`/${l}/`))

  const finalHref = hasLocale ? normalized : `/${countryCode}${normalized}`

  return (
    <Link href={finalHref} {...props}>
      {children}
    </Link>
  )
}

export default LocalizedClientLink
