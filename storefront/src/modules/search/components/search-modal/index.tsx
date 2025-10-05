"use client"

import { itemsJSSearch, SearchProduct } from "@/lib/search/itemsjs-search"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

// Simple SVG icons
const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const XIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchProduct[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Extract country code from pathname (e.g., /us/products/... -> us)
  const countryCode = pathname?.split('/')[1] || 'us'

  const searchProducts = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      console.log("Searching with itemsjs for:", searchQuery)
      
      // Use itemsjs for instant search
      const suggestions = itemsJSSearch.getSuggestions(searchQuery, 20)
      setResults(suggestions)
      
      console.log("Search results:", suggestions)
    } catch (error) {
      console.error("Search error:", error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchProducts(query)
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [query, searchProducts])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }
    
    if (isOpen) {
      document.addEventListener("keydown", handleEsc)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEsc)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleProductClick = (handle: string) => {
    router.push(`/${countryCode}/products/${handle}`)
    onClose()
    setQuery("")
    setResults([])
  }

  const handleSearch = () => {
    if (!query.trim()) return

    const searchUrl = `/${countryCode}/search?q=${encodeURIComponent(query.trim())}`
    console.log("=== SEARCH NAVIGATION DEBUG ===")
    console.log("Navigating to search page:", searchUrl)
    console.log("Country code:", countryCode)
    console.log("Query:", query.trim())
    console.log("Current pathname:", pathname)
    console.log("Full URL will be:", window.location.origin + searchUrl)

    // Try navigation with window.location as fallback
    try {
      router.push(searchUrl)
      console.log("router.push called successfully")
    } catch (error) {
      console.error("router.push failed:", error)
      // Fallback to window.location
      window.location.href = searchUrl
    }

    // Clean up after navigation
    setTimeout(() => {
      onClose()
      setQuery("")
      setResults([])
    }, 50)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="relative min-h-screen flex items-start justify-center pt-20">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
          <div className="flex items-center gap-3 p-4 border-b">
            <div className="text-gray-400">
              <SearchIcon />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                console.log("Key pressed:", e.key)
                if (e.key === "Enter") {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log("Enter key pressed, calling handleSearch")
                  handleSearch()
                }
              }}
              placeholder="Cerca prodotti..."
              className="flex-1 outline-none text-base"
              autoFocus
            />
            {query.trim() && (
              <button
                onClick={handleSearch}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                title="Search"
              >
                <SearchIcon />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XIcon />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {loading && (
              <div className="p-8 text-center text-gray-500">
                Searching...
              </div>
            )}

            {!loading && query && results.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No products found for &quot;{query}&quot;
              </div>
            )}

            {!loading && results.length > 0 && (
              <>
                <div className="py-2">
                  {results.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleProductClick(product.handle)}
                      className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-4 transition-colors text-left"
                    >
                      {product.images && product.images.length > 0 && (
                        <div className="relative w-12 h-12 flex-shrink-0">
                          <Image
                            src={product.images[0]}
                            alt={product.title}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {product.title}
                        </div>
                        {product.description && (
                          <div className="text-sm text-gray-500 truncate">
                            {product.description}
                          </div>
                        )}
                        {product.tags && product.tags.length > 0 && (
                          <div className="text-xs text-blue-600 mt-1">
                            {product.tags.slice(0, 2).join(', ')}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="border-t p-4 text-center">
                  <p className="text-sm text-gray-600">
                    Hit Enter to see more results!
                  </p>
                </div>
              </>
            )}

            {!loading && !query && (
              <div className="p-8 text-center text-gray-400">
                Inizia a digitare per cercare tra i prodotti
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}