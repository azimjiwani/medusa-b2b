import type { ExecArgs } from "@medusajs/framework/types"
import { provisionBngProductOptionDefinitions } from "../workflows/inventory/bng-product-option-sync"

export default async function provisionBngProductOptions({
  container,
}: ExecArgs) {
  const summary = await provisionBngProductOptionDefinitions(container)
  console.log(JSON.stringify(summary, null, 2))
}
