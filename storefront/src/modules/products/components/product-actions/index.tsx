"use client"

import { B2BCustomer } from "@/types"
import { HttpTypes } from "@medusajs/types"
import ProductPrice from "../product-price"

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
  return (
    <>
      <div className="flex flex-col gap-y-2 w-full">
        <ProductPrice product={product} customer={customer} />
  {/* Rimosso ProductVariantsTable: la matrice varianti è ora nel template principale */}
      </div>
    </>
  )
}
