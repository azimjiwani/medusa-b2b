import { getBngInventoryUrl } from "./steps/bng-inventory-url"
import type { BngProductOptionSource } from "./bng-product-options"

export interface BngInventoryProduct extends BngProductOptionSource {
  upcCode: string
  productName: string
  quantity: string
  price: number
  price_WholesaleLevel1: number
  price_WholesaleLevel2: number
  price_WholesaleLevel3: number
  productCategory: string
  productSubCategory: string
  productAvailabilityType: string
  brand?: string | null
  color?: string | null
  device?: string | null
  capacity?: string | null
  length?: string | null
  material?: string | null
  memory?: string | null
  watts?: string | null
}

export async function fetchBngInventoryProducts(): Promise<BngInventoryProduct[]> {
  const response = await fetch(getBngInventoryUrl(), {
    headers: {
      APIKey: process.env.BNG_API_KEY || "",
    },
  })
  if (!response.ok) {
    throw new Error(`BNG inventory request failed with status ${response.status}`)
  }

  const body = (await response.json()) as { data?: unknown }
  if (!Array.isArray(body.data)) {
    throw new Error("BNG inventory response did not contain a product array")
  }

  return body.data as BngInventoryProduct[]
}
