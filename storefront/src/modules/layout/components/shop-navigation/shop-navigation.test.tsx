import { act, fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { ReactNode } from "react"

vi.stubGlobal(
  "PointerEvent",
  class extends MouseEvent {
    pointerType: string
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init)
      this.pointerType = init.pointerType ?? "mouse"
    }
  }
)

vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
)

vi.mock("@/lib/data/categories", () => ({
  listCategories: async () => [
    {
      id: "cases",
      name: "Cell Phone Cases",
      handle: "cell-phone-cases",
      products: [{ id: "product" }],
    },
    {
      id: "phones",
      name: "Phones & Communications",
      handle: "phones-&-communications",
      products: [{ id: "product" }],
    },
    { id: "empty", name: "Empty Category", handle: "empty", products: [] },
  ],
}))
vi.mock("@/lib/data/products", () => ({
  listBngProductOptions: async () => [
    {
      id: "opt_brand",
      title: "Brand",
      values: [{ id: "apple", value: "Apple" }],
    },
    {
      id: "opt_device",
      title: "Device",
      values: [
        { id: "iphone18", value: "iPhone 18 Pro" },
        { id: "iphonexs", value: "Iphone Xs/11 Pro" },
        { id: "pixel11", value: "Pixel 11/11 Pro" },
        { id: "s24", value: "S 24 Ultra" },
        { id: "a06", value: "A 06/A06s" },
        { id: "fold8", value: "Z Fold 8" },
        { id: "other", value: "Universal" },
      ],
    },
    {
      id: "opt_color",
      title: "Color",
      values: [{ id: "black", value: "Black" }],
    },
  ],
}))
vi.mock("@/modules/common/components/localized-client-link", () => ({
  default: ({
    href,
    children,
    onClick,
  }: {
    href: string
    children: ReactNode
    onClick: () => void
  }) => (
    <a
      href={`/ca${href}`}
      onClick={(event) => {
        event.preventDefault()
        onClick()
      }}
    >
      {children}
    </a>
  ),
}))

import ShopNavigation from "."
import DeviceMenu from "./device-menu"

