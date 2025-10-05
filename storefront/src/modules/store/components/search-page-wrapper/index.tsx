"use client"

import { SearchFilters } from "@/lib/search/itemsjs-search"
import RefinementList from "@/modules/store/components/refinement-list"
import { SortOptions } from "@/modules/store/components/refinement-list/sort-products"
import { HttpTypes } from "@medusajs/types"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

interface SearchPageWrapperProps {
  sortBy: SortOptions
  categories: HttpTypes.StoreProductCategory[]
  currentCategory?: HttpTypes.StoreProductCategory
  searchQuery?: string
  hideSearch?: boolean
  children: React.ReactNode
}

export default function SearchPageWrapper({
  sortBy,
  categories,
  currentCategory,
  searchQuery = "",
  hideSearch = false,
  children
}: SearchPageWrapperProps) {
  const searchParams = useSearchParams()
  const [activeFilters, setActiveFilters] = useState<SearchFilters>({})

  // Initialize filters from URL on mount
  useEffect(() => {
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
    
    setActiveFilters(urlFilters)
  }, [searchParams])

  const handleFiltersChange = (filters: SearchFilters) => {
    setActiveFilters(filters)
  }

  return (
    <div className="flex flex-col small:flex-row small:items-start gap-3">
      <RefinementList
        sortBy={sortBy}
        categories={categories}
        currentCategory={currentCategory}
        searchQuery={searchQuery}
        hideSearch={hideSearch}
        onFiltersChange={handleFiltersChange}
      />
      <div className="w-full">
        {children}
      </div>
    </div>
  )
}