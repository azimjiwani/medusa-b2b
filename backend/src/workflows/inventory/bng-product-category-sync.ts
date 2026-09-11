import type { MedusaContainer } from "@medusajs/framework/types";
import { ModuleRegistrationName } from "@medusajs/framework/utils";
import type { BngInventoryProduct } from "./bng-inventory-source";
import {
  planBngProductCategories,
  resolveBngProductCategories,
} from "./bng-product-categories";

async function listAll(list: (skip: number, take: number) => Promise<any[]>) {
  const rows: any[] = [];
  for (let skip = 0; ; skip += 100) {
    const page = await list(skip, 100);
    rows.push(...page);
    if (page.length < 100) return rows;
  }
}

export async function prepareBngCategorySource(
  container: MedusaContainer,
  source: BngInventoryProduct[]
) {
  const service = container.resolve(ModuleRegistrationName.PRODUCT);
  const categories = await listAll((skip, take) =>
    service.listProductCategories(
      {},
      { skip, take, select: ["id", "name", "metadata"] }
    )
  );
  return resolveBngProductCategories(source, categories);
}

export async function reconcileBngProductCategories(
  container: MedusaContainer,
  source: BngInventoryProduct[],
  { dryRun = true }: { dryRun?: boolean } = {}
) {
  const service = container.resolve(ModuleRegistrationName.PRODUCT);
  const bySku = await prepareBngCategorySource(container, source);
  const products = await listAll((skip, take) =>
    service.listProducts(
      {},
      {
        skip,
        take,
        select: ["id", "variants.id", "variants.sku", "categories.id"],
        relations: ["variants", "categories"],
      }
    )
  );
  const changes = planBngProductCategories(products, bySku);
  let updated = 0;
  for (const change of changes) {
    if (dryRun) continue;
    // Preserve any memberships added after the initial snapshot.
    const current = await service.retrieveProduct(change.productId, {
      select: ["id", "variants.id", "variants.sku", "categories.id"],
      relations: ["variants", "categories"],
    });
    const fresh = planBngProductCategories([current], bySku)[0];
    if (!fresh) continue;
    await service.updateProducts(fresh.productId, {
      category_ids: fresh.categoryIds,
    });
    updated++;
  }
  return {
    dryRun,
    sourceProducts: bySku.size,
    catalogProducts: products.length,
    productsToUpdate: changes.length,
    linksToAdd: changes.reduce((sum, change) => sum + change.added.length, 0),
    updated,
    changes,
  };
}