describe("shop navigation", () => {
  it.each([
    [
      "Apple",
      [
        "iPhone 9",
        "iPhone 13/14",
        "Iphone Xs/11 Pro",
        "iPhone 18 Pro",
        "iPhone 17 Pro",
        "iPhone 18 Pro Max",
      ],
      [
        "iPhone 18 Pro Max",
        "iPhone 18 Pro",
        "iPhone 17 Pro",
        "iPhone 13/14",
        "Iphone Xs/11 Pro",
        "iPhone 9",
      ],
    ],
    [
      "Google",
      ["Pixel 9", "Pixel 11/11 Pro", "Pixel 10", "Pixel 11 Pro XL"],
      ["Pixel 11/11 Pro", "Pixel 11 Pro XL", "Pixel 10", "Pixel 9"],
    ],
    [
      "Samsung",
      ["S 9", "S 24 Ultra", "S 26 FE", "S 24/S25"],
      ["S 26 FE", "S 24/S25", "S 24 Ultra", "S 9"],
    ],
  ])(
    "lists %s devices by newest generation first",
    (brand, labels, expected) => {
      render(
        <DeviceMenu
          items={labels.map((label) => ({ id: label, label, href: "/store" }))}
          onSelect={vi.fn()}
        />
      )
      fireEvent.pointerEnter(screen.getByRole("button", { name: brand }))
      expect(
        screen.getAllByRole("link").map((link) => link.textContent)
      ).toEqual(expected)
    }
  )

  it("shows three menus with nonempty categories matching the sidebar", async () => {
    render(await ShopNavigation())
    expect(screen.getAllByRole("button")).toHaveLength(3)
    fireEvent.click(screen.getByRole("button", { name: "Shop by Category" }))
    expect(
      screen
        .getByRole("link", { name: "Cell Phone Cases" })
        .getAttribute("href")
    ).toBe("/ca/store?category=cell-phone-cases")
    const href = screen
      .getByRole("link", { name: "Phones & Communications" })
      .getAttribute("href")!
    expect(
      new URL(href, "http://store.test").searchParams.get("category")
    ).toBe("phones-&-communications")
    expect(screen.queryByText("Empty Category")).toBeNull()
    expect(screen.queryByText("All categories")).toBeNull()
  })
  it.each([
    ["Brand", "Apple", "opt_brand:apple"],
    ["Device", "iPhone 18 Pro", "opt_device:iphone18"],
  ])(
    "links %s choices to sidebar IDs and closes on selection",
    async (group, label, option) => {
      render(await ShopNavigation())
      const button = screen.getByRole("button", { name: `Shop by ${group}` })
      fireEvent.click(button)
      if (group === "Device") {
        fireEvent.pointerEnter(screen.getByRole("button", { name: "Apple" }), {
          pointerType: "mouse",
        })
      }
      const link = screen.getByRole("link", { name: label })
      const url = new URL(link.getAttribute("href")!, "http://store.test")
      expect(url.pathname).toBe("/ca/store")
      expect(url.searchParams.getAll("option")).toEqual([option])
      fireEvent.click(link)
      expect(button.getAttribute("aria-expanded")).toBe("false")
    }
  )
  it("reveals only the hovered device brand and retains model-only Samsung names", async () => {
    render(await ShopNavigation())
    fireEvent.pointerEnter(
      screen.getByRole("button", { name: "Shop by Device" })
    )
    expect(screen.queryAllByRole("link")).toHaveLength(0)
    for (const brand of ["Apple", "Google", "Samsung"]) {
      expect(screen.getByRole("button", { name: brand })).toBeTruthy()
    }
    fireEvent.pointerEnter(screen.getByRole("button", { name: "Apple" }))
    expect(screen.getByRole("link", { name: "iPhone 18 Pro" })).toBeTruthy()
    expect(screen.getByRole("link", { name: "Iphone Xs/11 Pro" })).toBeTruthy()
    fireEvent.pointerEnter(screen.getByRole("button", { name: "Google" }))
    expect(screen.queryByRole("link", { name: "iPhone 18 Pro" })).toBeNull()
    expect(screen.getByRole("link", { name: "Pixel 11/11 Pro" })).toBeTruthy()
    fireEvent.pointerEnter(screen.getByRole("button", { name: "Samsung" }))
    expect(screen.queryByRole("link", { name: "Pixel 11/11 Pro" })).toBeNull()
    for (const label of ["S 24 Ultra", "A 06/A06s", "Z Fold 8"]) {
      expect(screen.getByRole("link", { name: label })).toBeTruthy()
    }
    fireEvent.pointerEnter(screen.getByRole("link", { name: "Z Fold 8" }))
    expect(screen.getByRole("region", { name: "Samsung" })).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Other devices" }))
    expect(screen.getByRole("link", { name: "Universal" })).toBeTruthy()
  })

  it("supports device groups by touch and keyboard, closes nested menus with Escape, and resets on reopening", async () => {
    render(await ShopNavigation())
    const device = screen.getByRole("button", { name: "Shop by Device" })
    fireEvent.click(device)
    const apple = screen.getByRole("button", { name: "Apple" })
    fireEvent.pointerEnter(apple, { pointerType: "touch" })
    expect(screen.queryAllByRole("link")).toHaveLength(0)
    fireEvent.click(apple)
    expect(screen.getByRole("link", { name: "iPhone 18 Pro" })).toBeTruthy()
    act(() => screen.getByRole("button", { name: "Google" }).focus())
    const pixel = screen.getByRole("link", { name: "Pixel 11/11 Pro" })
    act(() => pixel.focus())
    fireEvent.keyDown(pixel, { key: "Escape" })
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Google" })
    )
    expect(screen.queryAllByRole("link")).toHaveLength(0)
    expect(device.getAttribute("aria-expanded")).toBe("true")
    fireEvent.keyDown(document.activeElement!, { key: "Escape" })
    expect(device.getAttribute("aria-expanded")).toBe("false")
    fireEvent.click(device)
    expect(screen.queryAllByRole("link")).toHaveLength(0)
  })

  it("lets mobile users tap through devices, go back, and close with focus restored", async () => {
    const originalMatchMedia = window.matchMedia
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
    try {
      render(await ShopNavigation())
      const device = screen.getByRole("button", { name: "Shop by Device" })
      fireEvent.pointerEnter(device, { pointerType: "mouse" })
      expect(device.getAttribute("aria-expanded")).toBe("false")
      fireEvent.pointerDown(device, { pointerType: "touch" })
      fireEvent.click(device)
      const apple = screen.getByRole("button", { name: "Apple" })
      fireEvent.pointerEnter(apple, { pointerType: "touch" })
      expect(screen.queryAllByRole("link")).toHaveLength(0)
      fireEvent.click(apple)
      const back = screen.getByRole("button", { name: "All device brands" })
      expect(document.activeElement).toBe(back)
      expect(screen.queryByRole("button", { name: "Google" })).toBeNull()
      expect(screen.getByRole("link", { name: "iPhone 18 Pro" })).toBeTruthy()
      fireEvent.click(back)
      expect(document.activeElement).toBe(
        screen.getByRole("button", { name: "Apple" })
      )
      fireEvent.click(screen.getByRole("button", { name: "Google" }))
      expect(screen.getByRole("link", { name: "Pixel 11/11 Pro" })).toBeTruthy()
      fireEvent.keyDown(document.activeElement!, { key: "Escape" })
      expect(document.activeElement).toBe(
        screen.getByRole("button", { name: "Google" })
      )
      fireEvent.click(screen.getByRole("button", { name: "Close shop menu" }))
      expect(device.getAttribute("aria-expanded")).toBe("false")
      expect(document.activeElement).toBe(device)
      fireEvent.click(device)
      fireEvent.click(screen.getByRole("button", { name: "Apple" }))
      fireEvent.click(screen.getByRole("link", { name: "iPhone 18 Pro" }))
      expect(device.getAttribute("aria-expanded")).toBe("false")
    } finally {
      window.matchMedia = originalMatchMedia
    }
  })

  it("keeps a desktop menu open when its hovered trigger is clicked", async () => {
    render(await ShopNavigation())
    const device = screen.getByRole("button", { name: "Shop by Device" })
    fireEvent.pointerEnter(device, { pointerType: "mouse" })
    fireEvent.pointerDown(device, { pointerType: "mouse" })
    fireEvent.click(device)
    expect(device.getAttribute("aria-expanded")).toBe("true")
  })

  it("opens one dropdown at a time and supports Escape", async () => {
    render(await ShopNavigation())
    const category = screen.getByRole("button", { name: "Shop by Category" })
    const brand = screen.getByRole("button", { name: "Shop by Brand" })
    fireEvent.click(category)
    fireEvent.click(brand)
    expect(category.getAttribute("aria-expanded")).toBe("false")
    expect(brand.getAttribute("aria-expanded")).toBe("true")
    brand.focus()
    fireEvent.keyDown(brand, { key: "Escape" })
    expect(brand.getAttribute("aria-expanded")).toBe("false")
  })
  it("opens on mouse hover without moving focus, switches menus, and allows crossing into the panel", async () => {
    render(await ShopNavigation())
    vi.useFakeTimers()
    try {
      const category = screen.getByRole("button", { name: "Shop by Category" })
      const brand = screen.getByRole("button", { name: "Shop by Brand" })
      const nav = screen.getByRole("navigation", { name: "Shop navigation" })
      const focus = document.activeElement
      fireEvent.pointerEnter(category, { pointerType: "mouse" })
      expect(category.getAttribute("aria-expanded")).toBe("true")
      expect(document.activeElement).toBe(focus)
      fireEvent.pointerLeave(nav, { pointerType: "mouse" })
      act(() => vi.advanceTimersByTime(100))
      fireEvent.pointerEnter(
        screen.getByRole("link", { name: "Cell Phone Cases" }),
        { pointerType: "mouse" }
      )
      act(() => vi.advanceTimersByTime(200))
      expect(category.getAttribute("aria-expanded")).toBe("true")
      fireEvent.pointerEnter(brand, { pointerType: "mouse" })
      expect(category.getAttribute("aria-expanded")).toBe("false")
      expect(brand.getAttribute("aria-expanded")).toBe("true")
      fireEvent.pointerLeave(nav, { pointerType: "mouse" })
      act(() => vi.advanceTimersByTime(200))
      expect(brand.getAttribute("aria-expanded")).toBe("false")
    } finally {
      vi.useRealTimers()
    }
  })

  it("ignores touch hover so tapping still opens the dropdown, and closes on outside clicks", async () => {
    render(await ShopNavigation())
    const button = screen.getByRole("button", { name: "Shop by Device" })
    fireEvent.pointerEnter(button, { pointerType: "touch" })
    expect(button.getAttribute("aria-expanded")).toBe("false")
    fireEvent.click(button)
    expect(button.getAttribute("aria-expanded")).toBe("true")
    fireEvent.pointerDown(document.body)
    expect(button.getAttribute("aria-expanded")).toBe("false")
  })
})
