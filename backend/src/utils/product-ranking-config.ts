import { z } from "@medusajs/framework/zod";

export const MAX_RANKED_PRODUCTS = 500;
const productIds = z
  .array(z.string().startsWith("prod_").max(100))
  .max(MAX_RANKED_PRODUCTS)
  .refine(
    (ids) => new Set(ids).size === ids.length,
    "A product can only appear once in a ranking",
  );

export const productRankingSchema = z
  .object({
    product_ids: productIds,
    categories: z
      .array(
        z
          .object({
            category_id: z.string().startsWith("pcat_").max(100),
            product_ids: productIds,
          })
          .strict(),
      )
      .max(500)
      .refine(
        (items) =>
          new Set(items.map((item) => item.category_id)).size === items.length,
        "A category can only have one ranking",
      ),
  })
  .strict();

export type ProductRankingConfig = z.infer<typeof productRankingSchema>;
export const PRODUCT_RANKING_METADATA_KEY = "bnt_product_ranking";
export const EMPTY_PRODUCT_RANKING: ProductRankingConfig = {
  product_ids: [],
  categories: [],
};

export function readProductRankingState(
  metadata: Record<string, unknown> | null | undefined,
) {
  const raw = metadata?.[PRODUCT_RANKING_METADATA_KEY] as
    Record<string, unknown> | undefined;
  const published = productRankingSchema.safeParse(raw?.published);
  const draft = productRankingSchema.safeParse(raw?.draft);
  return {
    draft: draft.success
      ? draft.data
      : published.success
        ? published.data
        : structuredClone(EMPTY_PRODUCT_RANKING),
    published: published.success
      ? published.data
      : structuredClone(EMPTY_PRODUCT_RANKING),
    saved_at: typeof raw?.saved_at === "string" ? raw.saved_at : null,
    published_at:
      typeof raw?.published_at === "string" ? raw.published_at : null,
  };
}

export function updateProductRankingMetadata(
  metadata: Record<string, unknown> | null | undefined,
  config: ProductRankingConfig,
  action: "save" | "publish",
) {
  const previous = readProductRankingState(metadata);
  const now = new Date().toISOString();
  return {
    ...metadata,
    [PRODUCT_RANKING_METADATA_KEY]: {
      draft: config,
      published: action === "publish" ? config : previous.published,
      published_at: action === "publish" ? now : previous.published_at,
      saved_at: now,
    },
  };
}
