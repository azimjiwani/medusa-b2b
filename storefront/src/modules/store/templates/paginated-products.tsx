import {
  listFilteredProducts,
  StorefrontProductOption,
} from "@/lib/data/products"
import { ProductOptionFilters } from "@/lib/util/product-option-filters"
import { getRegion } from "@/lib/data/regions"
import ProductPreview from "@/modules/products/components/product-preview"
import { Pagination } from "@/modules/store/components/pagination"
import { SortOptions } from "@/modules/store/components/refinement-list/sort-products"
import { MinimalCustomerInfo } from "@/types"
import { Container } from "@medusajs/ui"

const PRODUCT_LIMIT = 48

type PaginatedProductsParams = {
  limit: number
  collection_id?: string[]
  category_id?: string[]
  id?: string[]
  order?: string
  customer_group_id?: string
}

export default async function PaginatedProducts({
  sortBy,
  page,
  collectionId,
  categoryId,
  categoryIds,
  productsIds,
  countryCode,
  customer,
  optionFilters = {},
  productOptions = [],
}: {
  sortBy?: SortOptions
  page: number
  collectionId?: string
  categoryId?: string
  categoryIds?: string[]
  productsIds?: string[]
  countryCode: string
  customer?: MinimalCustomerInfo | null
  optionFilters?: ProductOptionFilters
  productOptions?: StorefrontProductOption[]
}) {
  const queryParams: PaginatedProductsParams = {
    limit: PRODUCT_LIMIT,
  }

  if (collectionId) {
    queryParams["collection_id"] = [collectionId]
  }

  const selectedCategoryIds = categoryIds ?? (categoryId ? [categoryId] : [])
  if (selectedCategoryIds.length) {
    // Medusa matches any category ID in this array (OR), with distinct products.
    queryParams["category_id"] = selectedCategoryIds
  }

  if (productsIds) {
    queryParams["id"] = productsIds
  }

  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const { products, count } = await listFilteredProducts({
    page,
    queryParams,
    optionFilters,
    options: productOptions,
    sortBy,
    countryCode,
  })

  const totalPages = Math.ceil(count / PRODUCT_LIMIT)

  return (
    <>
      <ul
        className="grid w-full grid-cols-1 min-[640px]:grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-5"
        data-testid="products-list"
      >
        {products.length > 0 ? (
          products.map((p) => {
            return (
              <li key={p.id}>
                <ProductPreview
                  product={p}
                  region={region}
                  customer={customer || null}
                />
              </li>
            )
          })
        ) : (
          <Container className="col-span-full text-center text-sm text-neutral-500">
            No products match the selected filters.
          </Container>
        )}
      </ul>
      {totalPages > 1 && (
        <Pagination
          data-testid="product-pagination"
          page={page}
          totalPages={totalPages}
        />
      )}
    </>
  )
}
