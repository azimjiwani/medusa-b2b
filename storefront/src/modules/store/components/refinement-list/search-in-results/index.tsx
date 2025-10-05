import { itemsJSSearch } from "@/lib/search/itemsjs-search"
import { MagnifyingGlassMini } from "@medusajs/icons"
import { debounce } from "lodash"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"

const SearchInResults = ({ 
  listName,
  onSearchResults 
}: { 
  listName?: string
  onSearchResults?: (results: any) => void 
}) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get("search") || "")
  const [loading, setLoading] = useState(false)
  const placeholder = listName ? `Search in ${listName}` : "Search in products"

  const updateSearchParam = useCallback((searchQuery: string) => {
    const params = new URLSearchParams(searchParams)
    if (searchQuery) {
      params.set("search", searchQuery)
      params.delete("page") // Reset pagination when searching
    } else {
      params.delete("search")
    }
    router.push(`${pathname}?${params.toString()}`)
  }, [pathname, router, searchParams])

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      onSearchResults?.(null)
      return
    }

    setLoading(true)
    try {
      // Use itemsjs for instant search
      const searchResult = itemsJSSearch.search({
        query: searchQuery,
        per_page: 1000 // Get all results
      })

      // Transform to match expected format
      const result = {
        results: [{
          hits: searchResult.data.items.map(item => ({
            id: item.id,
            objectID: item.id,
            title: item.title,
            description: item.description,
            handle: item.handle
          })),
          nbHits: searchResult.data.pagination.total
        }]
      }

      onSearchResults?.(result)
    } catch (error) {
      console.error("Search error:", error)
      onSearchResults?.(null)
    } finally {
      setLoading(false)
    }
  }, [onSearchResults])

  const debouncedUpdate = useMemo(
    () => debounce((searchQuery: string) => {
      updateSearchParam(searchQuery)
    }, 300),
    [updateSearchParam]
  )

  useEffect(() => {
    debouncedUpdate(query)
    if (!query.trim()) {
      onSearchResults?.(null)
      setLoading(false)
    } else {
      performSearch(query)
    }
  }, [query, debouncedUpdate, performSearch, onSearchResults])

  return (
    <div className="group relative text-sm focus-within:border-neutral-500 rounded-t-lg focus-within:outline focus-within:outline-neutral-500">
      <input
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full p-2 pr-8 focus:outline-none rounded-lg"
      />
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        {loading ? (
          <div className="w-4 h-4 border-2 border-neutral-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          <MagnifyingGlassMini className="w-4 h-4 text-neutral-500" />
        )}
      </div>
    </div>
  )
}

export default SearchInResults
