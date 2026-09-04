import { listCategories } from "@/lib/data/categories"
import { retrieveCustomer } from "@/lib/data/customer"
import SkeletonProductGrid from "@/modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@/modules/store/components/refinement-list"
import { SortOptions } from "@/modules/store/components/refinement-list/sort-products"
import StoreBreadcrumb from "@/modules/store/components/store-breadcrumb"
import PaginatedProducts from "@/modules/store/templates/paginated-products"
import { MinimalCustomerInfo } from "@/types"
import { Metadata } from "next"
import { Suspense } from "react"
import { listBngProductOptions } from "@/lib/data/products"
import { parseProductOptionFilters } from "@/lib/util/product-option-filters"
import PaginatedSearchResults from "@/modules/store/templates/paginated-search-results"

export const dynamicParams = true

export const metadata: Metadata = {
  title: "Store",
  description: "Explore all of our products.",
}

type Params = {
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
    search?: string
    category?: string
    option?: string | string[]
  }>
  params: Promise<{
    countryCode: string
  }>
}

export default async function StorePage(props: Params) {
  const params = await props.params
  const searchParams = await props.searchParams
  const { sortBy, page, search, category, option } = searchParams

  const sort = sortBy || "created_at"
  const pageNumber = page ? parseInt(page) : 1

  const categories = await listCategories()
  const customer = await retrieveCustomer()
  const productOptions = await listBngProductOptions()
  const optionFilters = parseProductOptionFilters(option)

  const minimalCustomerInfo: MinimalCustomerInfo = {
    isLoggedIn: !!customer,
    isApproved: !!customer?.metadata?.approved,
  }

  // Find the current category if category handle is provided
  const currentCategory = category
    ? categories.find((cat) => cat.handle === category)
    : undefined

  return (
    <div className="bg-neutral-100">
      <div
        className="flex flex-col py-6 content-container gap-4"
        data-testid="category-container"
      >
        <StoreBreadcrumb />
        <div className="flex flex-col small:flex-row small:items-start gap-3">
          <RefinementList
            sortBy={sort}
            categories={categories}
            currentCategory={currentCategory}
            productOptions={productOptions}
          />
          <div className="w-full">
            <Suspense fallback={<SkeletonProductGrid />}>
              {search ? (
                <PaginatedSearchResults
                  searchQuery={search}
                  countryCode={params.countryCode}
                  customer={minimalCustomerInfo}
                  page={pageNumber}
                  sortBy={sort}
                  categoryId={currentCategory?.id}
                  optionFilters={optionFilters}
                  productOptions={productOptions}
                />
              ) : (
                <PaginatedProducts
                  sortBy={sort}
                  page={pageNumber}
                  categoryId={currentCategory?.id}
                  countryCode={params.countryCode}
                  customer={minimalCustomerInfo}
                  optionFilters={optionFilters}
                  productOptions={productOptions}
                />
              )}
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
