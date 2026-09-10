"use client"

import { HttpTypes } from "@medusajs/types"
import ProductPrice from "../product-price"
import ProductVariantsTable from "../product-variants-table"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { B2BCustomer } from "@/types"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  customer: B2BCustomer | null
}

export default function ProductActions({
  product,
  region,
  customer,
}: ProductActionsProps) {
  if (!customer?.metadata?.approved) {
    return (
      <div className="w-full rounded-[22px] bg-[#f5f5f7] p-5 small:p-6">
        <h2 className="text-lg font-semibold tracking-tight text-[#1d1d1f]">
          {customer
            ? "Your account is awaiting approval."
            : "Your wholesale price starts here."}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[#6e6e73]">
          {customer
            ? "Contact our team for pricing and availability while your account is being reviewed."
            : "Log in to your approved business account to see pricing, check stock, and place your order."}
        </p>
        {customer ? (
          <a
            href="mailto:info@bntbng.com"
            className="mt-4 inline-flex min-h-11 items-center font-medium text-sm text-[#0066cc] hover:underline"
          >
            Contact our team{" "}
            <span aria-hidden="true" className="ml-2">
              ↗
            </span>
          </a>
        ) : (
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
            <LocalizedClientLink
              href="/account"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#1d1d1f] px-6 text-sm font-medium text-white hover:bg-[#424245] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0066cc]"
            >
              Log in
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/account?view=register"
              className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[#0066cc] hover:underline"
            >
              Create an account <span aria-hidden="true">↗</span>
            </LocalizedClientLink>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex min-w-0 w-full flex-col gap-6 border-t border-[#eeeef0] pt-6">
      <ProductPrice product={product} customer={customer} />
      <ProductVariantsTable
        product={product}
        region={region}
        customer={customer}
      />
    </div>
  )
}
