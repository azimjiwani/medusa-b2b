import { HttpTypes } from "@medusajs/types"
import { B2BCustomer } from "@/types"
import { convertToLocale } from "@/lib/util/money"

export default function ProductPrice({
  product,
  customer,
}: {
  product: HttpTypes.StoreProduct
  customer: B2BCustomer | null
}) {
  if (!customer?.metadata?.approved) return null
  const price = product.variants
    ?.flatMap(({ calculated_price }) =>
      calculated_price?.calculated_amount != null &&
      calculated_price.currency_code
        ? [calculated_price]
        : []
    )
    .sort((a, b) => a.calculated_amount! - b.calculated_amount!)[0]
  if (!price)
    return <p className="text-sm text-[#6e6e73]">Contact us for pricing.</p>
  const onSale =
    price.original_amount != null &&
    price.original_amount > price.calculated_amount!
  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {onSale && (
          <p
            className="text-sm text-[#86868b] line-through"
            data-testid="original-product-price"
            data-value={price.original_amount}
          >
            {convertToLocale({
              amount: price.original_amount!,
              currency_code: price.currency_code!,
            })}
          </p>
        )}
      </div>
    </div>
  )
}
