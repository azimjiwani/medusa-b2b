import { MagnifyingGlassMini } from "@medusajs/icons"
import { useState, useCallback, useEffect } from "react"
import { debounce } from "lodash"
import { useRouter, useSearchParams, usePathname } from "next/navigation"

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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/products/search?q=${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            "Content-Type": "application/json",
            "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
          },
        }
      )

      if (!response.ok) {
        throw new Error("Search failed")
      }

      const data = await response.json()
      onSearchResults?.(data)
    } catch (error) {
      console.error("Search error:", error)
      onSearchResults?.(null)
    } finally {
      setLoading(false)
    }
  }, [onSearchResults])

  const debouncedUpdate = useCallback(
    debounce((searchQuery: string) => {
      updateSearchParam(searchQuery)
    }, 300),
    []
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
