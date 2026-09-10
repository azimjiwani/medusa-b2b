import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { ComponentProps } from "react"
import type { HttpTypes } from "@medusajs/types"
import type { B2BCustomer } from "@/types"
import ProductActions from "."

const emitCartAdd = vi.hoisted(() => vi.fn())
vi.mock("@/lib/data/cart-event-bus", () => ({
  addToCartEventBus: { emitCartAdd },
}))
vi.mock("next/navigation", () => ({ useParams: () => ({ countryCode: "ca" }) }))
vi.mock("next/link", () => ({
  default: (props: ComponentProps<"a">) => <a {...props} />,
}))
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})
const product = {
  id: "product-1",
  title: "Phone case",
  handle: "phone-case",
  variants: [
    {
      id: "variant-1",
      sku: "case-blue",
      inventory_quantity: 3,
      options: [{ id: "blue", value: "Blue" }],
      calculated_price: {
        calculated_amount: 25,
        original_amount: 35,
        currency_code: "cad",
      },
    },
  ],
} as HttpTypes.StoreProduct
const region = { id: "region-ca" } as HttpTypes.StoreRegion
const approved = { metadata: { approved: true } } as unknown as B2BCustomer

describe("ProductActions", () => {
  it("gives guests one account panel without exposing prices or ordering controls", () => {
    render(<ProductActions product={product} region={region} customer={null} />)
    expect(
      screen.getByRole("link", { name: "Log in" }).getAttribute("href")
    ).toBe("/ca/account")
    expect(
      screen
        .getByRole("link", { name: /Create an account/ })
        .getAttribute("href")
    ).toBe("/ca/account?view=register")
    expect(screen.queryByTestId("product-price")).toBeNull()
    expect(screen.queryByRole("spinbutton")).toBeNull()
  })
  it("directs pending customers to the team without exposing wholesale details", () => {
    render(
      <ProductActions
        product={product}
        region={region}
        customer={{ metadata: { approved: false } } as unknown as B2BCustomer}
      />
    )
    expect(
      screen
        .getByRole("link", { name: /Contact our team/ })
        .getAttribute("href")
    ).toBe("mailto:info@bntbng.com")
    expect(screen.queryByTestId("product-price")).toBeNull()
    expect(screen.queryByTestId("add-product-button")).toBeNull()
  })
  it("preserves approved-customer sale prices and adds the selected variant quantity", () => {
    render(
      <ProductActions product={product} region={region} customer={approved} />
    )
    expect(screen.getByTestId("product-price").textContent).toContain("25.00")
    expect(screen.getByTestId("original-product-price").textContent).toContain(
      "35.00"
    )
    expect(
      (screen.getByTestId("add-product-button") as HTMLButtonElement).disabled
    ).toBe(true)
    fireEvent.click(screen.getByRole("button", { name: "Increase quantity" }))
    fireEvent.click(screen.getByRole("button", { name: "Increase quantity" }))
    fireEvent.click(screen.getByTestId("add-product-button"))
    expect(emitCartAdd).toHaveBeenCalledWith({
      regionId: region.id,
      lineItems: [
        expect.objectContaining({
          quantity: 2,
          productVariant: expect.objectContaining({ id: "variant-1" }),
        }),
      ],
    })
  })
  it("shows a zero price and a clear fallback when pricing is unavailable", () => {
    const { rerender } = render(
      <ProductActions
        product={
          {
            ...product,
            variants: [
              {
                ...product.variants![0],
                calculated_price: {
                  calculated_amount: 0,
                  original_amount: 0,
                  currency_code: "cad",
                },
              },
            ],
          } as HttpTypes.StoreProduct
        }
        region={region}
        customer={approved}
      />
    )
    expect(screen.getByTestId("product-price").textContent).toContain("0.00")
    rerender(
      <ProductActions
        product={{ ...product, variants: [] }}
        region={region}
        customer={approved}
      />
    )
    expect(screen.getByText("Contact us for pricing.")).toBeTruthy()
  })
})
