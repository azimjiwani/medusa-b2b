import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  sdkFetch: vi.fn(),
  getRegion: vi.fn(),
}))

vi.mock("@/lib/config", () => ({
  sdk: { client: { fetch: mocks.sdkFetch } },
}))

vi.mock("@/lib/data/cookies", () => ({
  getAuthHeaders: vi.fn().mockResolvedValue({ authorization: "Bearer test" }),
  getCacheOptions: vi.fn().mockResolvedValue({ tags: ["products"] }),
}))

vi.mock("@/lib/data/regions", () => ({
  getRegion: mocks.getRegion,
}))

vi.mock("@/lib/util/sort-products", () => ({
  sortProducts: (products: unknown[]) => products,
}))

import {
  listBngProductOptions,
  listFilteredProducts,
  searchProductIds,
} from "./products"

describe("Medusa product option contracts", () => {
  beforeEach(() => {
    mocks.sdkFetch.mockReset()
    mocks.getRegion.mockReset()
    mocks.getRegion.mockResolvedValue({ id: "reg_us" })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("retrieves only populated BNG-owned options and preserves canonical order", async () => {
    mocks.sdkFetch.mockResolvedValueOnce({
      count: 4,
      product_options: [
        {
          id: "opt_color",
          title: "Color",
          metadata: { bng_managed: true, bng_field: "color" },
          values: [],
        },
        {
          id: "opt_condition",
          title: "Condition",
          metadata: {},
          values: [{ id: "optval_new", value: "New" }],
        },
        {
          id: "opt_brand",
          title: " Brand ",
          metadata: { bng_managed: true, bng_field: "brand" },
          values: [
            { id: "optval_samsung", value: "Samsung" },
            { id: "optval_apple", value: "Apple" },
          ],
        },
        {
          id: "opt_device",
          title: "Device",
          metadata: { bng_managed: true, bng_field: "device" },
          values: [{ id: "optval_phone", value: "Phone" }],
        },
      ],
    })

    await expect(listBngProductOptions()).resolves.toEqual([
      {
        id: "opt_brand",
        title: "Brand",
        values: [
          { id: "optval_apple", value: "Apple" },
          { id: "optval_samsung", value: "Samsung" },
        ],
      },
      {
        id: "opt_device",
        title: "Device",
        values: [{ id: "optval_phone", value: "Phone" }],
      },
    ])
    expect(mocks.sdkFetch).toHaveBeenCalledWith(
      "/store/product-options",
      expect.objectContaining({
        method: "GET",
        query: { limit: 100, offset: 0 },
      })
    )
  })

  it("passes grouped value IDs to Medusa and paginates its authoritative count", async () => {
    mocks.sdkFetch
      .mockResolvedValueOnce({ products: [], count: 2 })
      .mockResolvedValueOnce({
        count: 2,
        products: [
          {
            id: "prod_apple_black",
            variants: [
              {
                options: [
                  { id: "optval_apple", option_id: "opt_brand" },
                  { id: "optval_black", option_id: "opt_color" },
                ],
              },
            ],
          },
          {
            id: "prod_samsung_black",
            variants: [
              {
                options: [
                  { id: "optval_samsung", option_id: "opt_brand" },
                  { id: "optval_black", option_id: "opt_color" },
                ],
              },
            ],
          },
        ],
      })

    const result = await listFilteredProducts({
      page: 1,
      queryParams: { category_id: ["pcat_phones"], limit: 1 },
      optionFilters: {
        opt_brand: ["optval_apple", "optval_samsung"],
        opt_color: ["optval_black"],
      },
      options: [
        {
          id: "opt_brand",
          title: "Brand",
          values: [
            { id: "optval_apple", value: "Apple" },
            { id: "optval_samsung", value: "Samsung" },
          ],
        },
        {
          id: "opt_color",
          title: "Color",
          values: [{ id: "optval_black", value: "Black" }],
        },
      ],
      countryCode: "us",
    })

    expect(result).toEqual({
      products: [expect.objectContaining({ id: "prod_apple_black" })],
      count: 2,
    })
    expect(mocks.sdkFetch).toHaveBeenLastCalledWith(
      "/store/products",
      expect.objectContaining({
        query: expect.objectContaining({
          category_id: ["pcat_phones"],
          limit: 2,
          offset: 0,
          option_value_id: ["optval_apple", "optval_samsung", "optval_black"],
          region_id: "reg_us",
        }),
      })
    )
  })

  it("returns an empty filtered result while leaving the caller's selection intact", async () => {
    mocks.sdkFetch.mockResolvedValueOnce({ products: [], count: 0 })
    const optionFilters = { opt_brand: ["optval_apple"] }

    await expect(
      listFilteredProducts({
        queryParams: { limit: 48 },
        optionFilters,
        options: [
          {
            id: "opt_brand",
            title: "Brand",
            values: [{ id: "optval_apple", value: "Apple" }],
          },
        ],
        countryCode: "us",
      })
    ).resolves.toEqual({ products: [], count: 0 })
    expect(optionFilters).toEqual({ opt_brand: ["optval_apple"] })
    expect(mocks.sdkFetch).toHaveBeenCalledTimes(1)
  })

  it("ignores unavailable bookmarked value IDs instead of hiding the catalog", async () => {
    mocks.sdkFetch
      .mockResolvedValueOnce({ products: [], count: 1 })
      .mockResolvedValueOnce({
        count: 1,
        products: [{ id: "prod_visible", variants: [] }],
      })

    await expect(
      listFilteredProducts({
        queryParams: { limit: 48 },
        optionFilters: { opt_retired: ["optval_gone"] },
        options: [],
        countryCode: "us",
      })
    ).resolves.toEqual({
      products: [expect.objectContaining({ id: "prod_visible" })],
      count: 1,
    })
    expect(
      mocks.sdkFetch.mock.calls[0][1].query.option_value_id
    ).toBeUndefined()
  })

  it("treats a failed search response as no candidates", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false })
    vi.stubGlobal("fetch", fetchMock)

    await expect(searchProductIds("phone")).resolves.toEqual([])
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/store/products/search?q=phone&limit=1000"),
      expect.objectContaining({ cache: "no-store" })
    )
  })
})
