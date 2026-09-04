import type { ExecArgs } from "@medusajs/framework/types"
import { provisionBngProductOptionDefinitions } from "../workflows/inventory/bng-product-option-sync"

export default async function provisionBngProductOptions({
  container,
  args,
}: ExecArgs) {
  const apply = args.includes("apply")
  if (apply && args.includes("dry-run")) {
    throw new Error("Choose either --apply or --dry-run, not both")
  }

  const summary = await provisionBngProductOptionDefinitions(container, {
    dryRun: !apply,
  })
  console.log(JSON.stringify(summary, null, 2))
}
