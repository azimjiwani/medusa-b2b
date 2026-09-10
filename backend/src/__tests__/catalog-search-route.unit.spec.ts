import {
  GET,
  sortProductsByCalculatedPrice,
} from "../api/store/catalog-search/route";

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
      })
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
        ({ id }) => id
      )
    ).toEqual(["prod_low", "prod_high"]);
    expect(products.map(({ id }) => id)).toEqual(["prod_high", "prod_low"]);
  });
});
