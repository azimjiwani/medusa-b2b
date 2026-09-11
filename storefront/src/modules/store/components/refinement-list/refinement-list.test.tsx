import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { HttpTypes } from "@medusajs/types"

import RefinementList from "."
import type { StorefrontProductOption } from "@/lib/data/products"

vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    disconnect() {}
  }
)

const push = vi.fn()
let query = ""
let pathname = "/us/store"

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(query),
}))

const options: StorefrontProductOption[] = [
  {
    id: "opt_brand",
    title: "Brand",
    values: [
      { id: "optval_apple", value: "Apple" },
      { id: "optval_samsung", value: "Samsung" },
    ],
  },
  {
    id: "opt_color",
    title: "Color",
    values: [{ id: "optval_black", value: "Black" }],
  },
]

describe("responsive catalog refinements", () => {
  beforeEach(() => {
    query = "option=opt_brand%3Aoptval_apple&page=3&sortBy=price_asc"
    pathname = "/us/store"
    push.mockReset()
  })

  it("renders equivalent desktop and mobile controls with accessible state", async () => {
    render(
      <RefinementList sortBy="price_asc" hideSearch productOptions={options} />
    )

    expect(screen.getByTestId("desktop-refinement-list").className).toContain(
      "small:flex"
    )
    expect(screen.getByTestId("mobile-refinement-list").className).toContain(
      "small:hidden"
    )
    expect(screen.getByTestId("desktop-product-option-filters")).toBeTruthy()
    expect(screen.queryByPlaceholderText("Search in products")).toBeNull()

    const mobileTrigger = screen.getByRole("button", { name: "Filters" })
    expect(mobileTrigger.getAttribute("aria-expanded")).toBe("false")
    fireEvent.click(mobileTrigger)

    expect(await screen.findByRole("dialog")).toBeTruthy()
    expect(mobileTrigger.getAttribute("aria-expanded")).toBe("true")
    expect(screen.getByTestId("mobile-product-option-filters")).toBeTruthy()
    expect(screen.getAllByLabelText("Filter by Brand: Apple")).toHaveLength(2)
  })

  it("updates ID-based selections, resets the page, and supports chips and clear all", () => {
    render(
      <RefinementList sortBy="price_asc" hideSearch productOptions={options} />
    )

    fireEvent.click(screen.getAllByLabelText("Filter by Color: Black")[0])
    const selectionUrl = new URL(push.mock.calls[0][0], "https://store.test")
    expect(selectionUrl.searchParams.has("page")).toBe(false)
    expect(selectionUrl.searchParams.get("sortBy")).toBe("price_asc")
    expect(selectionUrl.searchParams.getAll("option")).toEqual([
      "opt_brand:optval_apple",
      "opt_color:optval_black",
    ])

    fireEvent.click(screen.getAllByLabelText("Remove Brand: Apple")[0])
    const removalUrl = new URL(push.mock.calls[1][0], "https://store.test")
    expect(removalUrl.searchParams.getAll("option")).toEqual([
      "opt_color:optval_black",
    ])

    fireEvent.click(screen.getAllByRole("button", { name: "Clear all" })[0])
    const clearUrl = new URL(push.mock.calls[2][0], "https://store.test")
    expect(clearUrl.searchParams.has("option")).toBe(false)
    expect(clearUrl.searchParams.get("sortBy")).toBe("price_asc")
  })

  it("composes rapid sort and filter changes from the pending URL state", () => {
    render(
      <RefinementList sortBy="price_asc" hideSearch productOptions={options} />
    )

    fireEvent.change(screen.getAllByTitle("Sort by")[0], {
      target: { value: "price_desc" },
    })
    fireEvent.click(screen.getAllByLabelText("Filter by Color: Black")[0])

    const selectionUrl = new URL(push.mock.calls[1][0], "https://store.test")
    expect(selectionUrl.searchParams.get("sortBy")).toBe("price_desc")
    expect(selectionUrl.searchParams.getAll("option")).toEqual([
      "opt_brand:optval_apple",
      "opt_color:optval_black",
    ])
  })

  it.each(["title_asc", "title_desc"])(
    "selects %s and resets pagination without losing the query or filters",
    (sortBy) => {
      query = "q=iphne&option=opt_brand%3Aoptval_apple&page=3"
      render(
        <RefinementList
          sortBy="created_at"
          hideSearch
          productOptions={options}
        />
      )
      expect(screen.getByRole("option", { name: "Name: A–Z" })).toBeTruthy()
      expect(screen.getByRole("option", { name: "Name: Z–A" })).toBeTruthy()
      fireEvent.change(screen.getAllByTitle("Sort by")[0], {
        target: { value: sortBy },
      })
      const url = new URL(push.mock.calls[0][0], "https://store.test")
      expect(url.searchParams.get("sortBy")).toBe(sortBy)
      expect(url.searchParams.get("q")).toBe("iphne")
      expect(url.searchParams.getAll("option")).toEqual([
        "opt_brand:optval_apple",
      ])
      expect(url.searchParams.has("page")).toBe(false)
    }
  )

  it("shows a clear recovery action for unavailable bookmarked filters", () => {
    query = "option=opt_retired%3Aoptval_gone&sortBy=created_at"
    render(
      <RefinementList sortBy="created_at" hideSearch productOptions={options} />
    )

    expect(screen.getAllByRole("status")[0].textContent).toContain(
      "1 unavailable filter"
    )
    fireEvent.click(screen.getAllByRole("button", { name: "Clear all" })[0])
    const clearUrl = new URL(push.mock.calls[0][0], "https://store.test")
    expect(clearUrl.searchParams.has("option")).toBe(false)
  })
})

