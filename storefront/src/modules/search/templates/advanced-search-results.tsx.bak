import { getProductsById } from "@/lib/data/products"
import { getRegion } from "@/lib/data/regions"
import { itemsJSSearch, SearchFilters } from "@/lib/search/itemsjs-search"
import { sortProducts } from "@/lib/util/sort-products"
import ProductPreview from "@/modules/products/components/product-preview"
import { Pagination } from "@/modules/store/components/pagination"
import { SortOptions } from "@/modules/store/components/refinement-list/sort-products"
import { MinimalCustomerInfo } from "@/types"
import { HttpTypes } from "@medusajs/types"
import { Container } from "@medusajs/ui"

const SEARCH_LIMIT = 48

export default async function AdvancedSearchResults({
  searchQuery,
  countryCode,
  customer,
  page = 1,
  sortBy = "created_at",
  filters = {},
}: {
  searchQuery: string
  countryCode: string
  customer: MinimalCustomerInfo | null
  page?: number
  sortBy?: SortOptions
  filters?: SearchFilters
}) {
  if (!searchQuery?.trim()) {
    return null
  }

  const region = await getRegion(countryCode)
  if (!region) {
    return null
  }

  // Use itemsjs to search products with filters and pagination
  const sortMapping = {
    "price_asc": "title_asc", 
    "price_desc": "title_desc",
    "created_at": ""
  }

  const searchResult = itemsJSSearch.search({
    query: searchQuery,
    page: page,
    per_page: SEARCH_LIMIT,
    sort: sortMapping[sortBy],
    filters: filters
  })

  const productIds = searchResult.data.items.map(item => item.id)
  const totalCount = searchResult.data.pagination.total
  const totalPages = Math.ceil(totalCount / SEARCH_LIMIT)

  if (productIds.length === 0 && page === 1) {
    return (
      <Container className="text-center text-sm text-neutral-500 py-8">
        No products found matching your search and filters.
      </Container>
    )
  }

  // Fetch full product data for the current page
  let products: HttpTypes.StoreProduct[] = []

  if (productIds.length > 0) {
    products = await getProductsById({
      ids: productIds,
      regionId: region.id,
    })

    // Sort products to maintain search result order if no specific sorting was requested
    if (sortBy === "created_at") {
      const productMap = new Map(products.map(p => [p.id, p]))
      products = productIds
        .map(id => productMap.get(id))
        .filter((p): p is HttpTypes.StoreProduct => p !== undefined)
    } else {
      // Apply Medusa sorting for price-based sorting
      products = sortProducts(products, sortBy)
    }
  }

  return (
    <>
      <div className="mb-4 text-sm text-gray-600">
        {totalCount === 1 
          ? `1 result found`
          : `${totalCount} results found`
        }
        {searchQuery && ` for "${searchQuery}"`}
      </div>
      
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