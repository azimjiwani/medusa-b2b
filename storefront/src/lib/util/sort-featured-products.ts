export function sortFeaturedProducts<
  T extends { id: string; created_at?: string | Date | null }
>(products: T[], featuredIds: string[]): T[] {
  const ranks = new Map(featuredIds.map((id, index) => [id, index]))
  const timestamp = (product: T) =>
    product.created_at ? new Date(product.created_at).getTime() || 0 : 0

  return [...products].sort((a, b) => {
    const rankA = ranks.get(a.id)
    const rankB = ranks.get(b.id)
    if (rankA !== undefined || rankB !== undefined) {
      if (rankA === undefined) return 1
      if (rankB === undefined) return -1
      return rankA - rankB
    }
    return timestamp(b) - timestamp(a) || a.id.localeCompare(b.id)
  })
}
