import { cleanup, render, screen } from "@testing-library/react"
import type { ComponentProps } from "react"
import type { HttpTypes } from "@medusajs/types"
import { afterEach, describe, expect, it, vi } from "vitest"
import ProductTile from "."

vi.mock("next/navigation", () => ({ useParams: () => ({ countryCode: "ca" }) }))
vi.mock("next/link", () => ({
  default: (props: ComponentProps<"a">) => <a {...props} />,
}))
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}))
afterEach(cleanup)

const product = {
  id: "product-1",
  title: "Wireless headphones",
  handle: "headphones",
  images: [{ url: "/headphones.png" }],
  variants: [
    {
      calculated_price: {
        calculated_amount: 40,
        original_amount: 40,
        currency_code: "cad",
      },
    },
    {
      calculated_price: {
        calculated_amount: 25,
        original_amount: 35,
        currency_code: "cad",
      },
    },
  ],
} as HttpTypes.StoreProduct

describe("ProductTile", () => {
  it.each([
    [null, "Log in for pricing"],
    [{ isLoggedIn: true, isApproved: false }, "Contact us for pricing"],
  ])(
    "keeps wholesale prices hidden for an unauthorized customer",
    (customer, message) => {
      render(<ProductTile product={product} customer={customer} />)
      expect(screen.getByText(message)).toBeTruthy()
      expect(screen.queryByTestId("price")).toBeNull()
      expect(screen.queryByTestId("original-price")).toBeNull()
    }
  )
  it("shows the cheapest variant and its original sale price to approved customers", () => {
    render(
      <ProductTile
        product={product}
        customer={{ isLoggedIn: true, isApproved: true }}
      />
    )
    expect(screen.getByTestId("price").textContent).toContain("25.00")
    expect(screen.getByTestId("original-price").textContent).toContain("35.00")
    expect(screen.getByRole("link").getAttribute("href")).toBe(
      "/ca/products/headphones"
    )
    expect(screen.getByRole("img").getAttribute("src")).toBe("/headphones.png")
  })
  it("handles a zero price and keeps cart controls outside the product link", () => {
    const free = {
      ...product,
      variants: [
        {
          calculated_price: {
            calculated_amount: 0,
            original_amount: 0,
            currency_code: "cad",
          },
        },
      ],
    } as HttpTypes.StoreProduct
    render(
      <ProductTile
        product={free}
        customer={{ isLoggedIn: true, isApproved: true }}
        footer={<button>Add to cart</button>}
      />
    )
    expect(screen.getByTestId("price").textContent).toContain("0.00")
    expect(screen.getByRole("button").closest("a")).toBeNull()
  })
  it("renders unavailable pricing and missing imagery without breaking the tile", () => {
    render(
      <ProductTile
        product={{ ...product, images: [], variants: [] }}
        customer={{ isLoggedIn: true, isApproved: true }}
      />
    )
    expect(screen.getByText("Contact us for pricing")).toBeTruthy()
    expect(screen.getByTestId("product-title").textContent).toBe(product.title)
    expect(screen.queryByRole("img")).toBeNull()
  })
})
