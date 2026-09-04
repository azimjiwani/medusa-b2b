import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import RefinementList from "."
import type { StorefrontProductOption } from "@/lib/data/products"

const push = vi.fn()
let query = ""

vi.mock("next/navigation", () => ({
  usePathname: () => "/us/store",
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
