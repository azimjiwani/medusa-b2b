import { loadMessages, resolveLocale } from "@/i18n/config"
import { IntlProvider } from "@/i18n/IntlProvider"
import { retrieveCart } from "@/lib/data/cart"
import { retrieveCustomer } from "@/lib/data/customer"
import { listCartFreeShippingPrices } from "@/lib/data/fulfillment"
import { getBaseURL } from "@/lib/util/env"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import CartMismatchBanner from "@/modules/layout/components/cart-mismatch-banner"
import Footer from "@/modules/layout/templates/footer"
import { NavigationHeader } from "@/modules/layout/templates/nav"
import FreeShippingPriceNudge from "@/modules/shipping/components/free-shipping-price-nudge"
import { StoreFreeShippingPrice } from "@/types/shipping-option/http"
import { ExclamationCircleSolid, InformationCircleSolid } from "@medusajs/icons"
import { Metadata } from "next"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default async function PageLayout(props: { children: React.ReactNode; params: { countryCode: string } }) {
  const locale = resolveLocale(props.params.countryCode)
  const messages = await loadMessages(locale)
  const customer = await retrieveCustomer().catch(() => null)
  const cart = await retrieveCart()
  let freeShippingPrices: StoreFreeShippingPrice[] = []

  if (cart) {
    freeShippingPrices = await listCartFreeShippingPrices(cart.id)
  }

  return (
    <IntlProvider locale={locale} messages={messages}>
      <NavigationHeader />
      
      {/* Login banner for non-logged-in users */}
      {!customer && (
        <div className="flex items-center text-white justify-center small:p-4 p-2 text-center bg-blue-600 small:gap-2 gap-1 text-sm">
          <div className="flex flex-col small:flex-row small:gap-2 gap-1 items-center">
            <span className="flex items-center gap-1">
              <InformationCircleSolid className="inline" />
              {/* i18n: banner.loginRequired */}
              {messages["banner.loginRequired"]} {" "}
              <LocalizedClientLink 
                href="/account" 
                className="underline hover:text-blue-200 transition-colors"
              >
                {messages["nav.login"]}
              </LocalizedClientLink>
            </span>
          </div>
        </div>
      )}

      {customer && !customer.metadata?.approved && (
        <div className="flex items-center text-white justify-center small:p-4 p-2 text-center bg-red-600 small:gap-2 gap-1 text-sm">
          <div className="flex flex-col small:flex-row small:gap-2 gap-1 items-center">
            <span className="flex items-center gap-1">
              <ExclamationCircleSolid className="inline" />
              {messages["banner.accountPending"]}
            </span>
          </div>
        </div>
      )}

      {customer && cart && (
        <CartMismatchBanner customer={customer} cart={cart} />
      )}

  {props.children}

      <Footer />

      {cart && freeShippingPrices && (
        <FreeShippingPriceNudge
          variant="popup"
          // Cast temporaneo finché i tipi B2B non vengono allineati a StoreCart
          cart={cart as unknown as any}
          freeShippingPrices={freeShippingPrices}
        />
      )}
    </IntlProvider>
  )
}
