import { retrieveCustomer } from "@/lib/data/customer"
import SkeletonSearchGrid from "@/modules/skeletons/templates/skeleton-search-grid"
import { SortOptions } from "@/modules/store/components/refinement-list/sort-products"
import StoreBreadcrumb from "@/modules/store/components/store-breadcrumb"
import FilteredSearchResults from "@/modules/store/templates/filtered-search-results"
import { MinimalCustomerInfo } from "@/types"
import { Metadata } from "next"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Advanced Search Results",
  description: "Search our products with advanced filters.",
}

type Params = {
  searchParams: Promise<{
    q?: string
    sortBy?: SortOptions
    page?: string
    tags?: string
    colors?: string
    sizes?: string
    outlet?: string
  }>
  params: Promise<{ countryCode: string }>
}

export default async function AdvancedSearchPage(props: Params) {
  const params = await props.params
  const searchParams = await props.searchParams
  const { q: searchQuery, sortBy, page, tags, colors, sizes, outlet } = searchParams

  const sort = sortBy || "created_at"
  const pageNumber = page ? parseInt(page) : 1
  const customer = await retrieveCustomer().catch(() => null)

  const minimalCustomerInfo: MinimalCustomerInfo = {
    isLoggedIn: !!customer,
    isApproved: !!customer?.metadata?.approved,
  }

  // Parse filters from URL params
  const filters = {
    tags: tags ? tags.split(',') : undefined,
    colors: colors ? colors.split(',') : undefined,
    sizes: sizes ? sizes.split(',') : undefined,
    outlet: outlet === 'true' ? true : undefined,
  }

  return (
    <div className="bg-neutral-100">
      <div
        className="flex flex-col py-6 content-container gap-4"
        data-testid="advanced-search-container"
      >
        <StoreBreadcrumb />

        {searchQuery && (
          <div className="mb-2">
            <h1 className="text-2xl font-semibold">
              Advanced Search Results for: {searchQuery}
            </h1>
          </div>
        )}

        <div className="w-full">
          <Suspense fallback={<SkeletonSearchGrid />}>
            <FilteredSearchResults
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
  )
}