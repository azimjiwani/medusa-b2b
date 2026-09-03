import { getBngInventoryUrl } from "../workflows/inventory/steps/bng-inventory-url"

describe("getBngInventoryUrl", () => {
  it("refuses the live feed during local development", () => {
    expect(() => getBngInventoryUrl({ NODE_ENV: "development" })).toThrow(
      "Refusing to run inventory sync"
    )
  })

  it("accepts a local fixture URL", () => {
    expect(
      getBngInventoryUrl({
        NODE_ENV: "test",
        BNG_INVENTORY_URL: "http://127.0.0.1:43123/inventory",
      })
    ).toBe("http://127.0.0.1:43123/inventory")
  })

  it("retains the production feed by default in production", () => {
    expect(getBngInventoryUrl({ NODE_ENV: "production" })).toBe(
      "http://services.batteriesnthings.net/api/v1/inventory"
    )
  })
})
