"use client"

import { ChevronDownMini, ChevronUpMini } from "@medusajs/icons"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"

import { itemsJSSearch, SearchFilters } from "@/lib/search/itemsjs-search"
import { HttpTypes } from "@medusajs/types"
import { Container } from "@medusajs/ui"
import CategoryList from "./category-list"
import SearchInResults from "./search-in-results"
import { SortOptions } from "./sort-products"

type RefinementListProps = {
  sortBy: SortOptions
  listName?: string
  "data-testid"?: string
  categories?: HttpTypes.StoreProductCategory[]
  currentCategory?: HttpTypes.StoreProductCategory
  hideSearch?: boolean
  searchQuery?: string
  onFiltersChange?: (filters: SearchFilters) => void
}

// Faceted filter component
const FacetedFilter = ({
  title,
  options,
  selectedValues,
  onToggle,
  maxVisible = 10,
}: {
  title: string
  options: Array<{ key: string; count: number }>
  selectedValues: string[]
  onToggle: (value: string) => void
  maxVisible?: number
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const visibleOptions = showAll ? options : options.slice(0, maxVisible)
  const hasMore = options.length > maxVisible

  if (options.length === 0) return null

  return (
    <div className="border-b border-neutral-200 last:border-b-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50"
      >
        <span className="font-medium text-sm">{title}</span>
        {isExpanded ? (
          <ChevronUpMini className="w-4 h-4" />
        ) : (
          <ChevronDownMini className="w-4 h-4" />
        )}
      </button>
      
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2 max-h-64 overflow-y-auto">
          {visibleOptions.map(({ key, count }) => (
            <label key={key} className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={selectedValues.includes(key)}
                onChange={() => onToggle(key)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 flex-1">{key}</span>
              <span className="text-xs text-gray-500 ml-2">({count})</span>
            </label>
          ))}
          
          {hasMore && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm text-blue-600 hover:text-blue-800 mt-2"
            >
              {showAll ? 'Show Less' : `Show All (${options.length})`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

const RefinementList = ({
  sortBy,
  listName,
  "data-testid": dataTestId,
  categories,
  currentCategory,
  hideSearch = false,
  searchQuery = "",
  onFiltersChange,
}: RefinementListProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // State for active filters
  const [activeFilters, setActiveFilters] = useState<SearchFilters>({})

  // Get aggregations from itemsjs based on current search and filters
  const aggregations = useMemo(() => {
    console.log('Calculating aggregations with:', { searchQuery, activeFilters }) // Debug log
    
    const searchResult = itemsJSSearch.search({
      query: searchQuery,
      filters: activeFilters,
      per_page: 0 // We only want aggregations
    })
    
    console.log('Aggregations result:', searchResult.data.aggregations) // Debug log
    return searchResult.data.aggregations
  }, [searchQuery, activeFilters])

  // Initialize filters from URL params on mount
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

  // Update URL and notify parent when filters change
  useEffect(() => {
    onFiltersChange?.(activeFilters)
    
    // Update URL params
    const params = new URLSearchParams(searchParams)
    
    // Update tags
    if (activeFilters.tags?.length) {
      params.set('tags', activeFilters.tags.join(','))
    } else {
      params.delete('tags')
    }
    
    // Update colors
    if (activeFilters.colors?.length) {
      params.set('colors', activeFilters.colors.join(','))
    } else {
      params.delete('colors')
    }
    
    // Update sizes
    if (activeFilters.sizes?.length) {
      params.set('sizes', activeFilters.sizes.join(','))
    } else {
      params.delete('sizes')
    }
    
    // Update outlet
    if (activeFilters.outlet) {
      params.set('outlet', 'true')
    } else {
      params.delete('outlet')
    }
    
    // Only reset page when actual filters change, not when page changes
    // Check if we're only changing pagination vs changing actual filters
    const currentFilters = {
      tags: searchParams.get('tags'),
      colors: searchParams.get('colors'), 
      sizes: searchParams.get('sizes'),
      outlet: searchParams.get('outlet')
    }
    
    const newFilters = {
      tags: activeFilters.tags?.join(',') || null,
      colors: activeFilters.colors?.join(',') || null,
      sizes: activeFilters.sizes?.join(',') || null,
      outlet: activeFilters.outlet ? 'true' : null
    }
    
    // Only reset page if filters actually changed
    const filtersChanged = (
      currentFilters.tags !== newFilters.tags ||
      currentFilters.colors !== newFilters.colors ||
      currentFilters.sizes !== newFilters.sizes ||
      currentFilters.outlet !== newFilters.outlet
    )
    
    if (filtersChanged) {
      params.delete('page')
    }
    
    const newUrl = `${pathname}?${params.toString()}`
    if (newUrl !== `${pathname}?${searchParams.toString()}`) {
      router.push(newUrl, { scroll: false })
    }
  }, [activeFilters, onFiltersChange, pathname, router, searchParams])

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)
      return params.toString()
    },
    [searchParams]
  )

  const setQueryParams = (name: string, value: string) => {
    const query = createQueryString(name, value)
    router.push(`${pathname}?${query}`)
  }

  const handleFilterToggle = (filterType: keyof SearchFilters, value: string) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev }
      
      if (filterType === 'outlet') {
        newFilters.outlet = newFilters.outlet ? undefined : true
        return newFilters
      }
      
      const currentValues = (prev[filterType] as string[]) || []
      
      if (currentValues.includes(value)) {
        // Remove value
        const newValues = currentValues.filter(v => v !== value)
        if (newValues.length === 0) {
          delete newFilters[filterType]
        } else {
          (newFilters[filterType] as string[]) = newValues
        }
      } else {
        // Add value
        (newFilters[filterType] as string[]) = [...currentValues, value]
      }
      
      return newFilters
    })
  }

  const clearAllFilters = () => {
    setActiveFilters({})
  }

  const hasActiveFilters = Object.keys(activeFilters).some(key => {
    const value = activeFilters[key as keyof SearchFilters]
    return Array.isArray(value) ? value.length > 0 : value
  })

  // Convert aggregations to the format expected by FacetedFilter
  const getFilterOptions = (aggregationKey: string) => {
    const agg = aggregations?.[aggregationKey]
    if (!agg) return []
    
    console.log(`Debug aggregation for ${aggregationKey}:`, agg) // Debug log
    
    type FilterOption = { key: string; count: number }
    
    // ItemsJS aggregations structure: direct array of {key, doc_count, selected}
    if (Array.isArray(agg)) {
      return agg.map((bucket: any) => ({
        key: String(bucket.key || ''),
        count: bucket.doc_count || 0
      })).filter((item: FilterOption) => item.key).sort((a: FilterOption, b: FilterOption) => b.count - a.count)
    }
    
    // Fallback: check if it has buckets property
    if (Array.isArray(agg.buckets)) {
      return agg.buckets.map((bucket: any) => ({
        key: String(bucket.key || bucket.name || bucket.value || ''),
        count: bucket.doc_count || bucket.count || 0
      })).filter((item: FilterOption) => item.key).sort((a: FilterOption, b: FilterOption) => b.count - a.count)
    }
    
    // Structure 2: agg.buckets as object {key: count}
    if (agg.buckets && typeof agg.buckets === 'object') {
      return Object.entries(agg.buckets).map(([key, count]) => ({
        key: String(key),
        count: typeof count === 'number' ? count : (count as any)?.doc_count || (count as any)?.count || 0
      })).filter((item: FilterOption) => item.key).sort((a: FilterOption, b: FilterOption) => b.count - a.count)
    }
    
    // Structure 3: Direct aggregation object {key: count}
    if (typeof agg === 'object' && !agg.buckets) {
      return Object.entries(agg).map(([key, count]) => ({
        key: String(key),
        count: typeof count === 'number' ? count : 0
      })).filter((item: FilterOption) => item.key && item.key !== 'buckets').sort((a: FilterOption, b: FilterOption) => b.count - a.count)
    }
    
    console.warn(`Unknown aggregation structure for ${aggregationKey}:`, agg)
    return []
  }

  return (
    <div className="flex flex-col divide-neutral-200 small:w-1/5 w-full gap-3">
      <Container className="flex flex-col divide-y divide-neutral-200 p-0 w-full">
        {!hideSearch && <SearchInResults listName={listName} />}

      </Container>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <Container className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Active Filters</span>
            <button
              onClick={clearAllFilters}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {/* Show active filter tags */}
            {activeFilters.tags?.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
              >
                {tag}
                <button
                  onClick={() => handleFilterToggle('tags', tag)}
                  className="ml-1 hover:text-blue-600"
                >
                  ×
                </button>
              </span>
            ))}
            {activeFilters.colors?.map(color => (
              <span
                key={color}
                className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 rounded"
              >
                {color}
                <button
                  onClick={() => handleFilterToggle('colors', color)}
                  className="ml-1 hover:text-green-600"
                >
                  ×
                </button>
              </span>
            ))}
            {activeFilters.sizes?.map(size => (
              <span
                key={size}
                className="inline-flex items-center px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded"
              >
                {size}
                <button
                  onClick={() => handleFilterToggle('sizes', size)}
                  className="ml-1 hover:text-purple-600"
                >
                  ×
                </button>
              </span>
            ))}
            {activeFilters.outlet && (
              <span className="inline-flex items-center px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                Outlet
                <button
                  onClick={() => handleFilterToggle('outlet', 'true')}
                  className="ml-1 hover:text-red-600"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </Container>
      )}

      {/* Faceted Filters */}
      <Container className="p-0">
        <FacetedFilter
          title="Categories"
          options={getFilterOptions('tags')}
          selectedValues={activeFilters.tags || []}
          onToggle={(value) => handleFilterToggle('tags', value)}
          maxVisible={8}
        />
        
        <FacetedFilter
          title="Colors"
          options={getFilterOptions('colors')}
          selectedValues={activeFilters.colors || []}
          onToggle={(value) => handleFilterToggle('colors', value)}
          maxVisible={12}
        />
        
        <FacetedFilter
          title="Sizes"
          options={getFilterOptions('sizes')}
          selectedValues={activeFilters.sizes || []}
          onToggle={(value) => handleFilterToggle('sizes', value)}
          maxVisible={15}
        />

        {/* Outlet Filter */}
        <div className="border-b border-neutral-200 last:border-b-0 p-3">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={activeFilters.outlet || false}
              onChange={() => handleFilterToggle('outlet', 'true')}
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <span className="ml-2 text-sm text-gray-700">Outlet Items</span>
          </label>
        </div>
      </Container>

      {/* Categories - Keep existing category list for navigation */}
      {categories && (
        <CategoryList
          categories={categories}
          currentCategory={currentCategory}
        />
      )}
    </div>
  )
}

export default RefinementList
