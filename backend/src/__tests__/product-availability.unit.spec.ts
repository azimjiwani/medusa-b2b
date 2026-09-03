import { isB2bInventoryProduct } from "../workflows/inventory/steps/product-availability"

describe("isB2bInventoryProduct", () => {
  it.each(["Both", "WholeSale"])(
    "includes products with %s availability",
    (productAvailabilityType) => {
      expect(isB2bInventoryProduct({ productAvailabilityType })).toBe(true)
    }
  )

  it.each(["Retail", "UnKnown"])(
    "excludes products with %s availability",
    (productAvailabilityType) => {
      expect(isB2bInventoryProduct({ productAvailabilityType })).toBe(false)
    }
  )
})
