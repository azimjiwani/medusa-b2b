import ProductPreview from "@/modules/products/components/product-preview"
import { Container } from "@medusajs/ui"
import { MinimalCustomerInfo } from "@/types"
import { HttpTypes } from "@medusajs/types"
import { getRegion } from "@/lib/data/regions"
import { listProducts } from "@/lib/data/products"
import { sortProducts } from "@/lib/util/sort-products"
import { SortOptions } from "@/modules/store/components/refinement-list/sort-products"

interface SearchHit {
  id: string
  objectID?: string
}

async function fetchSearchResults(searchQuery: string): Promise<string[]> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY) {
      headers["x-publishable-api-key"] =
        process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
    }

    // Fetch up to 1000 search results
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
      }/store/products/search?q=${encodeURIComponent(searchQuery)}&limit=1000`,
      {
        headers,
        cache: "no-store",
      }
    )

    if (response.ok) {
      const data = await response.json()
      const hits = data.results?.[0]?.hits || []
      // Extract product IDs from search hits
      return hits.map((hit: SearchHit) => hit.objectID || hit.id)
    }

    return []
  } catch (error) {
    console.error("Search error:", error)
    return []
  }
}

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

  const productIds = await fetchSearchResults(searchQuery)

  if (productIds.length === 0) {
    return (
      <Container className="text-center text-sm text-neutral-500 py-8">
        No products found for &quot;{searchQuery}&quot;
      </Container>
    )
  }

  // Fetch full product data using the same method as the store page
  let products: HttpTypes.StoreProduct[] = []

  if (productIds.length > 0) {
    const { response } = await listProducts({
      pageParam: 0,
      queryParams: {
        id: productIds,
        limit: productIds.length,
      },
      countryCode,
    })

    // Sort products to maintain search result order
    const productMap = new Map(response.products.map((p) => [p.id, p]))
    products = productIds
      .map((id) => productMap.get(id))
      .filter((p): p is HttpTypes.StoreProduct => p !== undefined)

    // Apply sorting based on sortBy parameter
    products = sortProducts(products, sortBy)
  }

  return (
    <ul
      className="grid w-full grid-cols-1 min-[640px]:grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-5"
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
