import { HttpTypes } from "@medusajs/types"
import PreviewAddToCart from "./preview-add-to-cart"
import ProductTile from "../product-tile"
import { MinimalCustomerInfo } from "@/types"
import { formatInventory, getAvailableInventory } from "@/lib/util/inventory"

export default function ProductPreview({
  product,
  region,
  customer,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
  customer: MinimalCustomerInfo | null
}) {
  if (!product) return null

  const inventoryQuantity =
    product.variants?.reduce(
      (acc, variant) => acc + getAvailableInventory(variant),
      0
    ) || 0

  return (
    <ProductTile
      product={product}
      customer={customer}
      footer={
        customer?.isLoggedIn && customer.isApproved ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[#6e6e73]">
              {formatInventory(inventoryQuantity)}
            </p>
            <PreviewAddToCart
              product={product}
              region={region}
              customer={customer}
            />
          </div>
        ) : undefined
      }
    />
  )
}
