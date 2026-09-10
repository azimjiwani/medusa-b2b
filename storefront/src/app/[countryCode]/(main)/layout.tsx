import { retrieveCart } from "@/lib/data/cart"
import { retrieveCustomer } from "@/lib/data/customer"
import { listCartFreeShippingPrices } from "@/lib/data/fulfillment"
import { getBaseURL } from "@/lib/util/env"
import CartMismatchBanner from "@/modules/layout/components/cart-mismatch-banner"
import Footer from "@/modules/layout/templates/footer"
import { NavigationHeader } from "@/modules/layout/templates/nav"
import FreeShippingPriceNudge from "@/modules/shipping/components/free-shipping-price-nudge"
import { StoreFreeShippingPrice } from "@/types/shipping-option/http"
import { ExclamationCircleSolid, InformationCircleSolid } from "@medusajs/icons"
import { Metadata } from "next"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default async function PageLayout(props: { children: React.ReactNode }) {
  const customer = await retrieveCustomer().catch(() => null)
  const cart = await retrieveCart()
  let freeShippingPrices: StoreFreeShippingPrice[] = []

  if (cart) {
    freeShippingPrices = await listCartFreeShippingPrices(cart.id)
  }

  return (
    <>
      <NavigationHeader />

      {/* Login banner for non-logged-in users */}
      {!customer && (
        <div className="flex min-h-12 items-center justify-center bg-[#1d3557] px-6 py-2 text-center text-[13px] text-white/90">
          <div className="flex flex-col small:flex-row small:gap-2 gap-1 items-center">
            <span className="block leading-relaxed">
              <InformationCircleSolid className="mr-1 inline-block align-text-bottom" />
              To view pricing and inventory, please{" "}
              <LocalizedClientLink
                href="/account"
                className="inline-flex min-h-11 items-center whitespace-nowrap rounded-sm font-semibold text-white underline decoration-white/60 underline-offset-4 transition-colors hover:decoration-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                log in
              </LocalizedClientLink>
            </span>
          </div>
        </div>
      )}

      {customer && !customer.metadata?.approved && (
        <div className="flex items-center text-white justify-center small:p-4 p-2 text-center bg-red-600 small:gap-2 gap-1 text-sm">
          <div className="flex flex-col small:flex-row small:gap-2 gap-1 items-center">
            <span className="block leading-relaxed">
              <ExclamationCircleSolid className="mr-1 inline-block align-text-bottom" />
              Your account is pending approval, please contact us
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
          cart={cart}
          freeShippingPrices={freeShippingPrices}
        />
      )}
    </>
  )
}
