import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import type { ComponentProps, ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import Hero from "."
import { banners } from "@/modules/home/data/banners"

const carousel = vi.hoisted(() => ({
  scrollPrev: vi.fn(),
  scrollNext: vi.fn(),
  scrollTo: vi.fn(),
  selectedScrollSnap: vi.fn(() => 0),
  on: vi.fn(),
  off: vi.fn(),
}))
vi.mock("embla-carousel-react", () => ({ default: () => [vi.fn(), carousel] }))
vi.mock("next/navigation", () => ({ useParams: () => ({ countryCode: "ca" }) }))
vi.mock("next/link", () => ({
  default: ({
    children,
    ...props
  }: ComponentProps<"a"> & { children: ReactNode }) => (
    <a {...props}>{children}</a>
  ),
}))
vi.mock("@medusajs/icons", () => ({
  ChevronLeft: () => <span />,
  ChevronRight: () => <span />,
}))
beforeEach(() => {
  vi.clearAllMocks()
  carousel.selectedScrollSnap.mockReturnValue(0)
})
afterEach(cleanup)

describe("Hero", () => {
  it("renders published banner copy and uploaded images with localized destinations", () => {
    render(
      <Hero
        banners={[
          {
            ...banners[0],
            headline: "New campaign",
            action: "Explore deals",
            link: "/store?category=accessories",
            image_url: "https://merchant.example/banner.webp",
            image_alt: "Featured accessories",
          },
        ]}
      />
    )
    expect(screen.getByRole("heading", { name: "New campaign" })).toBeTruthy()
    expect(
      screen
        .getByRole("img", { name: "Featured accessories" })
        .getAttribute("src")
    ).toBe("https://merchant.example/banner.webp")
    expect(
      screen.getByRole("link", { name: /Explore deals/ }).getAttribute("href")
    ).toBe("/ca/store?category=accessories")
    expect(screen.queryByRole("button", { name: "Next banner" })).toBeNull()
  })
  it("preserves banner order while excluding hidden banners", () => {
    render(
      <Hero
        banners={[{ ...banners[0], enabled: false }, banners[2], banners[1]]}
      />
    )
    expect(screen.getByRole("link", { name: /Shop accessories/ })).toBeTruthy()
    expect(
      screen.queryByRole("link", { name: /Discover the collection/ })
    ).toBeNull()
    expect(
      screen.getAllByRole("button", { name: /Go to banner/ })
    ).toHaveLength(2)
  })
  it("does not restore defaults after every banner is removed or hidden", () => {
    const { container, rerender } = render(<Hero banners={[]} />)
    expect(container.innerHTML).toBe("")
    rerender(
      <Hero
        banners={banners.map((banner) => ({ ...banner, enabled: false }))}
      />
    )
    expect(container.innerHTML).toBe("")
  })

  it("routes the visible collection to the current country and excludes hidden slide links from tab order", () => {
    const { container } = render(<Hero />)
    expect(
      screen
        .getByRole("link", { name: /Discover the collection/ })
        .getAttribute("href")
    ).toBe("/ca/store")
    expect(screen.queryByRole("link", { name: /Explore phones/ })).toBeNull()
    expect(
      container
        .querySelector('a[href="/ca/store?category=cell-phones"]')
        ?.getAttribute("tabindex")
    ).toBe("-1")
  })
  it("supports arrows and direct slide selection", () => {
    render(<Hero />)
    fireEvent.click(screen.getByRole("button", { name: "Next banner" }))
    fireEvent.click(screen.getByRole("button", { name: "Previous banner" }))
    fireEvent.click(screen.getByRole("button", { name: "Go to banner 3" }))
    expect(carousel.scrollNext).toHaveBeenCalledTimes(1)
    expect(carousel.scrollPrev).toHaveBeenCalledTimes(1)
    expect(carousel.scrollTo).toHaveBeenCalledWith(2)
  })
  it("updates the accessible slide and indicator after navigation and cleans up listeners", () => {
    const { unmount } = render(<Hero />)
    const onSelect = carousel.on.mock.calls.find(
      ([event]) => event === "select"
    )![1]
    carousel.selectedScrollSnap.mockReturnValue(1)
    act(() => onSelect())
    expect(
      screen.getByRole("link", { name: /Explore phones/ }).getAttribute("href")
    ).toBe("/ca/store?category=cell-phones")
    expect(
      screen
        .getByRole("button", { name: "Go to banner 2" })
        .getAttribute("aria-current")
    ).toBe("true")
    expect(
      screen.queryByRole("link", { name: /Discover the collection/ })
    ).toBeNull()
    unmount()
    expect(carousel.off).toHaveBeenCalledWith("select", onSelect)
    expect(carousel.off).toHaveBeenCalledWith("reInit", onSelect)
  })
})