const categories = [
  { id: "pcat_cases", name: "Cell Phone Cases", handle: "cell-phone-cases" },
  { id: "pcat_screens", name: "Screen Protector", handle: "screen-protector" },
] as HttpTypes.StoreProductCategory[]

describe("category refinements", () => {
  beforeEach(() => {
    pathname = "/ca/store"
    query =
      "category=cell-phone-cases&search=iphone&option=opt_brand%3Aoptval_apple&page=3&sortBy=price_asc"
    push.mockReset()
  })

  const renderFilters = (productOptions = options) =>
    render(
      <RefinementList
        sortBy="price_asc"
        hideSearch
        categories={categories}
        currentCategory={categories[0]}
        productOptions={productOptions}
      />
    )

  it("shows the bookmarked category on desktop and mobile, even without product options", async () => {
    renderFilters([])
    expect(
      (
        screen.getByLabelText(
          "Filter by Category: Cell Phone Cases"
        ) as HTMLInputElement
      ).checked
    ).toBe(true)
    fireEvent.click(screen.getByRole("button", { name: "Filters" }))
    await screen.findByRole("dialog")
    const checkboxes = screen.getAllByLabelText(
      "Filter by Category: Cell Phone Cases"
    ) as HTMLInputElement[]
    expect(checkboxes).toHaveLength(2)
    expect(checkboxes.every((checkbox) => checkbox.checked)).toBe(true)
    expect(checkboxes[0].name).not.toBe(checkboxes[1].name)
    fireEvent.click(
      screen.getAllByLabelText("Filter by Category: Screen Protector")[1]
    )
    expect(
      new URL(push.mock.calls[0][0], "https://store.test").searchParams.getAll(
        "category"
      )
    ).toEqual(["cell-phone-cases", "screen-protector"])
  })

  it("adds a category and composes rapid option changes without losing search or sort", () => {
    renderFilters()
    fireEvent.click(
      screen.getByLabelText("Filter by Category: Screen Protector")
    )
    fireEvent.click(screen.getByLabelText("Filter by Color: Black"))
    const url = new URL(push.mock.calls[1][0], "https://store.test")
    expect(url.pathname).toBe("/ca/store")
    expect(url.searchParams.getAll("category")).toEqual([
      "cell-phone-cases",
      "screen-protector",
    ])
    expect(url.searchParams.get("search")).toBe("iphone")
    expect(url.searchParams.get("sortBy")).toBe("price_asc")
    expect(url.searchParams.getAll("option")).toEqual([
      "opt_brand:optval_apple",
      "opt_color:optval_black",
    ])
    expect(url.searchParams.has("page")).toBe(false)
  })

  it.each([
    "Filter by Category: Cell Phone Cases",
    "Remove Category: Cell Phone Cases",
  ])("clears just the category with %s", (label) => {
    renderFilters()
    fireEvent.click(screen.getByLabelText(label))
    const url = new URL(push.mock.calls[0][0], "https://store.test")
    expect(url.searchParams.has("category")).toBe(false)
    expect(url.searchParams.has("page")).toBe(false)
    expect(url.searchParams.get("search")).toBe("iphone")
    expect(url.searchParams.get("sortBy")).toBe("price_asc")
    expect(url.searchParams.getAll("option")).toEqual([
      "opt_brand:optval_apple",
    ])
  })

  it("clears category and product options together", () => {
    renderFilters()
    fireEvent.click(screen.getByRole("button", { name: "Clear all" }))
    const url = new URL(push.mock.calls[0][0], "https://store.test")
    expect(url.searchParams.has("category")).toBe(false)
    expect(url.searchParams.has("option")).toBe(false)
    expect(url.searchParams.has("page")).toBe(false)
    expect(url.searchParams.get("search")).toBe("iphone")
    expect(url.searchParams.get("sortBy")).toBe("price_asc")
  })

  it("navigates from a category route to the localized store when changing category", () => {
    pathname = "/ca/categories/cell-phone-cases"
    query = "option=opt_brand%3Aoptval_apple&page=3"
    renderFilters()
    expect(
      (
        screen.getByLabelText(
          "Filter by Category: Cell Phone Cases"
        ) as HTMLInputElement
      ).checked
    ).toBe(true)
    fireEvent.click(
      screen.getByLabelText("Filter by Category: Screen Protector")
    )
    fireEvent.click(screen.getByLabelText("Filter by Color: Black"))
    const url = new URL(push.mock.calls[1][0], "https://store.test")
    expect(url.pathname).toBe("/ca/store")
    expect(url.searchParams.getAll("category")).toEqual([
      "cell-phone-cases",
      "screen-protector",
    ])
    expect(url.searchParams.has("page")).toBe(false)
  })
  it.each([
    "Filter by Category: Cell Phone Cases",
    "Remove Category: Cell Phone Cases",
  ])("removes only one of multiple categories using %s", (label) => {
    query += "&category=screen-protector"
    renderFilters()
    expect(
      (
        screen.getByLabelText(
          "Filter by Category: Cell Phone Cases"
        ) as HTMLInputElement
      ).checked
    ).toBe(true)
    expect(
      (
        screen.getByLabelText(
          "Filter by Category: Screen Protector"
        ) as HTMLInputElement
      ).checked
    ).toBe(true)
    fireEvent.click(screen.getByLabelText(label))
    const url = new URL(push.mock.calls[0][0], "https://store.test")
    expect(url.searchParams.getAll("category")).toEqual(["screen-protector"])
    expect(url.searchParams.get("search")).toBe("iphone")
    expect(url.searchParams.getAll("option")).toEqual([
      "opt_brand:optval_apple",
    ])
    expect(url.searchParams.has("page")).toBe(false)
  })

  it("defaults to all categories without an All categories control", () => {
    query = ""
    renderFilters()
    expect(
      screen.queryByLabelText("Filter by Category: All categories")
    ).toBeNull()
    for (const category of categories) {
      expect(
        (
          screen.getByLabelText(
            `Filter by Category: ${category.name}`
          ) as HTMLInputElement
        ).checked
      ).toBe(false)
    }
  })

  it("hides known empty categories but keeps a selected empty category removable", () => {
    query = "category=cell-phone-cases"
    render(
      <RefinementList
        sortBy="created_at"
        categories={categories.map((category) => ({
          ...category,
          products: [],
        }))}
      />
    )
    expect(
      screen.queryByLabelText("Filter by Category: Screen Protector")
    ).toBeNull()
    expect(
      screen.getByLabelText("Remove Category: Cell Phone Cases")
    ).toBeTruthy()
  })
})
