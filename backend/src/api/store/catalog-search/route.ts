import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import type { HttpTypes } from "@medusajs/framework/types";
import { GET as listStoreProducts } from "@medusajs/medusa/api/store/products/route";
import { ALGOLIA_MODULE } from "../../../modules/algolia";
import type { CatalogSearchSort } from "./middlewares";

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
  filterableFields: Record<string, unknown>;
  queryConfig: {
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
      (variant) => variant.calculated_price?.calculated_amount ?? 0
    ) ?? [];

  return prices.length ? Math.min(...prices) : Number.POSITIVE_INFINITY;
};

export const sortProductsByCalculatedPrice = (
  products: HttpTypes.StoreProduct[],
  sortBy: Extract<CatalogSearchSort, "price_asc" | "price_desc">
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
      .filter((id): id is string => Boolean(id))
  ),
];

export const GET = async (
  req: CatalogSearchRequest,
  res: MedusaResponse<HttpTypes.StoreProductListResponse>
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
      options: Record<string, unknown>
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
  if (sortBy === "created_at") {
    return listStoreProducts(req as never, res);
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
      const products = sortProductsByCalculatedPrice(body.products, sortBy);

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
