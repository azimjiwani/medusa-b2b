import ProductPreview from "@/modules/products/components/product-preview"
import { Container } from "@medusajs/ui"
import { MinimalCustomerInfo } from "@/types"
import { getRegion } from "@/lib/data/regions"
import { Pagination } from "@/modules/store/components/pagination"
import { listProducts } from "@/lib/data/products"
import { HttpTypes } from "@medusajs/types"
import { sortProducts } from "@/lib/util/sort-products"
import { SortOptions } from "@/modules/store/components/refinement-list/sort-products"

const SEARCH_LIMIT = 48

interface SearchHit {
  id: string
  objectID?: string
}

async function fetchAllSearchResults(searchQuery: string): Promise<{ productIds: string[], totalCount: number }> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY) {
      headers["x-publishable-api-key"] = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
    }

    // Fetch ALL search results to enable proper sorting
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/products/search?q=${encodeURIComponent(searchQuery)}&limit=1000`,
      {
        headers,
        cache: 'no-store',
      }
    )

    if (response.ok) {
      const data = await response.json()
      const hits = data.results?.[0]?.hits || []
      const totalCount = data.results?.[0]?.nbHits || 0
      // Extract product IDs from search hits
      const productIds = hits.map((hit: SearchHit) => hit.objectID || hit.id)
      return { productIds, totalCount }
    }

    return { productIds: [], totalCount: 0 }
  } catch (error) {
    console.error("Search error:", error)
    return { productIds: [], totalCount: 0 }
  }
}

export default async function PaginatedSearchResults({
  searchQuery,
  countryCode,
  customer,
  page = 1,
  sortBy = "created_at",
}: {
  searchQuery: string
  countryCode: string
  customer: MinimalCustomerInfo | null
  page?: number
  sortBy?: SortOptions
}) {
  if (!searchQuery?.trim()) {
    return null
  }

  const region = await getRegion(countryCode)
  if (!region) {
    return null
  }

  // Fetch ALL search results first
  const { productIds, totalCount } = await fetchAllSearchResults(searchQuery)
  const totalPages = Math.ceil(totalCount / SEARCH_LIMIT)

  if (productIds.length === 0 && page === 1) {
    return (
      <Container className="text-center text-sm text-neutral-500 py-8">
        No products found for &quot;{searchQuery}&quot;
      </Container>
    )
  }

  // Fetch ALL product data to enable proper sorting
  let allProducts: HttpTypes.StoreProduct[] = []

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
    const productMap = new Map(response.products.map(p => [p.id, p]))
    allProducts = productIds
      .map(id => productMap.get(id))
      .filter((p): p is HttpTypes.StoreProduct => p !== undefined)

    // Apply sorting to ALL products
    allProducts = sortProducts(allProducts, sortBy)
  }

  // Paginate the sorted products
  const pageStart = (page - 1) * SEARCH_LIMIT
  const pageEnd = pageStart + SEARCH_LIMIT
  const products = allProducts.slice(pageStart, pageEnd)

  return (
    <>
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
      {totalPages > 1 && (
        <Pagination
          data-testid="search-pagination"
          page={page}
          totalPages={totalPages}
        />
      )}
    </>
  )
}