import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { syncProductsToAlgoliaWorkflow } from "../workflows/sync-products-to-algolia"

export default async function handleProductUpdate({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    await syncProductsToAlgoliaWorkflow(container).run({
      input: {
        productIds: [data.id],
      },
    })
  } catch (error) {
    console.error(`Failed to sync product ${data.id} to Algolia:`, error)
    throw error
  }
}

export const config: SubscriberConfig = {
  event: [
    "product.created",
    "product.updated",
  ],
}
