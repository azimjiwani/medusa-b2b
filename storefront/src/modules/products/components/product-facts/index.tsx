import { HttpTypes } from "@medusajs/types"
import { B2BCustomer } from "@/types"
import { formatInventory, getAvailableInventory } from "@/lib/util/inventory"

const ProductFacts = ({
  product,
  customer,
}: {
  product: HttpTypes.StoreProduct
  customer: B2BCustomer | null
}) => {
  const approved = !!customer?.metadata?.approved
  const quantity =
    product.variants?.reduce(
      (sum, variant) => sum + getAvailableInventory(variant),
      0
    ) || 0
  if (!approved && !product.mid_code) return null
  return (
    <div className="flex w-full flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#eeeef0] pt-5 text-xs text-[#6e6e73]">
      {approved && (
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden="true"
            className={`h-1.5 w-1.5 rounded-full ${
              quantity > 0 ? "bg-[#40916c]" : "bg-[#86868b]"
            }`}
          />
          {formatInventory(quantity)}
        </span>
      )}
      {product.mid_code && (
        <span className="break-all">MID: {product.mid_code}</span>
      )}
    </div>
  )
}
export default ProductFacts
