import {
  buildInventoryPriceUpdate,
  getInventorySyncReferences,
  toInventoryProductHandle,
} from "../workflows/inventory/inventory-sync-helpers"

describe("inventory sync helpers", () => {
  it("creates a Medusa-safe product handle from an external SKU", () => {
    expect(toInventoryProductHandle(" FIXTURE-NEW-001 ")).toBe("fixture-new-001")
  })

  it("uses environment-specific Medusa references when provided", () => {
    expect(
      getInventorySyncReferences({
        INVENTORY_SYNC_SALES_CHANNEL_ID: "sc_test",
        INVENTORY_SYNC_SHIPPING_PROFILE_ID: "sp_test",
        INVENTORY_SYNC_WHOLESALE_1_GROUP_ID: "cg_1",
        INVENTORY_SYNC_WHOLESALE_2_GROUP_ID: "cg_2",
        INVENTORY_SYNC_WHOLESALE_3_GROUP_ID: "cg_3",
      })
    ).toEqual({
      salesChannelId: "sc_test",
      shippingProfileId: "sp_test",
      customerGroups: {
        wholesale1: "cg_1",
        wholesale2: "cg_2",
        wholesale3: "cg_3",
      },
    })
  })

  it("updates an existing default price by id without an empty rules object", () => {
    expect(buildInventoryPriceUpdate({ id: "price_test" }, 102)).toEqual({
      id: "price_test",
      currency_code: "cad",
      amount: 102,
    })
  })

  it("includes the customer group rule for a wholesale price", () => {
    expect(
      buildInventoryPriceUpdate({ id: "price_wholesale" }, 92, "cg_1")
    ).toEqual({
      id: "price_wholesale",
      currency_code: "cad",
      amount: 92,
      rules: { "customer.groups.id": "cg_1" },
    })
  })
})
