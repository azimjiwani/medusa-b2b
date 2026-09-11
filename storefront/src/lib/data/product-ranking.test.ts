import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ fetch: vi.fn() }))
vi.mock("@/lib/config", () => ({ sdk: { client: { fetch: mocks.fetch } } }))
import { getFeaturedProductIds } from "./product-ranking"

describe("featured ranking scope", () => {
  beforeEach(() =>
    mocks.fetch.mockResolvedValue({
      config: {
        product_ids: ["prod_overall"],
        categories: [{ category_id: "pcat_cases", product_ids: ["prod_case"] }],
      },
    })
  )

  it("uses overall rankings for all products or multiple categories", async () => {
    expect(await getFeaturedProductIds()).toEqual(["prod_overall"])
    expect(
      await getFeaturedProductIds(["pcat_cases", "pcat_chargers"])
    ).toEqual(["prod_overall"])
  })
  it("uses the selected category ranking, with no overall fallback for an unranked category", async () => {
    expect(await getFeaturedProductIds(["pcat_cases", "pcat_cases"])).toEqual([
      "prod_case",
    ])
    expect(await getFeaturedProductIds(["pcat_chargers"])).toEqual([])
  })
  it("falls back to Latest Arrivals if configuration is unavailable", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    try {
      mocks.fetch.mockRejectedValueOnce(new Error("unavailable"))
      expect(await getFeaturedProductIds()).toEqual([])
    } finally {
      error.mockRestore()
    }
  })
})
