import ProductPreview from "@/modules/products/components/product-preview"
import { Container } from "@medusajs/ui"
import { MinimalCustomerInfo } from "@/types"
import { HttpTypes } from "@medusajs/types"
import { getRegion } from "@/lib/data/regions"

interface SearchHit {
  id: string
  title: string
  description?: string
  handle: string
  thumbnail?: string
  variants?: any[]
  collection?: any
  metadata?: any
  tags?: any[]
  price?: {
    calculated_price: {
      calculated_amount: number
      currency_code: string
    }
  }
}

async function fetchSearchResults(searchQuery: string): Promise<SearchHit[]> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    
    if (process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY) {
      headers["x-publishable-api-key"] = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
    }
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/products/search?q=${encodeURIComponent(searchQuery)}`,
      {
        headers,
        cache: 'no-store',
      }
    )

    if (response.ok) {
      const data = await response.json()
      return data.results?.[0]?.hits || []
    }
    
    return []
  } catch (error) {
    console.error("Search error:", error)
    return []
  }
}

export default async function SearchResults({
  searchQuery,
  countryCode,
  customer,
}: {
  searchQuery: string
  countryCode: string
  customer: MinimalCustomerInfo | null
}) {
  if (!searchQuery?.trim()) {
    return null
  }

  const region = await getRegion(countryCode)
  if (!region) {
    return null
  }

  const searchResults = await fetchSearchResults(searchQuery)

  if (searchResults.length === 0) {
    return (
      <Container className="text-center text-sm text-neutral-500 py-8">
        No products found for &quot;{searchQuery}&quot;
      </Container>
    )
  }

  // Transform search hits to match product format expected by ProductPreview
  const products = searchResults.map((hit: SearchHit) => ({
    id: hit.id,
    title: hit.title,
    handle: hit.handle,
    thumbnail: hit.thumbnail,
    price: hit.price,
    variants: hit.variants || [],
    collection: hit.collection || null,
    metadata: hit.metadata || {},
    tags: hit.tags || [],
    images: [],
  }))

  return (
    <ul
      className="grid grid-cols-1 w-full small:grid-cols-3 medium:grid-cols-4 gap-3"
      data-testid="products-list"
    >
      {products.map((p) => (
        <li key={p.id}>
          <ProductPreview product={p as any} region={region} customer={customer} />
        </li>
      ))}
    </ul>
  )
}