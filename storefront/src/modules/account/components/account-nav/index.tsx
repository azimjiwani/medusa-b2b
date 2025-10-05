"use client"

import { signout } from "@/lib/data/customer"
import { accountPath } from "@/lib/util/path-builder"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import ChevronDown from "@/modules/common/icons/chevron-down"
import MapPin from "@/modules/common/icons/map-pin"
import Package from "@/modules/common/icons/package"
import User from "@/modules/common/icons/user"
import { B2BCustomer } from "@/types/global"
import { ArrowRightOnRectangle, BuildingStorefront } from "@medusajs/icons"
import { clx } from "@medusajs/ui"
import { useTranslations } from "next-intl"
import { useParams, usePathname } from "next/navigation"

const AccountNav = ({
  customer,
  numPendingApprovals,
}: {
  customer: B2BCustomer | null
  numPendingApprovals: number
}) => {
  const route = usePathname()

  const { countryCode, lang } = useParams() as { countryCode: string; lang: string }

  const handleLogout = async () => {
  await signout(countryCode, customer?.id as string)
  }

  const t = useTranslations()
  return (
    <div>
      <div className="small:hidden" data-testid="mobile-account-nav">
        {route !== accountPath({ countryCode, lang }) ? (
          <LocalizedClientLink
            href={accountPath({ countryCode, lang })}
            className="flex items-center gap-x-2 text-small-regular py-2"
            data-testid="account-main-link"
          >
            <>
              <ChevronDown className="transform rotate-90" />
              <span>{t("account.nav.account")}</span>
            </>
          </LocalizedClientLink>
        ) : (
          <>
            <div className="text-xl-semi mb-4 px-8">
              {t("account.overview.hello", { name: customer?.first_name })}
            </div>
            <div className="text-base-regular">
              <ul>
                <li>
                  <LocalizedClientLink
                    href={accountPath({ countryCode, lang }, "profile")}
                    className="flex items-center justify-between py-4 border-b border-gray-200 px-8"
                    data-testid="profile-link"
                  >
                    <>
                      <div className="flex items-center gap-x-2">
                        <User size={20} />
                        <span>{t("account.nav.profile")}</span>
                      </div>
                      <ChevronDown className="transform -rotate-90" />
                    </>
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href={accountPath({ countryCode, lang }, "company")}
                    className="flex items-center justify-between py-4 border-b border-gray-200 px-8"
                    data-testid="company-link"
                  >
                    <>
                      <div className="flex items-center gap-x-2">
                        <BuildingStorefront width={20} />
                        <span>{t("account.nav.company")}</span>
                      </div>
                      <ChevronDown className="transform -rotate-90" />
                    </>
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href={accountPath({ countryCode, lang }, "addresses")}
                    className="flex items-center justify-between py-4 border-b border-gray-200 px-8"
                    data-testid="addresses-link"
                  >
                    <>
                      <div className="flex items-center gap-x-2">
                        <MapPin size={20} />
                        <span>{t("account.nav.addresses")}</span>
                      </div>
                      <ChevronDown className="transform -rotate-90" />
                    </>
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href={accountPath({ countryCode, lang }, "orders")}
                    className="flex items-center justify-between py-4 border-b border-gray-200 px-8"
                    data-testid="orders-link"
                  >
                    <div className="flex items-center gap-x-2">
                      <Package size={20} />
                      <span>{t("account.nav.orders")}</span>
                    </div>
                    <ChevronDown className="transform -rotate-90" />
                  </LocalizedClientLink>
                </li>
                {/* Approvals tab commented out
                {customer?.employee?.is_admin && (
                  <li>
                    <LocalizedClientLink
                      href="/account/approvals"
                      className="flex items-center justify-between py-4 border-b border-gray-200 px-8"
                      data-testid="approvals-link"
                    >
                      <div className="flex items-center gap-x-2">
                        <FilePlus size={16} />
                        <span>Approvals</span>
                      </div>
                      <ChevronDown className="transform -rotate-90" />
                    </LocalizedClientLink>
                  </li>
                )}
                */}
                {/* Quotes tab commented out
                <li>
                  <LocalizedClientLink
                    href="/account/quotes"
                    className="flex items-center justify-between py-4 border-b border-gray-200 px-8"
                    data-testid="quotes-link"
                  >
                    <div className="flex items-center gap-x-2">
                      <FilePlus size={16} />
                      <span>Quotes</span>
                    </div>
                    <ChevronDown className="transform -rotate-90" />
                  </LocalizedClientLink>
                </li>
                */}
                <li>
                  <button
                    type="button"
                    className="flex items-center justify-between py-4 border-b border-gray-200 px-8 w-full"
                    onClick={handleLogout}
                    data-testid="logout-button"
                  >
                    <div className="flex items-center gap-x-2">
                      <ArrowRightOnRectangle />
                      <span>{t("account.nav.logout")}</span>
                    </div>
                    <ChevronDown className="transform -rotate-90" />
                  </button>
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
      <div className="hidden small:block" data-testid="account-nav">
        <div className="text-lg">
          <ul className="flex mb-0 justify-start items-start flex-col gap-y-4">
            <li>
              <AccountNavLink
                href={accountPath({ countryCode, lang })}
                route={route!}
                data-testid="overview-link"
              >
                {t("account.nav.overview")}
              </AccountNavLink>
            </li>
            <li>
              <AccountNavLink
                href={accountPath({ countryCode, lang }, "profile")}
                route={route!}
                data-testid="profile-link"
              >
                {t("account.nav.profile")}
              </AccountNavLink>
            </li>
            <li>
              <AccountNavLink
                href={accountPath({ countryCode, lang }, "company")}
                route={route!}
                data-testid="company-link"
              >
                {t("account.nav.company")}
              </AccountNavLink>
            </li>
            <li>
              <AccountNavLink
                href={accountPath({ countryCode, lang }, "addresses")}
                route={route!}
                data-testid="addresses-link"
              >
                {t("account.nav.addresses")}
              </AccountNavLink>
            </li>
            <li>
              <AccountNavLink
                href={accountPath({ countryCode, lang }, "orders")}
                route={route!}
                data-testid="orders-link"
              >
                {t("account.nav.orders")}
              </AccountNavLink>
            </li>
            {/* Approvals tab commented out
            {customer?.employee?.is_admin && (
              <li>
                <AccountNavLink
                  href="/account/approvals"
                  route={route!}
                  data-testid="approvals-link"
                >
                  Approvals{" "}
                  {numPendingApprovals > 0 && (
                    <span className="bg-blue-500 text-white text-xs px-1.5 py-px rounded-full">
                      {numPendingApprovals}
                    </span>
                  )}
                </AccountNavLink>
              </li>
            )}
            */}
            {/* Quotes tab commented out
            <li>
              <AccountNavLink
                href="/account/quotes"
                route={route!}
                data-testid="quotes-link"
              >
                Quotes
              </AccountNavLink>
            </li>
            */}
            <li className="text-neutral-400 hover:text-neutral-950">
              <button
                type="button"
                onClick={handleLogout}
                data-testid="logout-button"
              >
                {t("account.nav.logout")}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

type AccountNavLinkProps = {
  href: string
  route: string
  children: React.ReactNode
  "data-testid"?: string
}

const AccountNavLink = ({
  href,
  route,
  children,
  "data-testid": dataTestId,
}: AccountNavLinkProps) => {
  const { countryCode, lang } = useParams() as { countryCode: string; lang: string }
  // href è già completo (dual segment). Attivo se route coincide o inizia con href (per sottopagine future)
  const active = route === href || (href !== accountPath({ countryCode, lang }) && route.startsWith(href))
  return (
    <LocalizedClientLink
      href={href}
      className={clx(
        "text-neutral-400 hover:text-neutral-950 flex items-center gap-x-2",
        {
          "text-neutral-950": active,
        }
      )}
      data-testid={dataTestId}
    >
      {children}
    </LocalizedClientLink>
  )
}

export default AccountNav
