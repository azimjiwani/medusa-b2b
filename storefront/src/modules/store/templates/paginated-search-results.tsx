import ProductPreview from "@/modules/products/components/product-preview"
import { Container } from "@medusajs/ui"
import { MinimalCustomerInfo } from "@/types"
import { getRegion } from "@/lib/data/regions"
import { Pagination } from "@/modules/store/components/pagination"
import {
  listFilteredProducts,
  searchProductIds,
  StorefrontProductOption,
} from "@/lib/data/products"
import { SortOptions } from "@/modules/store/components/refinement-list/sort-products"
import { ProductOptionFilters } from "@/lib/util/product-option-filters"

const SEARCH_LIMIT = 48

export default async function PaginatedSearchResults({
  searchQuery,
  countryCode,
  customer,
  page = 1,
  sortBy = "featured",
  categoryIds = [],
  optionFilters = {},
  productOptions,
}: {
  searchQuery: string
  countryCode: string
  customer: MinimalCustomerInfo | null
  page?: number
  sortBy?: SortOptions
  categoryIds?: string[]
  optionFilters?: ProductOptionFilters
  productOptions: StorefrontProductOption[]
}) {
  if (!searchQuery?.trim()) {
    return null
  }

  const region = await getRegion(countryCode)
  if (!region) {
    return null
  }

  // Fetch ALL search results first
  const productIds = await searchProductIds(searchQuery)

  if (productIds.length === 0) {
    return (
      <Container className="text-center text-sm text-neutral-500 py-8">
        No products found for &quot;{searchQuery}&quot;
      </Container>
    )
  }

  const { products, count } = await listFilteredProducts({
    page,
    queryParams: {
      id: productIds,
      ...(categoryIds.length ? { category_id: categoryIds } : {}),
      limit: SEARCH_LIMIT,
    },
    optionFilters,
    options: productOptions,
    sortBy,
    countryCode,
  })
  const totalPages = Math.ceil(count / SEARCH_LIMIT)

  return (
    <>
      <ul
        className="grid w-full grid-cols-1 min-[640px]:grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-5"
        data-testid="products-list"
      >
        {products.length > 0 ? (
          products.map((p) => (
            <li key={p.id}>
              <ProductPreview product={p} region={region} customer={customer} />
            </li>
          ))
        ) : (
          <Container className="col-span-full text-center text-sm text-neutral-500 py-8">
            No products match the selected filters.
          </Container>
        )}
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
