import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { ALGOLIA_MODULE } from "../modules/algolia"
import { syncProductsToAlgoliaWorkflow } from "../workflows/sync-products-to-algolia"

const BATCH_SIZE = 100

export const chunk = <T>(items: T[], size: number): T[][] => {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

export const findStaleObjectIds = (
  indexedObjectIds: string[],
  productIds: string[]
): string[] => {
  const known = new Set(productIds)
  return indexedObjectIds.filter((id) => !known.has(id))
}

/**
 * Re-indexes every product into Algolia and removes index records whose
 * product no longer exists in Medusa. The product subscribers only sync a
 * product when it is created, updated or deleted, so run this once whenever
 * the index has drifted (e.g. after the write key was missing or invalid).
 *
 * Execute with `npx medusa exec ./src/scripts/sync-algolia.ts`.
 * Pass `--no-prune` to skip deleting stale records.
 */
export default async function syncAlgolia({ container, args }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const productModuleService = container.resolve(Modules.PRODUCT)
  const algoliaService = container.resolve(ALGOLIA_MODULE) as any
  const prune = !(args ?? []).includes("--no-prune")

  const productIds: string[] = []
  for (let skip = 0; ; skip += BATCH_SIZE) {
    const page = await productModuleService.listProducts(
      {},
      { select: ["id"], skip, take: BATCH_SIZE }
    )
    productIds.push(...page.map((product) => product.id))
    if (page.length < BATCH_SIZE) {
      break
    }
  }
  logger.info(`Found ${productIds.length} products to sync to Algolia`)

  let synced = 0
  for (const batch of chunk(productIds, BATCH_SIZE)) {
    const { result } = await syncProductsToAlgoliaWorkflow(container).run({
      input: { productIds: batch },
    })
    synced += result.count
    logger.info(`Synced ${synced}/${productIds.length} products`)
  }

  if (!prune) {
    logger.info("Skipping stale record cleanup (--no-prune)")
    return
  }

  const indexedObjectIds = await algoliaService.listIndexedObjectIds()
  const stale = findStaleObjectIds(indexedObjectIds, productIds)
  if (stale.length === 0) {
    logger.info(`Index holds ${indexedObjectIds.length} records, none stale`)
    return
  }
  await algoliaService.deleteProducts(stale)
  logger.info(`Removed ${stale.length} stale records from Algolia`)
}
