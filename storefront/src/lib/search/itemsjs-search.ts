import * as itemsjs from 'itemsjs'
const searchIndex = require('../../../search-index.json')

export interface SearchProduct {
  id: string
  title: string
  description: string
  handle: string
  status: string
  outlet: boolean
  images: string[]
  tags: string[]
  colors: string[]
  sizes: string[]
  metadata: {
    fabric?: string
    quality?: string
    packaging_bag?: string
    packaging_box?: string
    spree_product_id?: number
    spree_total_on_hand?: number
  }
}

export interface SearchFilters {
  tags?: string[]
  colors?: string[]
  sizes?: string[]
  outlet?: boolean
}

export interface SearchOptions {
  query?: string
  filters?: SearchFilters
  sort?: string
  sortDirection?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

export interface SearchResult {
  data: {
    items: SearchProduct[]
    pagination: {
      page: number
      per_page: number
      total: number
    }
    aggregations: any
  }
}

// Configure itemsjs
const searchConfig = {
  searchableFields: ['title', 'description', 'tags', 'colors', 'sizes'],
  aggregations: {
    tags: {
      title: 'Tags',
      size: 50,
      conjunction: false,
      sort: 'count'
    },
    colors: {
      title: 'Colors',
      size: 50,
      conjunction: false,
      sort: 'count'
    },
    sizes: {
      title: 'Sizes',
      size: 20,
      conjunction: false,
      sort: 'count'
    },
    outlet: {
      title: 'Outlet',
      size: 2,
      conjunction: false,
      sort: 'count'
    }
  },
  sortings: {
    title_asc: {
      field: 'title' as const,
      order: 'asc' as const
    },
    title_desc: {
      field: 'title' as const, 
      order: 'desc' as const
    },
    name_asc: {
      field: 'title' as const,
      order: 'asc' as const
    },
    name_desc: {
      field: 'title' as const,
      order: 'desc' as const
    }
  }
}

console.log('ItemsJS config:', searchConfig) // Debug log
console.log('Search index sample:', searchIndex.items?.slice(0, 2)) // Debug log

// Initialize itemsjs with the search index
const items = itemsjs.default(searchIndex.items as any, searchConfig as any)

export class ItemsJSSearchService {
  search(options: SearchOptions = {}): SearchResult {
    const {
      query = '',
      filters = {},
      sort = '',
      page = 1,
      per_page = 48
    } = options

    // Build itemsjs search options
    const searchOptions: any = {
      query,
      page,
      per_page,
      filters: {},
      aggregations: ['tags', 'colors', 'sizes', 'outlet'] // Ensure aggregations are requested
    }

    // Add filters - ItemsJS expects all filters as arrays
    if (filters.tags && filters.tags.length > 0) {
      searchOptions.filters.tags = filters.tags
    }
    if (filters.colors && filters.colors.length > 0) {
      searchOptions.filters.colors = filters.colors
    }
    if (filters.sizes && filters.sizes.length > 0) {
      searchOptions.filters.sizes = filters.sizes
    }
    if (filters.outlet !== undefined) {
      // ItemsJS expects boolean filters as arrays too
      searchOptions.filters.outlet = [filters.outlet]
    }

    // Add sorting
    if (sort) {
      searchOptions.sort = sort
    }

    console.log('ItemsJS search options:', searchOptions) // Debug log
    console.log('ItemsJS filters passed:', searchOptions.filters) // Debug log

    // Perform search
    const result = items.search(searchOptions)
    
    console.log('ItemsJS raw result:', result) // Debug log
    console.log('ItemsJS aggregations:', result.data.aggregations) // Debug log
    console.log('ItemsJS items count:', result.data.items.length) // Debug log

    return {
      data: {
        items: result.data.items as unknown as SearchProduct[],
        pagination: result.pagination,
        aggregations: result.data.aggregations
      }
    }
  }

  // Get suggestions for autocomplete
  getSuggestions(query: string, limit: number = 10): SearchProduct[] {
    if (!query.trim()) {
      return []
    }

    const result = this.search({
      query,
      per_page: limit
    })

    return result.data.items
  }

  // Get all unique values for a field (useful for filters)
  getFieldValues(field: keyof SearchProduct): string[] {
    const allItems = searchIndex.items as SearchProduct[]
    const values = new Set<string>()

    allItems.forEach(item => {
      const fieldValue = item[field]
      if (Array.isArray(fieldValue)) {
        fieldValue.forEach(val => values.add(String(val)))
      } else if (fieldValue) {
        values.add(String(fieldValue))
      }
    })

    return Array.from(values).sort()
  }

  // Get product by handle
  getProductByHandle(handle: string): SearchProduct | null {
    const allItems = searchIndex.items as SearchProduct[]
    return allItems.find(item => item.handle === handle) || null
  }

  // Get product by ID
  getProductById(id: string): SearchProduct | null {
    const allItems = searchIndex.items as SearchProduct[]
    return allItems.find(item => item.id === id) || null
  }
}

// Export singleton instance
export const itemsJSSearch = new ItemsJSSearchService()