import { beforeEach, describe, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({ fetch: vi.fn(), ranking: vi.fn() }))
vi.mock("@/lib/config", () => ({ sdk: { client: { fetch: mocks.fetch } } }))
vi.mock("@/lib/data/cookies", () => ({
  getAuthHeaders: async () => ({ authorization: "Bearer customer" }),
  getCacheOptions: async () => ({ tags: ["products"] }),
}))
vi.mock("@/lib/data/regions", () => ({
  getRegion: async () => ({ id: "reg_ca" }),
}))
vi.mock("./product-ranking", () => ({ getFeaturedProductIds: mocks.ranking }))
import { listProductsWithSort } from "./products"

const products = Array.from({ length: 130 }, (_, i) => ({
  id: `prod_${String(i).padStart(3, "0")}`,
  created_at: new Date(Date.UTC(2026, 0, 1 + i)).toISOString(),
}))
const featured = products
  .slice(0, 15)
  .reverse()
  .map((product) => product.id)

describe("featured pagination", () => {
  beforeEach(() => {
    mocks.fetch.mockReset()
    mocks.ranking
      .mockReset()
      .mockResolvedValue([...featured, "prod_unpublished"])
    mocks.fetch.mockImplementation(async (_path, { query }) => {
      let matches = query.id
        ? products.filter((product) => query.id.includes(product.id))
        : [...products]
      if (query.order === "-created_at") matches.reverse()
      return {
        count: matches.length,
        products: matches.slice(query.offset, query.offset + query.limit),
      }
    })
  })

  it("puts 15 ranked products first, then latest arrivals across page boundaries without duplicates", async () => {
    const pages = []
    for (const page of [1, 2, 3]) {
      const result = await listProductsWithSort({
        page,
        countryCode: "ca",
        sortBy: "featured",
        queryParams: { limit: 48 },
      })
      expect(result.response.count).toBe(130)
      expect(result.nextPage).toBe(page < 3 ? page + 1 : null)
      pages.push(...result.response.products.map((product) => product.id))
    }
    expect(pages).toEqual([
      ...featured,
      ...products
        .slice(15)
        .reverse()
        .map((product) => product.id),
    ])
    expect(new Set(pages).size).toBe(130)
    const scans = mocks.fetch.mock.calls.filter(
      ([, { query }]) => query.fields === "id,created_at"
    )
    expect(scans.some(([, { query }]) => query.offset === 100)).toBe(true)
    expect(scans.every(([, { query }]) => query.limit === 100)).toBe(true)
  })

  it("preserves category, search IDs, option filters, and customer context in the index and page fetch", async () => {
    const id = ["prod_010", "prod_015", "prod_090"]
    const queryParams = {
      category_id: ["pcat_cases"],
      id,
      option_value_id: ["optval_iphone"],
      limit: 2,
    }
    const result = await listProductsWithSort({
      page: 1,
      countryCode: "ca",
      sortBy: "featured",
      queryParams,
    })
    expect(mocks.ranking).toHaveBeenCalledWith(["pcat_cases"])
    expect(result.response.products.map((product) => product.id)).toEqual([
      "prod_010",
      "prod_090",
    ])
    expect(result.response.count).toBe(3)
    for (const [, request] of mocks.fetch.mock.calls) {
      expect(request.headers.authorization).toBe("Bearer customer")
      expect(request.query).toMatchObject({
        category_id: ["pcat_cases"],
        option_value_id: ["optval_iphone"],
        region_id: "reg_ca",
      })
      expect(
        request.query.id.every((value: string) => id.includes(value))
      ).toBe(true)
    }
  })

  it("uses native latest-arrival pagination when no ranking is configured", async () => {
    mocks.ranking.mockResolvedValue([])
    const result = await listProductsWithSort({
      page: 2,
      countryCode: "ca",
      sortBy: "featured",
      queryParams: { limit: 48 },
    })
    expect(mocks.fetch).toHaveBeenCalledTimes(1)
    expect(mocks.fetch.mock.calls[0][1].query).toMatchObject({
      order: "-created_at",
      limit: 48,
      offset: 48,
    })
    expect(result.response.products.map((product) => product.id)).toEqual(
      products
        .slice()
        .reverse()
        .slice(48, 96)
        .map((product) => product.id)
    )
  })
})
