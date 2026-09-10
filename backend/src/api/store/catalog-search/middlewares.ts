import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import type { MiddlewareRoute } from "@medusajs/medusa";
import { storeProductRoutesMiddlewares } from "@medusajs/medusa/api/store/products/middlewares";

export type CatalogSearchSort = "created_at" | "price_asc" | "price_desc";

const captureCatalogSearchSort = (
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const requestedSort = req.query.sortBy;
  const sortBy: CatalogSearchSort =
    requestedSort === "price_asc" || requestedSort === "price_desc"
      ? requestedSort
      : "created_at";

  (
    req as MedusaRequest & { catalogSearchSort?: CatalogSearchSort }
  ).catalogSearchSort = sortBy;

  delete req.query.sortBy;
  if (sortBy === "created_at") {
    req.query.order = "-created_at";
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
      : route.method === "GET")
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
