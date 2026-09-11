import type { BngInventoryProduct } from "./bng-inventory-source";
import { isB2bInventoryProduct } from "./steps/product-availability";

type Category = {
  id: string;
  name: string;
  metadata?: Record<string, unknown> | null;
};
type Product = {
  id: string;
  categories?: { id: string }[] | null;
  variants?: { sku?: string | null }[] | null;
};

const normalize = (value: string) =>
  value.trim().replace(/\s+/g, " ").toLowerCase();

/** Resolve the entire source before any catalog mutation. Never infer from titles. */
export function resolveBngProductCategories(
  source: BngInventoryProduct[],
  categories: Category[]
) {
  const names = new Map<string, Set<string>>();
  for (const category of categories) {
    for (const name of [category.name, category.metadata?.original_value]) {
      if (typeof name !== "string" || !name.trim()) continue;
      const key = normalize(name);
      const ids = names.get(key) ?? new Set<string>();
      ids.add(category.id);
      names.set(key, ids);
    }
  }
  const bySku = new Map<string, string[]>();
  for (const product of source.filter(isB2bInventoryProduct)) {
    const sku = product.upcCode?.trim();
    if (!sku || bySku.has(sku))
      throw new Error(`Missing or duplicate BNG category SKU: ${sku}`);
    const ids = new Set<string>();
    for (const value of [product.productCategory, product.productSubCategory]) {
      if (typeof value !== "string" || !value.trim()) {
        throw new Error(`Missing BNG category for SKU ${sku}`);
      }
      const matches = names.get(normalize(value));
      if (matches?.size !== 1) {
        throw new Error(
          `Unknown or ambiguous BNG category "${value}" for SKU ${sku}; create or resolve this category before syncing`
        );
      }
      ids.add([...matches][0]);
    }
    bySku.set(sku, [...ids]);
  }
  if (!bySku.size)
    throw new Error("BNG category source has no wholesale products");
  return bySku;
}

/** Add missing source memberships without removing manual or historical assignments. */
export function planBngProductCategories(
  products: Product[],
  bySku: Map<string, string[]>
) {
  return products.flatMap((product) => {
    const existing = new Set(
      (product.categories ?? []).map((category) => category.id)
    );
    const desired = new Set<string>();
    for (const variant of product.variants ?? []) {
      for (const id of bySku.get(variant.sku?.trim() ?? "") ?? [])
        desired.add(id);
    }
    const added = [...desired].filter((id) => !existing.has(id));
    return added.length
      ? [
          {
            productId: product.id,
            skus: (product.variants ?? [])
              .map((variant) => variant.sku)
              .filter(Boolean),
            before: [...existing],
            added,
            categoryIds: [...new Set([...existing, ...desired])],
          },
        ]
      : [];
  });
}
