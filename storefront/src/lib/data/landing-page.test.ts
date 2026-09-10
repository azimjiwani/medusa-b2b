import { beforeEach, describe, expect, it, vi } from "vitest"
import type { LandingSection } from "@/types/landing-page"

const mocks = vi.hoisted(() => ({ listProducts: vi.fn(), fetch: vi.fn() }))
vi.mock("./products", () => ({ listProducts: mocks.listProducts }))
vi.mock("@/lib/config", () => ({ sdk: { client: { fetch: mocks.fetch } } }))
import { getLandingPage, getLandingProducts } from "./landing-page"

const section: LandingSection = {
  id: "latest",
  type: "products",
  title: "Latest",
  subtitle: "",
  eyebrow: "",
  enabled: true,
  link_label: "",
  link_href: "",
  source: "latest",
  collection_id: "",
  product_ids: [],
  product_limit: 8,
  cards: [],
}

describe("landing page data", () => {
  beforeEach(() => {
    mocks.listProducts.mockReset()
    mocks.fetch.mockReset()
  })

  it("uses a small, revalidated public configuration request", async () => {
    mocks.fetch.mockResolvedValue({ config: { sections: [] } })
    await getLandingPage()
    expect(mocks.fetch).toHaveBeenCalledWith(
      "/store/landing-page",
      expect.objectContaining({
        cache: "force-cache",
        next: { revalidate: 30, tags: ["landing-page"] },
      })
    )
  })

  it("fetches only eight latest products with server-side ordering", async () => {
    mocks.listProducts.mockResolvedValue({
      response: { products: [{ id: "p" }] },
    })
    await expect(getLandingProducts(section, "ca")).resolves.toEqual([
      { id: "p" },
    ])
    expect(mocks.listProducts).toHaveBeenCalledTimes(1)
    expect(mocks.listProducts).toHaveBeenCalledWith({
      countryCode: "ca",
      queryParams: { limit: 8, order: "-created_at" },
    })
  })

  it("preserves handpicked order and skips products the store API does not expose", async () => {
    mocks.listProducts.mockResolvedValue({
      response: { products: [{ id: "prod_b" }, { id: "prod_a" }] },
    })
    const result = await getLandingProducts(
      {
        ...section,
        source: "selected",
        product_ids: ["prod_a", "prod_unpublished", "prod_b"],
      },
      "ca"
    )
    expect(result.map((product) => product.id)).toEqual(["prod_a", "prod_b"])
    expect(mocks.listProducts.mock.calls[0][0].queryParams.id).toEqual([
      "prod_a",
      "prod_unpublished",
      "prod_b",
    ])
  })

  it("never turns an empty collection or selection into a full-catalog tray", async () => {
    expect(
      await getLandingProducts({ ...section, source: "collection" }, "ca")
    ).toEqual([])
    expect(
      await getLandingProducts({ ...section, source: "selected" }, "ca")
    ).toEqual([])
    expect(mocks.listProducts).not.toHaveBeenCalled()
  })

  it("applies collection filtering and caps an excessive limit", async () => {
    mocks.listProducts.mockResolvedValue({ response: { products: [] } })
    await getLandingProducts(
      {
        ...section,
        source: "collection",
        collection_id: "pcol_test",
        product_limit: 1000,
      },
      "ca"
    )
    expect(mocks.listProducts.mock.calls[0][0].queryParams).toEqual({
      limit: 12,
      order: "-created_at",
      collection_id: ["pcol_test"],
    })
  })
})
