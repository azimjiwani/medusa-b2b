import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { syncProductsToAlgoliaWorkflow } from "../workflows/sync-products-to-algolia"

export default async function handleProductUpdate({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  await syncProductsToAlgoliaWorkflow(container).run({
    input: {
      productIds: [data.id],
    },
  })
}

export const config: SubscriberConfig = {
  event: [
    "product.created",
    "product.updated",
  ],
}