import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/data/categories", () => ({
  listCategories: async () => [
    { id: "pcat_cases", handle: "cell-phone-cases" },
    { id: "pcat_screens", handle: "screen-protector" },
  ],
}))
vi.mock("@/lib/data/customer", () => ({ retrieveCustomer: async () => null }))
vi.mock("@/lib/data/products", () => ({
  listBngProductOptions: async () => [],
}))
vi.mock("@/modules/store/components/refinement-list", () => ({
  default: () => null,
}))
vi.mock("@/modules/store/components/store-breadcrumb", () => ({
  default: () => null,
}))
vi.mock("@/modules/skeletons/templates/skeleton-product-grid", () => ({
  default: () => null,
}))
vi.mock("@/modules/store/templates/paginated-products", () => ({
  default: ({
    categoryIds,
    sortBy,
  }: {
    categoryIds: string[]
    sortBy: string
  }) => (
    <div data-testid="listing" data-sort={sortBy}>
      {JSON.stringify(categoryIds)}
    </div>
  ),
}))
vi.mock("@/modules/store/templates/paginated-search-results", () => ({
  default: ({
    categoryIds,
    sortBy,
  }: {
    categoryIds: string[]
    sortBy: string
  }) => (
    <div data-testid="search" data-sort={sortBy}>
      {JSON.stringify(categoryIds)}
    </div>
  ),
}))

import StorePage from "@/app/[countryCode]/(main)/store/page"
import SearchPage from "@/app/[countryCode]/(main)/search/page"

describe("store category URL handling", () => {
  it.each([undefined, "iphone"])(
    "passes every selected category to results with search=%s",
    async (search) => {
      render(
        await StorePage({
          params: Promise.resolve({ countryCode: "ca" }),
          searchParams: Promise.resolve({
            category: [
              "cell-phone-cases",
              "screen-protector",
              "cell-phone-cases",
            ],
            search,
          }),
        })
      )
      expect(
        JSON.parse(
          screen.getByTestId(search ? "search" : "listing").textContent!
        )
      ).toEqual(["pcat_cases", "pcat_screens"])
      expect(
        screen
          .getByTestId(search ? "search" : "listing")
          .getAttribute("data-sort")
      ).toBe("featured")
    }
  )

  it("preserves explicit sorting and all category filters on the search page", async () => {
    render(
      await SearchPage({
        params: Promise.resolve({ countryCode: "ca" }),
        searchParams: Promise.resolve({
          q: "iphone",
          sortBy: "created_at",
          category: ["cell-phone-cases", "screen-protector"],
        }),
      })
    )
    const results = screen.getByTestId("search")
    expect(JSON.parse(results.textContent!)).toEqual([
      "pcat_cases",
      "pcat_screens",
    ])
    expect(results.getAttribute("data-sort")).toBe("created_at")
  })

  it("preserves existing single-category links", async () => {
    render(
      await StorePage({
        params: Promise.resolve({ countryCode: "ca" }),
        searchParams: Promise.resolve({ category: "cell-phone-cases" }),
      })
    )
    expect(JSON.parse(screen.getByTestId("listing").textContent!)).toEqual([
      "pcat_cases",
    ])
  })
})
