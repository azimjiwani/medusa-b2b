import { listCategories } from "@/lib/data/categories"
import { retrieveCustomer } from "@/lib/data/customer"
import SkeletonSearchGrid from "@/modules/skeletons/templates/skeleton-search-grid"
import RefinementList from "@/modules/store/components/refinement-list"
import { SortOptions } from "@/modules/store/components/refinement-list/sort-products"
import StoreBreadcrumb from "@/modules/store/components/store-breadcrumb"
import FilteredSearchResults from "@/modules/store/templates/filtered-search-results"
import { MinimalCustomerInfo } from "@/types"
import { Metadata } from "next"
import { Suspense } from "react"

export const dynamicParams = true
export const metadata: Metadata = { title: "Store", description: "Explore all of our products." }

type Params = { searchParams: Promise<{ sortBy?: SortOptions; page?: string; search?: string; category?: string }>; params: Promise<{ countryCode: string; lang: string }> }

export default async function StorePage(props: Params) {
  const params = await props.params
  const searchParams = await props.searchParams
  const { sortBy, page, search, category } = searchParams
  const sort = sortBy || "created_at"
  const pageNumber = page ? parseInt(page) : 1
  const categories = await listCategories()
  const customer = await retrieveCustomer()
  const minimalCustomerInfo: MinimalCustomerInfo = { isLoggedIn: !!customer, isApproved: !!customer?.metadata?.approved }
  const currentCategory = category ? categories.find(cat => cat.handle === category) : undefined
  return (
    <div className="bg-neutral-100">
      <div className="flex flex-col py-6 content-container gap-4" data-testid="category-container">
        <StoreBreadcrumb />
        <div className="flex flex-col small:flex-row small:items-start gap-3">
          <RefinementList sortBy={sort} categories={categories} currentCategory={currentCategory} searchQuery={search || ""} />
          <div className="w-full">
            <Suspense fallback={<SkeletonSearchGrid />}> 
              <FilteredSearchResults searchQuery={search || ""} countryCode={params.countryCode} customer={minimalCustomerInfo} page={pageNumber} sortBy={sort} categoryId={currentCategory?.id} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
