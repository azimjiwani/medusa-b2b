/** Keep selected empty categories available so bookmarked filters can be cleared. */
export function getVisibleCategories<
  T extends { handle: string; products?: unknown[] | null }
>(categories: T[], selected: string[] = []): T[] {
  return categories.filter(
    (category) =>
      category.products?.length !== 0 || selected.includes(category.handle)
  )
}
