import { Suspense } from "react"
import { retrieveCustomer } from "@/lib/data/customer"
import { listCategories } from "@/lib/data/categories"
import PaginatedSearchResults from "@/modules/store/templates/paginated-search-results"
import SkeletonProductGrid from "@/modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@/modules/store/components/refinement-list"
import StoreBreadcrumb from "@/modules/store/components/store-breadcrumb"
import { SortOptions } from "@/modules/store/components/refinement-list/sort-products"
import { MinimalCustomerInfo } from "@/types"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Search Results",
  description: "Search our products.",
}

type Params = {
  searchParams: Promise<{
    q?: string
    sortBy?: SortOptions
    category?: string
    page?: string
  }>
  params: Promise<{ countryCode: string }>
}

export default async function SearchPage(props: Params) {
  const params = await props.params
  const searchParams = await props.searchParams
  const { q: searchQuery, sortBy, category, page } = searchParams

  const sort = sortBy || "created_at"
  const pageNumber = page ? parseInt(page) : 1
  const categories = await listCategories()
  const customer = await retrieveCustomer().catch(() => null)

  const minimalCustomerInfo: MinimalCustomerInfo = {
    isLoggedIn: !!customer,
    isApproved: !!customer?.metadata?.approved,
  }

  // Find the current category if category handle is provided
  const currentCategory = category
    ? categories.find(cat => cat.handle === category)
    : undefined

  return (
    <div className="bg-neutral-100">
      <div
        className="flex flex-col py-6 content-container gap-4"
        data-testid="search-container"
      >
        <StoreBreadcrumb />

        {searchQuery && (
          <div className="mb-2">
            <h1 className="text-2xl font-semibold">
              Search Results for: {searchQuery}
            </h1>
          </div>
        )}

        <div className="flex flex-col small:flex-row small:items-start gap-3">
          <RefinementList
            sortBy={sort}
            categories={categories}
            currentCategory={currentCategory}
            hideSearch={true}
          />
          <div className="w-full">
            <Suspense fallback={<SkeletonProductGrid />}>
              <PaginatedSearchResults
                searchQuery={searchQuery || ""}
                countryCode={params.countryCode}
                customer={minimalCustomerInfo}
                page={pageNumber}
                sortBy={sort}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}