import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import type { MiddlewareRoute } from "@medusajs/medusa";
import { storeProductRoutesMiddlewares } from "@medusajs/medusa/api/store/products/middlewares";

export type CatalogSearchSort =
  | "created_at"
  | "price_asc"
  | "price_desc"
  | "featured"
  | "title_asc"
  | "title_desc";

export const captureCatalogSearchSort = (
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction,
) => {
  const requestedSort = req.query.sortBy;
  const sortBy: CatalogSearchSort =
    requestedSort === "price_asc" ||
    requestedSort === "price_desc" ||
    requestedSort === "featured" ||
    requestedSort === "title_asc" ||
    requestedSort === "title_desc"
      ? requestedSort
      : "created_at";

  (
    req as MedusaRequest & { catalogSearchSort?: CatalogSearchSort }
  ).catalogSearchSort = sortBy;

  // Capture the chosen categories before Medusa normalizes relation filters.
  const categories = req.query.category_id;
  (
    req as MedusaRequest & { catalogSearchCategoryIds?: string[] }
  ).catalogSearchCategoryIds = [
    ...new Set(
      (Array.isArray(categories) ? categories : [categories]).filter(
        (id): id is string => typeof id === "string",
      ),
    ),
  ];

  delete req.query.sortBy;
  if (sortBy === "created_at" || sortBy === "featured") {
    req.query.order = "-created_at";
  } else if (sortBy === "title_asc" || sortBy === "title_desc") {
    req.query.order = sortBy === "title_asc" ? "title" : "-title";
  } else {
    delete req.query.order;
  }

  next();
};

const productListRoute = storeProductRoutesMiddlewares.find(
  (route) =>
    route.matcher === "/store/products" &&
    (Array.isArray(route.method)
      ? route.method.includes("GET")
      : route.method === "GET"),
);

if (!productListRoute?.middlewares) {
  throw new Error("Medusa store product-list middleware is unavailable");
}

export const storeCatalogSearchMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/catalog-search",
    method: "GET",
    middlewares: [captureCatalogSearchSort, ...productListRoute.middlewares],
  },
];
