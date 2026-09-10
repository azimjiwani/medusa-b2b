import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import Tray from "./tray"

let resize: () => void
let width: number
let contentWidth: number
let position: number
const scrollBy = vi.fn()

beforeEach(() => {
  width = 1280
  contentWidth = 1280
  position = 0
  scrollBy.mockReset()
  vi.spyOn(Element.prototype, "clientWidth", "get").mockImplementation(
    () => width
  )
  vi.spyOn(Element.prototype, "scrollWidth", "get").mockImplementation(
    () => contentWidth
  )
  vi.spyOn(Element.prototype, "scrollLeft", "get").mockImplementation(
    () => position
  )
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: () => void) {
        resize = callback
      }
      observe() {}
      disconnect() {}
    }
  )
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: false }))
  )
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const renderTray = () =>
  render(
    <Tray label="Categories">
      <li>Phone cases</li>
      <li>Power essentials</li>
      <li>SIM cards</li>
    </Tray>
  )

describe("shared landing tray", () => {
  it("hides unnecessary controls, then shows them when the viewport becomes narrower", () => {
    renderTray()
    expect(screen.queryByRole("button")).toBeNull()
    width = 320
    act(() => resize())
    expect(screen.getByRole("button", { name: "Next Categories" })).toBeTruthy()
    expect(
      (
        screen.getByRole("button", {
          name: "Previous Categories",
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true)
    width = contentWidth
    act(() => resize())
    expect(screen.queryByRole("button")).toBeNull()
  })

  it("advances by a full tray plus its gap and disables navigation at the end", () => {
    width = 320
    contentWidth = 1000
    renderTray()
    const list = screen.getByRole("list", { name: "Categories" })
    list.scrollBy = scrollBy
    fireEvent.click(screen.getByRole("button", { name: "Next Categories" }))
    expect(scrollBy).toHaveBeenCalledWith({ left: 340, behavior: "smooth" })
    position = 680
    fireEvent.scroll(list)
    expect(
      (
        screen.getByRole("button", {
          name: "Next Categories",
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true)
    fireEvent.click(screen.getByRole("button", { name: "Previous Categories" }))
    expect(scrollBy).toHaveBeenLastCalledWith({
      left: -340,
      behavior: "smooth",
    })
  })

  it("respects reduced-motion preferences", () => {
    width = 320
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: true }))
    )
    renderTray()
    screen.getByRole("list", { name: "Categories" }).scrollBy = scrollBy
    fireEvent.click(screen.getByRole("button", { name: "Next Categories" }))
    expect(scrollBy).toHaveBeenCalledWith({ left: 340, behavior: "instant" })
  })
})
