import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import type { HttpTypes } from "@medusajs/types"
import { afterEach, describe, expect, it, vi } from "vitest"
import ImageGallery from "."
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}))
afterEach(cleanup)
const product = {
  title: "Phone",
  images: [
    { id: "front", url: "/front.jpg" },
    { id: "back", url: "/back.jpg" },
  ],
} as HttpTypes.StoreProduct

describe("ImageGallery", () => {
  it("lets touch and keyboard users select product images with named controls", () => {
    render(<ImageGallery product={product} />)
    fireEvent.click(
      screen.getByRole("button", { name: "View product image 2" })
    )
    expect(screen.getByAltText("Phone").getAttribute("src")).toBe("/back.jpg")
    expect(
      screen
        .getByRole("button", { name: "View product image 2" })
        .getAttribute("aria-pressed")
    ).toBe("true")
    fireEvent.keyDown(window, { key: "ArrowLeft" })
    expect(screen.getByAltText("Phone").getAttribute("src")).toBe("/front.jpg")
  })
  it("shows the thumbnail when no gallery images exist", () => {
    render(
      <ImageGallery
        product={{ ...product, images: [], thumbnail: "/fallback.jpg" }}
      />
    )
    expect(screen.getByAltText("Phone").getAttribute("src")).toBe(
      "/fallback.jpg"
    )
    expect(
      screen.queryByRole("button", { name: "Next product image" })
    ).toBeNull()
  })
})
