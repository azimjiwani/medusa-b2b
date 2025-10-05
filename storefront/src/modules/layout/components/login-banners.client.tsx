"use client"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { ExclamationCircleSolid, InformationCircleSolid } from "@medusajs/icons"
import { useTranslations } from "next-intl"

interface LoginBannersProps {
  isLoggedIn: boolean
  isApproved: boolean
}

export default function LoginBanners({ isLoggedIn, isApproved }: LoginBannersProps) {
  const t = useTranslations()

  if (isLoggedIn && isApproved) return null

  if (!isLoggedIn) {
    return (
      <div className="flex items-center text-white justify-center small:p-4 p-2 text-center bg-blue-600 small:gap-2 gap-1 text-sm">
        <div className="flex flex-col small:flex-row small:gap-2 gap-1 items-center">
          <span className="flex items-center gap-1">
            <InformationCircleSolid className="inline" />
            {t("banner.loginRequired")}{" "}
            <LocalizedClientLink
              href="/account"
              className="underline hover:text-blue-200 transition-colors"
            >
              {t("nav.login")}
            </LocalizedClientLink>
          </span>
        </div>
      </div>
    )
  }

  // Logged in ma non approvato
  return (
    <div className="flex items-center text-white justify-center small:p-4 p-2 text-center bg-red-600 small:gap-2 gap-1 text-sm">
      <div className="flex flex-col small:flex-row small:gap-2 gap-1 items-center">
        <span className="flex items-center gap-1">
          <ExclamationCircleSolid className="inline" />
          {t("banner.accountPending")}
        </span>
      </div>
    </div>
  )
}
