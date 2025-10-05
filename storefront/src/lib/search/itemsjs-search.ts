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
  searchableFields: ['title', 'description', 'tags'],
  aggregations: {
    tags: {
      title: 'Tags',
      size: 50,
      conjunction: false
    },
    colors: {
      title: 'Colors',
      size: 50,
      conjunction: false
    },
    sizes: {
      title: 'Sizes',
      size: 20,
      conjunction: false
    },
    outlet: {
      title: 'Outlet',
      size: 2,
      conjunction: false
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
      filters: {}
    }

    // Add filters
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
      searchOptions.filters.outlet = [filters.outlet]
    }

    // Add sorting
    if (sort) {
      searchOptions.sort = sort
    }

    // Perform search
    const result = items.search(searchOptions)

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