import { retrieveCustomer } from "@/lib/data/customer"
import AccountButton from "@/modules/account/components/account-button"
import CartButton from "@/modules/cart/components/cart-button"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import Image from "next/image"
import { SearchButton } from "@/modules/search/components/search-button"
import SkeletonAccountButton from "@/modules/skeletons/components/skeleton-account-button"
import SkeletonCartButton from "@/modules/skeletons/components/skeleton-cart-button"
import { Suspense } from "react"

export async function NavigationHeader() {
  const customer = await retrieveCustomer().catch(() => null)

  return (
    <header className="sticky inset-x-0 top-0 z-50 text-[#1d1d1f]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 border-b border-black/[0.05] bg-white/90 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80"
      />
      <div className="relative mx-auto flex min-h-16 max-w-[1344px] items-center justify-between gap-3 px-4 small:min-h-20 small:gap-6 small:px-8">
        <LocalizedClientLink
          className="flex min-h-11 shrink-0 items-center gap-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0066cc]"
          aria-label="Batteries N’ Things home"
          href="/"
        >
          <Image
            src="/logo.png"
            alt=""
            width={28}
            height={28}
            className="shrink-0"
          />
          <span className="hidden text-sm font-semibold tracking-[-0.035em] min-[380px]:inline small:text-[17px]">
            Batteries N&apos; Things
          </span>
        </LocalizedClientLink>

        <div className="flex min-w-0 shrink-0 items-center gap-1 small:gap-2">
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
