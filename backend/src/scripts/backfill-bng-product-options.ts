import type { ExecArgs } from "@medusajs/framework/types"
import { fetchBngInventoryProducts } from "../workflows/inventory/bng-inventory-source"
import { reconcileBngProductOptions } from "../workflows/inventory/bng-product-option-sync"

export default async function backfillBngProductOptions({
  container,
  args,
}: ExecArgs) {
  const apply = args.includes("apply")
  if (apply && args.includes("dry-run")) {
    throw new Error("Choose either --apply or --dry-run, not both")
  }

  const sourceProducts = await fetchBngInventoryProducts()
  const summary = await reconcileBngProductOptions(container, sourceProducts, {
    dryRun: !apply,
  })

  console.log(JSON.stringify(summary, null, 2))

  if (summary.failures.length || (apply && summary.rejections.length)) {
    throw new Error(
      `BNG product option ${apply ? "backfill" : "dry run"} failed for ${summary.failures.length + summary.rejections.length} operation(s)`
    )
  }
}
