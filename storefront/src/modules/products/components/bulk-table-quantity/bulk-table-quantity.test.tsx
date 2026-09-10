import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import BulkTableQuantity from "."
afterEach(cleanup)
describe("BulkTableQuantity", () => {
  it("keeps tap controls within stock limits", () => {
    const onChange = vi.fn()
    render(
      <BulkTableQuantity
        variantId="variant-1"
        maxQuantity={2}
        onChange={onChange}
      />
    )
    const increase = screen.getByRole("button", { name: "Increase quantity" })
    fireEvent.click(increase)
    fireEvent.click(increase)
    expect(onChange).toHaveBeenLastCalledWith("variant-1", 2)
    expect((increase as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(screen.getByRole("button", { name: "Decrease quantity" }))
    expect(onChange).toHaveBeenLastCalledWith("variant-1", 1)
  })
  it("clamps typed quantities and disables out-of-stock inputs", () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <BulkTableQuantity
        variantId="variant-1"
        maxQuantity={2}
        onChange={onChange}
      />
    )
    fireEvent.change(screen.getByRole("spinbutton"), {
      target: { value: "999" },
    })
    expect(onChange).toHaveBeenLastCalledWith("variant-1", 2)
    rerender(
      <BulkTableQuantity
        variantId="variant-1"
        maxQuantity={0}
        onChange={onChange}
      />
    )
    expect((screen.getByRole("spinbutton") as HTMLInputElement).disabled).toBe(
      true
    )
  })
})
