import { addToCartEventBus } from "@/lib/data/cart-event-bus"
import { convertToLocale } from "@/lib/util/money"
import { HttpTypes, StoreProduct, StoreProductVariant } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import Button from "@/modules/common/components/button"
import ShoppingBag from "@/modules/common/icons/shopping-bag"
import { useState } from "react"
import BulkTableQuantity from "../bulk-table-quantity"
import { B2BCustomer } from "@/types"
import { getAvailableInventory } from "@/lib/util/inventory"

const ProductVariantsTable = ({
  product,
  region,
  customer,
}: {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  customer: B2BCustomer | null
}) => {
  const [isAdding, setIsAdding] = useState(false)
  const [lineItemsMap, setLineItemsMap] = useState<
    Map<
      string,
      StoreProductVariant & {
        product: StoreProduct
        quantity: number
      }
    >
  >(new Map())

  const totalQuantity = Array.from(lineItemsMap.values()).reduce(
    (acc, curr) => acc + curr.quantity,
    0
  )

  const handleQuantityChange = (variantId: string, quantity: number) => {
    setLineItemsMap((prev) => {
      const newLineItems = new Map(prev)

      if (!prev.get(variantId)) {
        newLineItems.set(variantId, {
          ...product.variants?.find((v) => v.id === variantId)!,
          product,
          quantity,
        })
      } else {
        newLineItems.set(variantId, {
          ...prev.get(variantId)!,
          quantity,
        })
      }

      return newLineItems
    })
  }

  const handleAddToCart = async () => {
    setIsAdding(true)

    const lineItems = Array.from(lineItemsMap.entries()).map(
      ([variantId, { quantity, ...variant }]) => ({
        productVariant: {
          ...variant,
        },
        quantity,
      })
    )

    addToCartEventBus.emitCartAdd({
      lineItems,
      regionId: region.id,
    })

    setIsAdding(false)
  }

  const isLoggedIn = !!customer
  const isApproved = !!customer?.metadata?.approved

  if (!isLoggedIn || !isApproved) return null

  return (
    <div className="flex min-w-0 w-full flex-col gap-5">
      <div className="flex min-w-0 flex-col gap-3">
        {product.variants?.map((variant) => {
          const price = variant.calculated_price
          const selected = (lineItemsMap.get(variant.id)?.quantity || 0) > 0
          const optionValues = variant.options
            ?.filter((option) => option.value !== "Default option value")
            .map((option) => option.value)
            .join(" · ")
          return (
            <div
              key={variant.id}
              className={clx(
                "min-w-0 rounded-[20px] border p-4 transition-colors",
                selected
                  ? "border-[#b7cbe4] bg-[#f5f8fc]"
                  : "border-[#eeeef0] bg-[#fafafa]"
              )}
            >
              {optionValues && (
                <p className="mb-2 break-words text-sm font-medium text-[#1d1d1f]">
                  {optionValues}
                </p>
              )}
              <p className="break-all text-[11px] text-[#86868b]">
                SKU {variant.sku || product.handle}
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-[#515154]">
                  {price?.calculated_amount != null && price.currency_code
                    ? convertToLocale({
                        amount: price.calculated_amount,
                        currency_code: price.currency_code,
                      })
                    : "Contact us for pricing"}
                </p>
                <div
                  className="w-40 max-w-full"
                  role="group"
                  aria-label={`Quantity for ${
                    optionValues || variant.sku || product.title
                  }`}
                >
                  <BulkTableQuantity
                    variantId={variant.id}
                    maxQuantity={getAvailableInventory(variant)}
                    onChange={handleQuantityChange}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <Button
        onClick={handleAddToCart}
        variant="primary"
        className="w-full min-h-12 rounded-full bg-[#1d1d1f] text-white shadow-none hover:bg-[#424245]"
        isLoading={isAdding}
        disabled={totalQuantity === 0}
        data-testid="add-product-button"
      >
        <ShoppingBag
          className="text-white"
          fill={totalQuantity === 0 ? "none" : "#fff"}
        />
        {totalQuantity === 0 ? "Select quantity above" : "Add to cart"}
      </Button>
    </div>
  )
}

export default ProductVariantsTable
