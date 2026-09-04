import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ALGOLIA_MODULE } from "../modules/algolia"

export default async function handleProductDelete({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const algoliaService = container.resolve(ALGOLIA_MODULE) as any

  try {
    await algoliaService.deleteProducts([data.id])
  } catch (error) {
    console.error(`Failed to delete product ${data.id} from Algolia:`, error)
    throw error
  }
}

export const config: SubscriberConfig = {
  event: "product.deleted",
}
