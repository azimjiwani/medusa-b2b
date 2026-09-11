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

import {
  listBngProductOptions,
  listFilteredProducts,
  listProductsWithSort,
  searchCatalogProducts,
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
    mocks.sdkFetch.mockResolvedValueOnce({
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
      ],
    })

    const result = await listFilteredProducts({
      page: 1,
      queryParams: { category_id: ["pcat_phones", "pcat_screens"], limit: 1 },
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
          category_id: ["pcat_phones", "pcat_screens"],
          limit: 1,
          order: "-created_at",
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
    mocks.sdkFetch.mockResolvedValueOnce({
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

  it.each(["featured", "price_asc", "title_asc", "title_desc"] as const)(
    "sends %s search state without serializing Algolia product IDs into the URL",
    async (sortBy) => {
      mocks.sdkFetch.mockResolvedValueOnce({
        products: [{ id: "prod_phone" }],
        count: 368,
      })

      await expect(
        searchCatalogProducts({
          searchQuery: "Iphone",
          page: 2,
          limit: 48,
          categoryIds: ["pcat_phones", "pcat_cases"],
          optionFilters: { opt_brand: ["optval_apple"] },
          options: [
            {
              id: "opt_brand",
              title: "Brand",
              values: [{ id: "optval_apple", value: "Apple" }],
            },
          ],
          sortBy,
          countryCode: "us",
        })
      ).resolves.toEqual({
        products: [{ id: "prod_phone" }],
        count: 368,
      })
      expect(mocks.sdkFetch).toHaveBeenCalledWith(
        "/store/catalog-search",
        expect.objectContaining({
          cache: "no-store",
          query: {
            q: "Iphone",
            limit: 48,
            offset: 48,
            region_id: "reg_us",
            fields: "*variants.calculated_price,*variants.inventory_quantity",
            sortBy,
            category_id: ["pcat_phones", "pcat_cases"],
            option_value_id: ["optval_apple"],
          },
        })
      )
    }
  )

  it("fetches only the requested newest-first page, with no count preflight", async () => {
    const products = [{ id: "prod_page_two" }]
    mocks.sdkFetch.mockResolvedValueOnce({ products, count: 2500 })

    const result = await listProductsWithSort({
      page: 2,
      queryParams: { limit: 48, order: "created_at" },
      countryCode: "ca",
    })

    expect(result.response).toEqual({ products, count: 2500 })
    expect(result.nextPage).toBe(3)
    expect(mocks.sdkFetch).toHaveBeenCalledTimes(1)
    expect(mocks.sdkFetch).toHaveBeenCalledWith(
      "/store/products",
      expect.objectContaining({
        query: expect.objectContaining({
          limit: 48,
          offset: 48,
          order: "-created_at",
        }),
        cache: "force-cache",
        next: { tags: ["products"], revalidate: 60 },
      })
    )
  })

  it.each([
    ["title_asc", "title"],
    ["title_desc", "-title"],
  ] as const)(
    "paginates %s on the server while preserving search IDs and filters",
    async (sortBy, order) => {
      mocks.sdkFetch.mockResolvedValueOnce({
        products: [{ id: "prod_search_result" }],
        count: 110,
      })
      const result = await listProductsWithSort({
        page: 2,
        sortBy,
        countryCode: "ca",
        queryParams: {
          limit: 48,
          id: ["prod_search_result", "prod_other"],
          option_value_id: ["optval_apple"],
        },
      })
      expect(mocks.sdkFetch).toHaveBeenCalledTimes(1)
      expect(mocks.sdkFetch).toHaveBeenCalledWith(
        "/store/products",
        expect.objectContaining({
          query: expect.objectContaining({
            order,
            offset: 48,
            limit: 48,
            id: ["prod_search_result", "prod_other"],
            option_value_id: ["optval_apple"],
          }),
        })
      )
      expect(result.nextPage).toBe(3)
    }
  )

  it.each([0, -2, Number.NaN, Number.POSITIVE_INFINITY])(
    "normalizes invalid page %s to the first page",
    async (page) => {
      mocks.sdkFetch.mockResolvedValueOnce({ products: [], count: 100 })
      const result = await listProductsWithSort({
        page,
        queryParams: { limit: 48 },
        countryCode: "ca",
      })
      expect(mocks.sdkFetch.mock.calls[0][1].query.offset).toBe(0)
      expect(result.nextPage).toBe(2)
    }
  )

  it("returns the backend's final page and count without another fetch", async () => {
    mocks.sdkFetch.mockResolvedValueOnce({
      products: [{ id: "prod_last" }],
      count: 49,
    })
    const result = await listProductsWithSort({
      page: 2,
      queryParams: { limit: 48 },
      countryCode: "ca",
    })
    expect(result.response.count).toBe(49)
    expect(result.response.products).toHaveLength(1)
    expect(result.nextPage).toBeNull()
    expect(mocks.sdkFetch).toHaveBeenCalledTimes(1)
  })

  it.each(["price_asc", "price_desc"] as const)(
    "sorts %s across price batches and hydrates only the selected page in order",
    async (sortBy) => {
      const priceProducts = Array.from({ length: 103 }, (_, index) => ({
        id: `prod_${index}`,
        variants: [{ calculated_price: { calculated_amount: 103 - index } }],
      }))
      // The cheapest products arrive in the second batch; sorting each batch or
      // sorting only the displayed page would produce the wrong answer.
      const expectedIds =
        sortBy === "price_asc" ? ["prod_100", "prod_99"] : ["prod_2", "prod_3"]
      mocks.sdkFetch
        .mockResolvedValueOnce({
          products: priceProducts.slice(0, 100),
          count: 103,
        })
        .mockResolvedValueOnce({
          products: priceProducts.slice(100),
          count: 103,
        })
        .mockResolvedValueOnce({
          products: [...expectedIds].reverse().map((id) => ({ id, title: id })),
          count: 2,
        })

      const result = await listProductsWithSort({
        page: 2,
        queryParams: {
          limit: 2,
          category_id: ["pcat_phones", "pcat_cases"],
          option_value_id: ["optval_apple"],
          id: priceProducts.map((product) => product.id),
        },
        sortBy,
        countryCode: "ca",
      })

      expect(result.response.products.map((product) => product.id)).toEqual(
        expectedIds
      )
      expect(result.response.count).toBe(103)
      expect(result.nextPage).toBe(3)
      expect(mocks.sdkFetch).toHaveBeenCalledTimes(3)
      for (const [index, [, request]] of mocks.sdkFetch.mock.calls.entries()) {
        expect(request.headers).toEqual({ authorization: "Bearer test" })
        expect(request.query).toMatchObject({
          region_id: "reg_us",
          category_id: ["pcat_phones", "pcat_cases"],
          option_value_id: ["optval_apple"],
        })
        if (index < 2) {
          expect(request.query).toMatchObject({
            limit: 100,
            offset: index * 100,
            order: "id",
            id: priceProducts.map((product) => product.id),
            fields: "id,type_id,variants.id,*variants.calculated_price",
          })
        } else {
          expect(request.query).toMatchObject({
            id: expectedIds,
            limit: 2,
            offset: 0,
          })
          expect(request.query.fields).toContain("inventory_quantity")
        }
      }
    }
  )

  it("does not hydrate an out-of-range price page", async () => {
    mocks.sdkFetch.mockResolvedValueOnce({
      products: [{ id: "prod_one", variants: [] }],
      count: 1,
    })
    const result = await listProductsWithSort({
      page: 2,
      queryParams: { limit: 48 },
      sortBy: "price_asc",
      countryCode: "ca",
    })
    expect(result.response).toEqual({ products: [], count: 1 })
    expect(result.nextPage).toBeNull()
    expect(mocks.sdkFetch).toHaveBeenCalledTimes(1)
  })

  it("does not fetch the catalog when search has no candidate IDs", async () => {
    await expect(
      listFilteredProducts({
        queryParams: { id: [], limit: 48 },
        options: [],
        countryCode: "ca",
      })
    ).resolves.toEqual({ products: [], count: 0 })
    expect(mocks.sdkFetch).not.toHaveBeenCalled()
  })
})
