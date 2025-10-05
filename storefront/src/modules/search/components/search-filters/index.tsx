import { SearchFilters, itemsJSSearch } from "@/lib/search/itemsjs-search"
import { useEffect, useState } from "react"

interface SearchFiltersComponentProps {
  onFiltersChange: (filters: SearchFilters) => void
  initialFilters?: SearchFilters
}

export default function SearchFiltersComponent({ 
  onFiltersChange, 
  initialFilters = {} 
}: SearchFiltersComponentProps) {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters)
  const [availableOptions, setAvailableOptions] = useState({
    tags: [] as string[],
    colors: [] as string[],
    sizes: [] as string[]
  })

  useEffect(() => {
    // Get all available filter options
    setAvailableOptions({
      tags: itemsJSSearch.getFieldValues('tags'),
      colors: itemsJSSearch.getFieldValues('colors'),
      sizes: itemsJSSearch.getFieldValues('sizes')
    })
  }, [])

  useEffect(() => {
    onFiltersChange(filters)
  }, [filters, onFiltersChange])

  const handleTagChange = (tag: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      tags: checked 
        ? [...(prev.tags || []), tag]
        : (prev.tags || []).filter(t => t !== tag)
    }))
  }

  const handleColorChange = (color: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      colors: checked 
        ? [...(prev.colors || []), color]
        : (prev.colors || []).filter(c => c !== color)
    }))
  }

  const handleSizeChange = (size: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      sizes: checked 
        ? [...(prev.sizes || []), size]
        : (prev.sizes || []).filter(s => s !== size)
    }))
  }

  const handleOutletChange = (checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      outlet: checked ? true : undefined
    }))
  }

  const clearFilters = () => {
    setFilters({})
  }

  const hasActiveFilters = filters.tags?.length || filters.colors?.length || filters.sizes?.length || filters.outlet

  return (
    <div className="space-y-6">
      {hasActiveFilters && (
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Active Filters</span>
          <button 
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Tags Filter */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Categories</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {availableOptions.tags.slice(0, 20).map(tag => (
            <label key={tag} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.tags?.includes(tag) || false}
                onChange={(e) => handleTagChange(tag, e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-600">{tag}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Colors Filter */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Colors</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {availableOptions.colors.slice(0, 20).map(color => (
            <label key={color} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.colors?.includes(color) || false}
                onChange={(e) => handleColorChange(color, e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-600">{color}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Sizes Filter */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Sizes</h3>
        <div className="grid grid-cols-3 gap-2">
          {availableOptions.sizes.map(size => (
            <label key={size} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.sizes?.includes(size) || false}
                onChange={(e) => handleSizeChange(size, e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-xs text-gray-600">{size}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Outlet Filter */}
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={filters.outlet || false}
            onChange={(e) => handleOutletChange(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
          <span className="ml-2 text-sm text-gray-600">Outlet Items Only</span>
        </label>
      </div>
    </div>
  )
}