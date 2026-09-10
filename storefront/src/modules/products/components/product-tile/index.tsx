import Image from "next/image"
import type { ReactNode } from "react"
import type { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import PlaceholderImage from "@/modules/common/icons/placeholder-image"
import { convertToLocale } from "@/lib/util/money"
import type { MinimalCustomerInfo } from "@/types"

export default function ProductTile({
  product,
  customer,
  footer,
  variant = "grid",
}: {
  product: HttpTypes.StoreProduct
  customer: MinimalCustomerInfo | null
  footer?: ReactNode
  variant?: "grid" | "tray"
}) {
  const price = product.variants
    ?.flatMap(({ calculated_price }) =>
      calculated_price?.calculated_amount != null &&
      calculated_price.currency_code
        ? [calculated_price]
        : []
    )
    .sort((a, b) => a.calculated_amount! - b.calculated_amount!)[0]
  const canViewPrice = customer?.isLoggedIn && customer.isApproved && price
  const image = product.thumbnail || product.images?.[0]?.url
  const onSale =
    canViewPrice &&
    price.original_amount != null &&
    price.original_amount > price.calculated_amount!

  return (
    <article
      data-testid="product-wrapper"
      className={`group flex h-full min-h-[410px] min-w-0 flex-col rounded-[24px] bg-white p-7 shadow-[0_4px_20px_rgba(0,0,0,0.035)] ${
        variant === "tray"
          ? "touch-auto"
          : "transition duration-300 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(0,0,0,0.07)] motion-reduce:transform-none motion-reduce:transition-none"
      }`}
    >
      <LocalizedClientLink
        href={`/products/${product.handle}`}
        draggable={variant === "tray" ? false : undefined}
        className="flex flex-1 flex-col rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0066cc]"
      >
        <div className="relative mb-7 h-52 w-full">
          {image ? (
            <Image
              src={image}
              alt={product.title}
              draggable={variant === "tray" ? false : undefined}
              fill
              sizes="(min-width: 1024px) 250px, (min-width: 640px) 40vw, 80vw"
              className="object-contain mix-blend-multiply"
            />
          ) : (
            <div
              className="flex h-full items-center justify-center text-[#86868b]"
              aria-hidden="true"
            >
              <PlaceholderImage size={64} />
            </div>
          )}
        </div>
        <p className="mb-2 break-all text-[10px] font-medium uppercase tracking-wider text-[#86868b]">
          SKU: {product.handle}
        </p>
        <h3
          data-testid="product-title"
          className="line-clamp-2 text-[17px] font-semibold leading-snug tracking-tight text-[#1d1d1f]"
        >
          {product.title}
        </h3>
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div className="text-sm text-[#6e6e73]">
            {onSale && (
              <p data-testid="original-price" className="text-xs line-through">
                {convertToLocale({
                  amount: price.original_amount!,
                  currency_code: price.currency_code!,
                })}
              </p>
            )}
            <p data-testid={canViewPrice ? "price" : undefined}>
              {canViewPrice
                ? convertToLocale({
                    amount: price.calculated_amount!,
                    currency_code: price.currency_code!,
                  })
                : customer?.isLoggedIn
                ? "Contact us for pricing"
                : "Log in for pricing"}
            </p>
          </div>
          <span aria-hidden="true" className="text-lg text-[#0066cc]">
            ↗
          </span>
        </div>
      </LocalizedClientLink>
      {footer && (
        <div className="mt-5 border-t border-[#f0f0f2] pt-4">{footer}</div>
      )}
    </article>
  )
}
