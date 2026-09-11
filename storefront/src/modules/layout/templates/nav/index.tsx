import { retrieveCustomer } from "@/lib/data/customer"
import AccountButton from "@/modules/account/components/account-button"
import CartButton from "@/modules/cart/components/cart-button"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import Image from "next/image"
import { SearchButton } from "@/modules/search/components/search-button"
import SkeletonAccountButton from "@/modules/skeletons/components/skeleton-account-button"
import SkeletonCartButton from "@/modules/skeletons/components/skeleton-cart-button"
import ShopNavigation from "@/modules/layout/components/shop-navigation"
import { Suspense } from "react"

export async function NavigationHeader() {
  const customer = await retrieveCustomer().catch(() => null)

  return (
    <header className="sticky inset-x-0 top-0 z-50 text-[#1d1d1f]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 border-b border-black/[0.05] bg-white/90 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80"
      />
      <div className="relative mx-auto flex min-h-16 max-w-[1344px] flex-wrap items-center justify-between gap-x-2 px-3 small:min-h-20 small:flex-nowrap small:gap-4 small:px-8">
        <LocalizedClientLink
          className="my-2 flex min-h-11 min-w-0 flex-1 small:flex-none small:my-0 items-center gap-1.5 small:gap-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0066cc]"
          aria-label="Batteries N’ Things home"
          href="/"
        >
          <Image
            src="/logo.png"
            alt=""
            width={28}
            height={28}
            className="h-6 w-6 shrink-0 small:h-7 small:w-7"
          />
          <span className="text-[12px] font-semibold leading-tight tracking-[-0.035em] min-[380px]:text-sm small:whitespace-nowrap small:text-[17px]">
            Batteries N&apos; Things
          </span>
        </LocalizedClientLink>

        <div className="order-last w-full border-t border-black/5 py-1 small:border-0 small:pt-0 small:order-none small:w-auto small:flex-1 small:pb-0">
          <Suspense
            fallback={
              <div
                className="flex min-h-11 items-center justify-center gap-4 text-xs text-[#86868b]"
                aria-label="Loading shop navigation"
              >
                <span>Shop by Device</span>
                <span>Shop by Category</span>
                <span>Shop by Brand</span>
              </div>
            }
          >
            <ShopNavigation />
          </Suspense>
        </div>

        <div className="my-2 flex min-w-0 shrink-0 items-center gap-0 small:my-0 small:gap-2">
          <SearchButton />
          <Suspense fallback={<SkeletonAccountButton />}>
            <AccountButton customer={customer} />
          </Suspense>
          {customer && (
            <Suspense fallback={<SkeletonCartButton />}>
              <CartButton />
            </Suspense>
          )}
        </div>
      </div>
    </header>
  )
}
