import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

/**
 * Deletes every product, its variants, and associated inventory items.
 *
 * Usage:
 *   medusa exec ./src/scripts/delete_all_products.ts -- --force
 *
 * Flags:
 *   --dry-run    List what would be removed without performing deletions.
 *   --force      Required to actually delete records.
 *   --batch <n>  Batch size when scanning products (default: 100).
 */
export default async function deleteAllProducts({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const productModule = container.resolve(Modules.PRODUCT)
  const inventoryModule = container.resolve(Modules.INVENTORY)

  let parsed
  try {
    parsed = parseCli(process.argv.slice(2))
  } catch (err) {
    logger.error((err as Error).message)
    return
  }

  const { dryRun, force, batchSize } = parsed

  if (!force && !dryRun) {
    logger.error(
      "Refusing to delete products without --force. Use --dry-run to inspect or add --force to proceed."
    )
    return
  }

  const productIds: string[] = []
  const productHandles: string[] = []
  const inventoryItemIds = new Set<string>()

  let offset = 0
  let fetched = 0
  let total = 0

  logger.info(`Scanning products in batches of ${batchSize} ...`)

  while (true) {
    const { data, metadata } = await query.graph(
      {
        entity: "product",
        fields: [
          "id",
          "handle",
          "variants.inventory_items.inventory_item_id",
        ],
        limit: batchSize,
        offset,
      },
      { throwIfKeyNotFound: false }
    )

    const products = data ?? []
    if (!products.length) {
      break
    }

    for (const product of products) {
      if (!product?.id) {
        continue
      }
      productIds.push(product.id)
      if (product.handle) {
        productHandles.push(product.handle)
      }

      const variants = product.variants ?? []
      for (const variant of variants) {
        const links = variant?.inventory_items ?? []
        for (const link of links) {
          const itemId = link?.inventory_item_id
          if (itemId) {
            inventoryItemIds.add(itemId)
          }
        }
      }
    }

    fetched += products.length
    offset += products.length
    total = metadata?.count ?? fetched

    logger.info(`Collected ${fetched}/${total || "?"} products so far...`)

    if (!metadata?.count || fetched >= metadata.count) {
      break
    }
  }

  if (!productIds.length) {
    logger.info("No products found. Nothing to delete.")
    return
  }

  logger.info(
    `Identified ${productIds.length} products and ${inventoryItemIds.size} inventory items.`
  )

  if (dryRun) {
    logger.info("Dry-run complete. No deletions performed.")
    logger.info(
      `Sample product handles: ${productHandles.slice(0, 10).join(", ")} ${
        productHandles.length > 10 ? "..." : ""
      }`
    )
    return
  }

  try {
    const deleteProductsFn = resolveDeleteProducts(productModule)
    await deleteProductsFn(productIds)
    logger.info(`Deleted ${productIds.length} products.`)
  } catch (err) {
    logger.error(`Failed to delete products: ${(err as Error).message}`)
    throw err
  }

  if (inventoryItemIds.size) {
    try {
      const deleteInventoryFn = resolveDeleteInventoryItems(inventoryModule)
      if (deleteInventoryFn) {
        await deleteInventoryFn(Array.from(inventoryItemIds))
        logger.info(`Deleted ${inventoryItemIds.size} inventory items.`)
      } else {
        logger.warn(
          "Inventory module does not expose a delete function. Inventory items may remain orphaned."
        )
      }
    } catch (err) {
      logger.error(`Failed to delete inventory items: ${(err as Error).message}`)
      throw err
    }
  }

  logger.info("Product cleanup completed successfully.")
}

type CliOptions = {
  dryRun: boolean
  force: boolean
  batchSize: number
}

function parseCli(argv: string[]): CliOptions {
  const options: CliOptions = {
    dryRun: false,
    force: false,
    batchSize: 100,
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    switch (arg) {
      case "--dry-run":
        options.dryRun = true
        break
      case "--force":
        options.force = true
        break
      case "--batch":
        options.batchSize = parsePositiveInt(argv[++i], 1) ?? options.batchSize
        break
      case "--help":
      case "-h":
        throw new Error(
          "Usage: medusa exec src/scripts/delete_all_products.ts -- [--dry-run] [--force] [--batch <size>]"
        )
      default:
        break
    }
  }

  return options
}

function parsePositiveInt(value?: string, min = 1): number | undefined {
  if (!value) {
    return undefined
  }
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed) || parsed < min) {
    return undefined
  }
  return parsed
}

function resolveDeleteProducts(productModule: any) {
  if (typeof productModule?.deleteProducts === "function") {
    return (ids: string[]) => productModule.deleteProducts(ids)
  }
  if (typeof productModule?.softDeleteProducts === "function") {
    return (ids: string[]) => productModule.softDeleteProducts(ids)
  }
  throw new Error("Product module does not expose deleteProducts/softDeleteProducts")
}

function resolveDeleteInventoryItems(inventoryModule: any) {
  if (typeof inventoryModule?.deleteInventoryItems === "function") {
    return (ids: string[]) => inventoryModule.deleteInventoryItems(ids)
  }
  if (typeof inventoryModule?.softDeleteInventoryItems === "function") {
    return (ids: string[]) => inventoryModule.softDeleteInventoryItems(ids)
  }
  return undefined
}
