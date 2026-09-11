import {
  EMPTY_PRODUCT_RANKING,
  PRODUCT_RANKING_METADATA_KEY,
  productRankingSchema,
  readProductRankingState,
  updateProductRankingMetadata,
} from "../utils/product-ranking-config";
import { POST } from "../api/admin/product-ranking/route";
import { GET } from "../api/store/product-ranking/route";

describe("product ranking publishing", () => {
  const config = () => ({
    product_ids: Array.from({ length: 15 }, (_, i) => `prod_${i}`),
    categories: [
      { category_id: "pcat_cases", product_ids: ["prod_14", "prod_3"] },
    ],
  });

  it("defaults to empty rankings without requiring a migration", () => {
    expect(readProductRankingState(null).published).toEqual(
      EMPTY_PRODUCT_RANKING,
    );
    expect(
      readProductRankingState({
        [PRODUCT_RANKING_METADATA_KEY]: { published: "bad" },
      }).draft,
    ).toEqual(EMPTY_PRODUCT_RANKING);
  });

  it("keeps category and overall order separate and saves drafts privately", () => {
    const published = updateProductRankingMetadata(
      { bnt_landing_page: { keep: true }, other: 1 },
      config(),
      "publish",
    );
    const draft = config();
    draft.product_ids.reverse();
    draft.categories[0].product_ids.reverse();
    const saved = updateProductRankingMetadata(published, draft, "save");
    expect(saved).toMatchObject({ bnt_landing_page: { keep: true }, other: 1 });
    expect(readProductRankingState(saved).published).toEqual(config());
    expect(readProductRankingState(saved).draft).toEqual(draft);
    const cleared = updateProductRankingMetadata(
      saved,
      EMPTY_PRODUCT_RANKING,
      "publish",
    );
    expect(readProductRankingState(cleared).published).toEqual(
      EMPTY_PRODUCT_RANKING,
    );
  });

  it("accepts 15 ranked products and rejects duplicates, invalid IDs and excessive lists", () => {
    expect(productRankingSchema.parse(config()).product_ids).toHaveLength(15);
    for (const value of [
      { ...config(), product_ids: ["prod_1", "prod_1"] },
      { ...config(), product_ids: ["bad"] },
      {
        ...config(),
        product_ids: Array.from({ length: 501 }, (_, i) => `prod_${i}`),
      },
      {
        ...config(),
        categories: [config().categories[0], config().categories[0]],
      },
      {
        ...config(),
        categories: [
          { category_id: "pcat_cases", product_ids: ["prod_1", "prod_1"] },
        ],
      },
      { ...config(), categories: [{ category_id: "bad", product_ids: [] }] },
    ])
      expect(productRankingSchema.safeParse(value).success).toBe(false);
  });

  it("publishes through the admin endpoint and exposes only published configuration", async () => {
    let metadata: Record<string, unknown> = {
      private: "secret",
      bnt_landing_page: { keep: true },
    };
    const service = {
      listStores: jest.fn(async () => [{ id: "store_1", metadata }]),
      updateStores: jest.fn(async (_id, update) => {
        metadata = update.metadata;
      }),
    };
    const scope = { resolve: () => service };
    const response = () => {
      const res = { json: jest.fn(), status: jest.fn() };
      res.status.mockReturnValue(res);
      return res;
    };
    await POST(
      { scope, body: { action: "publish", config: config() } } as any,
      response() as any,
    );
    await POST(
      { scope, body: { action: "save", config: EMPTY_PRODUCT_RANKING } } as any,
      response() as any,
    );
    const res = response();
    await GET({ scope } as any, res as any);
    expect(res.json).toHaveBeenCalledWith({
      config: config(),
      published_at: expect.any(String),
    });
    expect(metadata.bnt_landing_page).toEqual({ keep: true });
    expect(service.updateStores).toHaveBeenCalledTimes(2);
    const bad = response();
    await POST(
      {
        scope,
        body: {
          action: "publish",
          config: { ...config(), product_ids: ["bad"] },
        },
      } as any,
      bad as any,
    );
    expect(bad.status).toHaveBeenCalledWith(400);
    expect(service.updateStores).toHaveBeenCalledTimes(2);
  });
});
