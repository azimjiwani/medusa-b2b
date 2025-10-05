import { getProductsById } from "@/lib/data/products"
import { getRegion } from "@/lib/data/regions"
import { itemsJSSearch } from "@/lib/search/itemsjs-search"
import { sortProducts } from "@/lib/util/sort-products"
import ProductPreview from "@/modules/products/components/product-preview"
import { SortOptions } from "@/modules/store/components/refinement-list/sort-products"
import { MinimalCustomerInfo } from "@/types"
import { HttpTypes } from "@medusajs/types"
import { Container } from "@medusajs/ui"

export default async function SearchResults({
  searchQuery,
  countryCode,
  customer,
  sortBy = "created_at",
}: {
  searchQuery: string
  countryCode: string
  customer: MinimalCustomerInfo | null
  sortBy?: SortOptions
}) {
  if (!searchQuery?.trim()) {
    return null
  }

  const region = await getRegion(countryCode)
  if (!region) {
    return null
  }

  // Use itemsjs to search products
  const searchResult = itemsJSSearch.search({
    query: searchQuery,
    per_page: 1000 // Get all results for proper sorting
  })

  const productIds = searchResult.data.items.map(item => item.id)

  if (productIds.length === 0) {
    return (
      <Container className="text-center text-sm text-neutral-500 py-8">
        No products found for &quot;{searchQuery}&quot;
      </Container>
    )
  }

  // Fetch full product data using getProductsById
  let products: HttpTypes.StoreProduct[] = []

  if (productIds.length > 0) {
    products = await getProductsById({
      ids: productIds,
      regionId: region.id,
    })

    // Sort products to maintain search result order
    const productMap = new Map(products.map(p => [p.id, p]))
    products = productIds
      .map(id => productMap.get(id))
      .filter((p): p is HttpTypes.StoreProduct => p !== undefined)

    // Apply sorting based on sortBy parameter
    products = sortProducts(products, sortBy)
  }

  return (
    <ul
      className="grid grid-cols-1 w-full small:grid-cols-3 medium:grid-cols-4 gap-3"
      data-testid="products-list"
    >
      {products.map((p) => (
        <li key={p.id}>
          <ProductPreview product={p} region={region} customer={customer} />
        </li>
      ))}
    </ul>
  )
}