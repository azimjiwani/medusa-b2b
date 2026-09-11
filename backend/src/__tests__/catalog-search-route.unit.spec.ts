import {
  GET,
  sortProductsByCalculatedPrice,
} from "../api/store/catalog-search/route";
import { captureCatalogSearchSort } from "../api/store/catalog-search/middlewares";
import { Modules } from "@medusajs/framework/utils";

const listStoreProducts = jest.fn();

jest.mock("@medusajs/medusa/api/store/products/route", () => ({
  GET: (...args: unknown[]) => listStoreProducts(...args),
}));

const product = (id: string, price: number) => ({
  id,
  variants: [{ calculated_price: { calculated_amount: price } }],
});

describe("catalog search route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("keeps a large Algolia candidate set inside the backend request", async () => {
    const hits = Array.from({ length: 368 }, (_, index) => ({
      objectID: `prod_${index}`,
    }));
    const searchProducts = jest.fn().mockResolvedValue({
      results: [{ hits, nbHits: hits.length }],
    });
    const request: {
      catalogSearchSort: "created_at";
      filterableFields: Record<string, unknown>;
      queryConfig: { pagination: { skip: number; take: number } };
      scope: { resolve: jest.Mock };
    } = {
      catalogSearchSort: "created_at",
      filterableFields: {
        q: "Iphone",
        option_value_id: ["optval_apple"],
      },
      queryConfig: { pagination: { skip: 0, take: 48 } },
      scope: { resolve: jest.fn().mockReturnValue({ searchProducts }) },
    };
    const response = { status: jest.fn(), json: jest.fn() };
    response.status.mockReturnValue(response);
    listStoreProducts.mockResolvedValue(undefined);

    await GET(request as never, response as never);

    expect(searchProducts).toHaveBeenCalledWith("Iphone", {
      attributesToRetrieve: ["objectID"],
      hitsPerPage: 1000,
      page: 0,
    });
    expect(request.filterableFields).not.toHaveProperty("q");
    expect(request.filterableFields.id).toHaveLength(368);
    expect(request.filterableFields.option_value_id).toEqual(["optval_apple"]);
    expect(listStoreProducts).toHaveBeenCalledWith(request, response);
  });

  it("sorts customer-calculated prices before applying the requested page", async () => {
    const searchProducts = jest.fn().mockResolvedValue({
      results: [
        {
          hits: [
            { objectID: "prod_high" },
            { objectID: "prod_low" },
            { objectID: "prod_mid" },
          ],
          nbHits: 3,
        },
      ],
    });
    const request = {
      catalogSearchSort: "price_asc",
      filterableFields: { q: "phone" },
      queryConfig: { pagination: { skip: 1, take: 1 } },
      scope: { resolve: jest.fn().mockReturnValue({ searchProducts }) },
    };
    const response = { status: jest.fn(), json: jest.fn() };
    response.status.mockReturnValue(response);
    listStoreProducts.mockImplementation(async (_request, capturedResponse) =>
      capturedResponse.json({
        products: [
          product("prod_high", 30),
          product("prod_low", 10),
          product("prod_mid", 20),
        ],
        count: 3,
        offset: 0,
        limit: 3,
      }),
    );

    await GET(request as never, response as never);

    expect(request.queryConfig.pagination).toEqual({
      skip: 0,
      take: 3,
      order: undefined,
    });
    expect(response.json).toHaveBeenCalledWith({
      products: [expect.objectContaining({ id: "prod_mid" })],
      count: 3,
      offset: 1,
      limit: 1,
    });
  });

  it("sorts without mutating Medusa's hydrated product array", () => {
    const products = [product("prod_high", 30), product("prod_low", 10)];

    expect(
      sortProductsByCalculatedPrice(products as never, "price_asc").map(
        ({ id }) => id,
      ),
    ).toEqual(["prod_low", "prod_high"]);
    expect(products.map(({ id }) => id)).toEqual(["prod_high", "prod_low"]);
  });

  it.each([
    [[], "prod_overall"],
    [["pcat_cases"], "prod_case"],
    [["pcat_cases", "pcat_chargers"], "prod_overall"],
  ])(
    "applies the published featured ranking for categories %j before pagination",
    async (categoryIds, firstId) => {
      const products = [
        { id: "prod_old", created_at: "2026-01-01" },
        { id: "prod_case", created_at: "2026-01-02" },
        { id: "prod_new", created_at: "2026-09-01" },
        { id: "prod_overall", created_at: "2026-01-03" },
      ];
      const storeService = {
        listStores: jest.fn().mockResolvedValue([
          {
            metadata: {
              bnt_product_ranking: {
                draft: { product_ids: ["prod_old"], categories: [] },
                published: {
                  product_ids: ["prod_missing", "prod_overall"],
                  categories: [
                    { category_id: "pcat_cases", product_ids: ["prod_case"] },
                  ],
                },
              },
            },
          },
        ]),
      };
      const searchProducts = jest
        .fn()
        .mockResolvedValue({
          results: [
            {
              hits: products.map((item) => ({ objectID: item.id })),
              nbHits: 4,
            },
          ],
        });
      const request = {
        catalogSearchSort: "featured",
        catalogSearchCategoryIds: categoryIds,
        filterableFields: { q: "case", option_value_id: ["optval_phone"] },
        queryConfig: { fields: ["id"], pagination: { skip: 0, take: 2 } },
        scope: {
          resolve: (key: string) =>
            key === Modules.STORE ? storeService : { searchProducts },
        },
      };
      const response = { json: jest.fn() };
      listStoreProducts.mockImplementation(async (_request, capturedResponse) =>
        capturedResponse.json({ products, count: 4 }),
      );
      await GET(request as never, response as never);
      expect(response.json).toHaveBeenCalledWith({
        products: [
          expect.objectContaining({ id: firstId }),
          expect.objectContaining({ id: "prod_new" }),
        ],
        count: 4,
        offset: 0,
        limit: 2,
      });
      expect(request.filterableFields.option_value_id).toEqual([
        "optval_phone",
      ]);
      expect(request.queryConfig.fields).toContain("created_at");
      expect(products[0].id).toBe("prod_old");
    },
  );

  it("retains native pagination for a category with no published ranking", async () => {
    const storeService = {
      listStores: jest.fn().mockResolvedValue([{ metadata: null }]),
    };
    const request = {
      catalogSearchSort: "featured",
      catalogSearchCategoryIds: ["pcat_empty"],
      filterableFields: { q: "phone" },
      queryConfig: {
        pagination: { skip: 48, take: 48, order: { created_at: "DESC" } },
      },
      scope: {
        resolve: (key: string) =>
          key === Modules.STORE
            ? storeService
            : {
                searchProducts: async () => ({
                  results: [{ hits: [{ objectID: "prod_1" }], nbHits: 1 }],
                }),
              },
      },
    };
    const response = { json: jest.fn() };
    listStoreProducts.mockResolvedValue(undefined);
    await GET(request as never, response as never);
    expect(listStoreProducts).toHaveBeenCalledWith(request, response);
    expect(request.queryConfig.pagination).toEqual({
      skip: 48,
      take: 48,
      order: { created_at: "DESC" },
    });
  });

  it.each([
    ["featured", "-created_at"],
    ["title_asc", "title"],
    ["title_desc", "-title"],
    ["price_asc", undefined],
  ])(
    "preserves %s and original category selection before Medusa validation",
    (sortBy, order) => {
      const request = {
        query: { sortBy, category_id: ["pcat_cases", "pcat_cases"] },
      };
      const next = jest.fn();
      captureCatalogSearchSort(request as never, {} as never, next);
      expect(request).toMatchObject({
        catalogSearchSort: sortBy,
        catalogSearchCategoryIds: ["pcat_cases"],
      });
      expect(request.query).not.toHaveProperty("sortBy");
      expect((request.query as any).order).toBe(order);
      expect(next).toHaveBeenCalled();
    },
  );
});
