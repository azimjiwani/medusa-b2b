import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import type { HttpTypes, IStoreModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { GET as listStoreProducts } from "@medusajs/medusa/api/store/products/route";
import { ALGOLIA_MODULE } from "../../../modules/algolia";
import type { CatalogSearchSort } from "./middlewares";
import { readProductRankingState } from "../../../utils/product-ranking-config";

type SearchHit = {
  id?: string;
  objectID?: string;
};

type AlgoliaSearchResponse = {
  results?: Array<{
    hits?: SearchHit[];
    nbHits?: number;
  }>;
};

type CatalogSearchRequest = MedusaRequest & {
  catalogSearchSort?: CatalogSearchSort;
  catalogSearchCategoryIds?: string[];
  filterableFields: Record<string, unknown>;
  queryConfig: {
    fields?: string[];
    pagination: {
      skip?: number;
      take?: number;
      order?: Record<string, "ASC" | "DESC">;
    };
  };
};

const getMinimumCalculatedPrice = (product: HttpTypes.StoreProduct) => {
  const prices =
    product.variants?.map(
      (variant) => variant.calculated_price?.calculated_amount ?? 0,
    ) ?? [];

  return prices.length ? Math.min(...prices) : Number.POSITIVE_INFINITY;
};

export const sortProductsByCalculatedPrice = (
  products: HttpTypes.StoreProduct[],
  sortBy: Extract<CatalogSearchSort, "price_asc" | "price_desc">,
) =>
  [...products].sort((left, right) => {
    const difference =
      getMinimumCalculatedPrice(left) - getMinimumCalculatedPrice(right);
    return sortBy === "price_asc" ? difference : -difference;
  });

const uniqueProductIds = (hits: SearchHit[]) => [
  ...new Set(
    hits
      .map((hit) => hit.objectID || hit.id)
      .filter((id): id is string => Boolean(id)),
  ),
];

export const GET = async (
  req: CatalogSearchRequest,
  res: MedusaResponse<HttpTypes.StoreProductListResponse>,
) => {
  const query = req.filterableFields.q;
  if (typeof query !== "string" || !query.trim()) {
    return res.status(400).json({
      message: "Query parameter 'q' is required",
    } as never);
  }

  const algoliaService = req.scope.resolve(ALGOLIA_MODULE) as {
    searchProducts: (
      query: string,
      options: Record<string, unknown>,
    ) => Promise<AlgoliaSearchResponse>;
  };
  const searchResponse = await algoliaService.searchProducts(query, {
    attributesToRetrieve: ["objectID"],
    hitsPerPage: 1000,
    page: 0,
  });
  const result = searchResponse.results?.[0];
  const productIds = uniqueProductIds(result?.hits ?? []);

  if ((result?.nbHits ?? productIds.length) > productIds.length) {
    return res.status(422).json({
      message: "Search result set exceeds the configured 1000-product limit",
    } as never);
  }

  if (!productIds.length) {
    return res.json({
      products: [],
      count: 0,
      offset: req.queryConfig.pagination.skip ?? 0,
      limit: req.queryConfig.pagination.take ?? 50,
    });
  }

  delete req.filterableFields.q;
  req.filterableFields.id = productIds;

  const sortBy = req.catalogSearchSort ?? "created_at";
  if (
    sortBy === "created_at" ||
    sortBy === "title_asc" ||
    sortBy === "title_desc"
  ) {
    return listStoreProducts(req as never, res);
  }

  let featuredIds: string[] = [];
  if (sortBy === "featured") {
    const storeService: IStoreModuleService = req.scope.resolve(Modules.STORE);
    const [store] = await storeService.listStores({}, { take: 1 });
    const { published } = readProductRankingState(store?.metadata);
    const categoryIds = req.catalogSearchCategoryIds ?? [];
    featuredIds =
      categoryIds.length === 1
        ? (published.categories.find(
            (item) => item.category_id === categoryIds[0],
          )?.product_ids ?? [])
        : published.product_ids;
    if (!featuredIds.length) return listStoreProducts(req as never, res);
    req.queryConfig.fields = [
      ...new Set([...(req.queryConfig.fields ?? []), "id", "created_at"]),
    ];
  }

  const requestedPagination = { ...req.queryConfig.pagination };
  req.queryConfig.pagination = {
    ...req.queryConfig.pagination,
    skip: 0,
    take: productIds.length,
    order: undefined,
  };

  const captureResponse = {
    ...res,
    json: (body: HttpTypes.StoreProductListResponse) => {
      const offset = requestedPagination.skip ?? 0;
      const limit = requestedPagination.take ?? 50;
      const ranks = new Map(featuredIds.map((id, index) => [id, index]));
      const products =
        sortBy === "featured"
          ? [...body.products].sort((left, right) => {
              const leftRank = ranks.get(left.id);
              const rightRank = ranks.get(right.id);
              if (leftRank !== undefined || rightRank !== undefined) {
                if (leftRank === undefined) return 1;
                if (rightRank === undefined) return -1;
                return leftRank - rightRank;
              }
              return (
                (new Date(right.created_at ?? 0).getTime() || 0) -
                  (new Date(left.created_at ?? 0).getTime() || 0) ||
                left.id.localeCompare(right.id)
              );
            })
          : sortProductsByCalculatedPrice(body.products, sortBy);

      return res.json({
        ...body,
        products: products.slice(offset, offset + limit),
        offset,
        limit,
      });
    },
  } as MedusaResponse<HttpTypes.StoreProductListResponse>;

  return listStoreProducts(req as never, captureResponse);
};
