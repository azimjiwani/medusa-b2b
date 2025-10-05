import { listCategories } from "@/lib/data/categories"
import { retrieveCustomer } from "@/lib/data/customer"
import SkeletonSearchGrid from "@/modules/skeletons/templates/skeleton-search-grid"
import { SortOptions } from "@/modules/store/components/refinement-list/sort-products"
import SearchPageWrapper from "@/modules/store/components/search-page-wrapper"
import StoreBreadcrumb from "@/modules/store/components/store-breadcrumb"
import FilteredSearchResults from "@/modules/store/templates/filtered-search-results"
import { MinimalCustomerInfo } from "@/types"
import { Metadata } from "next"
import { Suspense } from "react"

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

        <SearchPageWrapper
          sortBy={sort}
          categories={categories}
          currentCategory={currentCategory}
          searchQuery={searchQuery || ""}
          hideSearch={true}
        >
          <Suspense fallback={<SkeletonSearchGrid />}>
            {/* Using FilteredSearchResults with ItemsJS only */}
            <FilteredSearchResults
              searchQuery={searchQuery || ""}
              countryCode={params.countryCode}
              customer={minimalCustomerInfo}
              page={pageNumber}
              sortBy={sort}
            />
          </Suspense>
        </SearchPageWrapper>
      </div>
    </div>
  )
}