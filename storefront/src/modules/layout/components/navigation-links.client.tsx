"use client"

import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { useTranslations } from "next-intl"

export default function NavigationLinks() {
  const t = useTranslations()
  return (
    <ul className="space-x-4 hidden small:flex">
      <li>
        <LocalizedClientLink className="hover:text-ui-fg-base" href="/store">
          {t("nav.store")}
        </LocalizedClientLink>
      </li>
      <li>
        <LocalizedClientLink className="hover:text-ui-fg-base" href="/azienda">
          {t("nav.company")}
        </LocalizedClientLink>
      </li>
      <li>
        <LocalizedClientLink className="hover:text-ui-fg-base" href="/contattaci">
          {t("nav.contact")}
        </LocalizedClientLink>
      </li>
    </ul>
  )
}
