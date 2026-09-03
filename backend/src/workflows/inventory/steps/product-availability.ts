export interface ProductWithAvailability {
  productAvailabilityType: string
}

const B2B_AVAILABILITY_TYPES = new Set(["Both", "WholeSale"])

export function isB2bInventoryProduct(
  product: ProductWithAvailability
): boolean {
  return B2B_AVAILABILITY_TYPES.has(product.productAvailabilityType)
}
