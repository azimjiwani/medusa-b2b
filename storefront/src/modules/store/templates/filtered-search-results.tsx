"use client"

import { getRegion } from "@/lib/data/regions"
import { itemsJSSearch, SearchFilters } from "@/lib/search/itemsjs-search"
import SearchProductPreview from "@/modules/products/components/search-product-preview"
import SkeletonSearchGrid from "@/modules/skeletons/templates/skeleton-search-grid"
import { Pagination } from "@/modules/store/components/pagination"
import { SortOptions } from "@/modules/store/components/refinement-list/sort-products"
import { MinimalCustomerInfo } from "@/types"
import { HttpTypes } from "@medusajs/types"
import { Container } from "@medusajs/ui"
import { useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

const SEARCH_LIMIT = 24

interface FilteredSearchResultsProps {
  searchQuery: string
  countryCode: string
  customer: MinimalCustomerInfo | null
  page?: number
  sortBy?: SortOptions
  categoryId?: string // Add category support
}

export default function FilteredSearchResults({
  searchQuery,
  countryCode,
  customer,
  page = 1,
  sortBy = "created_at",
  categoryId, // Add category support
}: FilteredSearchResultsProps) {
  const searchParams = useSearchParams()
  const [searchResults, setSearchResults] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [region, setRegion] = useState<HttpTypes.StoreRegion | null>(null)

  // Get filters from URL params
  const filters = useMemo(() => {
    const urlFilters: SearchFilters = {}
    
    const tags = searchParams.get('tags')
    if (tags) {
      urlFilters.tags = tags.split(',')
    }
    
    const colors = searchParams.get('colors')
    if (colors) {
      urlFilters.colors = colors.split(',')
    }
    
    const sizes = searchParams.get('sizes')
    if (sizes) {
      urlFilters.sizes = sizes.split(',')
    }
    
    const outlet = searchParams.get('outlet')
    if (outlet === 'true') {
      urlFilters.outlet = true
    }
    
    return urlFilters
  }, [searchParams])

  // Load region
  useEffect(() => {
    getRegion(countryCode).then(setRegion)
  }, [countryCode])

  // Search using only ItemsJS data when filters or search change
  useEffect(() => {
    const loadSearchResults = async () => {
      console.log('🔍 FilteredSearchResults: Using ItemsJS ONLY - NO API calls to Medusa') // Debug log
      setLoading(true)
      
      try {
        // Use itemsjs to search with filters - no backend API calls needed
        const sortMapping: Record<string, string> = {
          "price_asc": "title_asc",
          "price_desc": "title_desc", 
          "created_at": ""
        }

        console.log('🔍 Searching with:', { searchQuery, page, filters }) // Debug log

        const searchResult = itemsJSSearch.search({
          query: searchQuery,
          page: page,
          per_page: SEARCH_LIMIT,
          sort: sortMapping[sortBy] || "",
          filters: filters
        })

        console.log('🔍 ItemsJS results:', searchResult.data.items.length, 'products found') // Debug log
        setSearchResults(searchResult)
      } catch (error) {
        console.error('Error searching products:', error)
        setSearchResults(null)
      } finally {
        setLoading(false)
      }
    }

    loadSearchResults()
  }, [searchQuery, filters, page, sortBy])

  if (loading) {
    return <SkeletonSearchGrid count={SEARCH_LIMIT} />
  }

  if (!searchResults || searchResults.data.items.length === 0) {
    return (
      <Container className="text-center text-sm text-neutral-500 py-8">
        No products found matching your search and filters.
      </Container>
    )
  }

  const products = searchResults.data.items
  const totalCount = searchResults.data.pagination.total
  const totalPages = Math.ceil(totalCount / SEARCH_LIMIT)

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
        {products.map((product: any) => (
          <li key={product.id}>
            <SearchProductPreview product={product} region={region} customer={customer} />
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