import { loadMessages, resolveLocale } from "@/i18n/config"
import { IntlProvider } from "@/i18n/IntlProvider"
import { retrieveCart } from "@/lib/data/cart"
import { retrieveCustomer } from "@/lib/data/customer"
import { listCartFreeShippingPrices } from "@/lib/data/fulfillment"
import { getBaseURL } from "@/lib/util/env"
import CartMismatchBanner from "@/modules/layout/components/cart-mismatch-banner"
import LoginBanners from "@/modules/layout/components/login-banners.client"
import Footer from "@/modules/layout/templates/footer"
import { NavigationHeader } from "@/modules/layout/templates/nav"
import FreeShippingPriceNudge from "@/modules/shipping/components/free-shipping-price-nudge"
import { StoreFreeShippingPrice } from "@/types/shipping-option/http"
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
      
      <LoginBanners isLoggedIn={!!customer} isApproved={!!customer?.metadata?.approved} />

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
