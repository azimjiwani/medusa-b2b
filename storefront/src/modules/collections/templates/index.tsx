import CollectionBreadcrumb from "@/modules/collections/collection-breadcrumb"
import SkeletonProductGrid from "@/modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@/modules/store/components/refinement-list"
import { SortOptions } from "@/modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@/modules/store/templates/paginated-products"
import { MinimalCustomerInfo } from "@/types"
import { HttpTypes } from "@medusajs/types"
import { Suspense } from "react"
import { StorefrontProductOption } from "@/lib/data/products"
import { ProductOptionFilters } from "@/lib/util/product-option-filters"

export default function CollectionTemplate({
  sortBy,
  collection,
  page,
  countryCode,
  customer,
  optionFilters,
  productOptions,
}: {
  sortBy?: SortOptions
  collection: HttpTypes.StoreCollection
  page?: string
  countryCode: string
  customer: MinimalCustomerInfo | null
  optionFilters: ProductOptionFilters
  productOptions: StorefrontProductOption[]
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  return (
    <div className="bg-neutral-100">
      <div className="flex flex-col py-6 content-container gap-4">
        <CollectionBreadcrumb collection={collection} />
        <div className="flex flex-col small:flex-row small:items-start gap-3">
          <RefinementList
            sortBy={sort}
            listName={collection.title}
            productOptions={productOptions}
          />
          <div className="w-full">
            <Suspense fallback={<SkeletonProductGrid />}>
              <PaginatedProducts
                sortBy={sort}
                page={pageNumber}
                collectionId={collection.id}
                countryCode={countryCode}
                customer={customer}
                optionFilters={optionFilters}
                productOptions={productOptions}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
