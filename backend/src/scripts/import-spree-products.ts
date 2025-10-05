import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, ProductStatus } from "@medusajs/framework/utils"
import {
  createInventoryItemsWorkflow,
  createProductTagsWorkflow,
  createProductsWorkflow,
} from "@medusajs/medusa/core-flows"
import { readFile, stat } from "fs/promises"
import path from "path"
import process from "process"

// Narrowed Spree types we care about
interface SpreeImage {
  large_url?: string | null
}

interface SpreeOptionType {
  id: number
  name: string
  presentation?: string | null
  position?: number
}

interface SpreeOptionValue {
  id: number
  name: string
  presentation?: string | null
  option_type_name?: string | null
  option_type_id?: number | null
  option_type_presentation?: string | null
}

interface SpreeVariant {
  id: number
  name: string
  sku?: string | null
  price?: string | number | null
  description?: string | null
  option_values?: SpreeOptionValue[] | null
  images?: SpreeImage[] | null
  total_on_hand?: number | null
  track_inventory?: boolean | null
  is_backorderable?: boolean | null
}

interface SpreeProductProperty {
  property_name: string
  value: string
}

interface SpreeClassification {
  taxon?: {
    id?: number
    name?: string | null
    permalink?: string | null
  } | null
}

interface SpreeProduct {
  id: number
  name: string
  description?: string | null
  display_price?: string | null
  price?: string | number | null
  slug?: string | null
  meta_description?: string | null
  meta_keywords?: string | null
  total_on_hand?: number | null
  master?: SpreeVariant & { images?: SpreeImage[] | null }
  option_types?: SpreeOptionType[] | null
  variants?: SpreeVariant[] | null
  product_properties?: SpreeProductProperty[] | null
  classifications?: SpreeClassification[] | null
}

interface SpreeDataFile {
  products?: SpreeProduct[] | null
}

interface CliOptions {
  file?: string
  dryRun: boolean
  locationId?: string
  currency?: string
  baseUrl?: string
}

interface PreparedVariant {
  title: string
  sku?: string
  manage_inventory: boolean
  allow_backorder: boolean
  prices: { currency_code: string; amount: number }[]
  options?: Record<string, string>
  metadata: Record<string, unknown>
  stock: number
  inventoryItemId?: string
  inventoryItemInput: {
    sku?: string
    title?: string
    description?: string
    requires_shipping: boolean
    metadata: Record<string, unknown>
    location_levels?: {
      location_id: string
      stocked_quantity?: number
    }[]
  }
}

interface ImportContext {
  dryRun: boolean
  currencyCode: string
  locationId?: string
  baseUrl?: string
}

const DEFAULT_INPUT = path.resolve(process.cwd(), "import_data/products.json")
const FALLBACK_CURRENCY = "eur"

const tagCache = new Map<string, string>()

const optionFallbackTitle = "Default"

const SIZE_OPTION_TITLES = new Set(["size", "taglia"])
const SIZE_VALUE_MAP: Record<string, string> = {
  "2x-Small": "XXS",
  "2x small": "XXS",
  "2xs": "XXS",
  extrasmall: "XS",
  "extra small": "XS",
  small: "S",
  medium: "M",
  large: "L",
  extralarge: "XL",
  "extra large": "XL",
  "x-large": "XL",
  "2x-large": "XXL",
  "2x large": "XXL",
  "2xl": "XXL",
  "3x-large": "3XL",
  "3x large": "3XL",
  "3xl": "3XL",
  "4x-large": "4XL",
  "4x large": "4XL",
  "4xl": "4XL",
  "5x-large": "5XL",
  "5x large": "5XL",
  "5xl": "5XL",
  "6x-large": "6XL",
  "6x large": "6XL",
  "6xl": "6XL",
}

export default async function importSpreeProducts({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const cli = parseCli(process.argv.slice(2))

  const inputPath = cli.file ? path.resolve(process.cwd(), cli.file) : DEFAULT_INPUT
  const resolvedFile = await ensureFileExists(inputPath)
  if (!resolvedFile) {
    logger.error(`Unable to read input file at ${inputPath}`)
    return
  }

  const currencyCode = (cli.currency || (await resolveDefaultCurrency(query)) || FALLBACK_CURRENCY).toLowerCase()
  const locationId = cli.locationId || (await resolveDefaultLocation(query))

  if (!locationId) {
    logger.warn(
      "No stock location configured. Inventory levels will not be initialized. Provide --location <id> to seed stock quantities."
    )
  }

  const raw = await readFile(resolvedFile, "utf8")
  const parsed: SpreeDataFile = JSON.parse(raw)
  const products = parsed.products ?? []

  if (!products.length) {
    logger.warn(`File ${resolvedFile} does not contain any products.`)
    return
  }

  logger.info(
    `Importing ${products.length} product(s) from ${resolvedFile} [currency: ${currencyCode.toUpperCase()}]${
      cli.dryRun ? " in dry-run mode" : ""
    }.`
  )


  const context: ImportContext = {
    dryRun: cli.dryRun,
    currencyCode,
    locationId,
    baseUrl: cli.baseUrl?.replace(/\/$/, ""),
  }
  if (context.baseUrl) {
    logger.info(`Using image base URL: ${context.baseUrl}`)
  }
  for (const product of products) {
    try {
      await importSingleProduct(container, query, product, context, logger)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logger.error(`Failed to import product ${product.slug || product.id}: ${message}`)
    }
  }

  logger.info("Import finished.")
}

function parseCli(argv: string[]): CliOptions {
  const options: CliOptions = { dryRun: false }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    switch (arg) {
      case "--file":
      case "-f": {
        const value = argv[i + 1]
        if (!value) {
          throw new Error("Missing value for --file option")
        }
        options.file = value
        i += 1
        break
      }
      case "--dry-run":
      case "-d": {
        options.dryRun = true
        break
      }
      case "--location":
      case "-l": {
        const value = argv[i + 1]
        if (!value) {
          throw new Error("Missing value for --location option")
        }
        options.locationId = value
        i += 1
        break
      }
      case "--currency":
      case "-c": {
        const value = argv[i + 1]
        if (!value) {
          throw new Error("Missing value for --currency option")
        }
        options.currency = value
        i += 1
        break
      }
      case "--base-url":
      case "-b": {
        const value = argv[i + 1]
        if (!value) {
          throw new Error("Missing value for --base-url option")
        }
        options.baseUrl = value
        i += 1
        break
      }
      default:
        break
    }
  }

  return options
}

async function ensureFileExists(candidate: string): Promise<string | null> {
  try {
    const stats = await stat(candidate)
    if (stats.isFile()) {
      return candidate
    }
    return null
  } catch (_) {
    return null
  }
}

async function resolveDefaultCurrency(query: any): Promise<string | null> {
  try {
    const {
      data: stores,
    } = await query.graph({
      entity: "store",
      fields: ["supported_currencies.currency_code", "supported_currencies.is_default"],
      limit: 1,
    })

    const currencies = stores?.[0]?.supported_currencies ?? []
    const defaultCurrency = currencies.find((currency: any) => currency.is_default)
    return (defaultCurrency?.currency_code || currencies[0]?.currency_code || null)?.toLowerCase() ?? null
  } catch (_) {
    return null
  }
}

async function resolveDefaultLocation(query: any): Promise<string | null> {
  try {
    const {
      data: stores,
    } = await query.graph({
      entity: "store",
      fields: ["default_location_id"],
      limit: 1,
    })

    return stores?.[0]?.default_location_id ?? null
  } catch (_) {
    return null
  }
}

async function importSingleProduct(
  container: ExecArgs["container"],
  query: any,
  product: SpreeProduct,
  context: ImportContext,
  logger: any
) {
  logger.info(`\nProcessing ${product.slug || product.id} (${product.name}) ...`)

  const metadata = buildMetadata(product)
  const images = collectImages(product, context.baseUrl, logger)
  logger.info(`Collected ${images.length} image(s) for ${product.slug || product.id}`)
  const { options, optionTitleMap, optionOrder } = buildProductOptions(product)

  const tagValues = collectTagNames(product)
  const tagIds = await ensureTagIds(container, query, tagValues, context)

  const preparedVariants = await prepareVariants(
    container,
    product,
    optionTitleMap,
    optionOrder,
    context,
    logger
  )
  logger.info(
    `Prepared ${preparedVariants.length} variant(s) for ${product.slug || product.id}`
  )

  const hasTaxons = Boolean(product.classifications && product.classifications.length)
  const hasImages = images.length > 0

  const payload = {
    title: product.name,
    description: product.description || undefined,
    handle: product.slug || undefined,
    status:
      hasTaxons && hasImages ? ProductStatus.PUBLISHED : ProductStatus.DRAFT,
    options,
    variants: preparedVariants.map((variant) => ({
      title: variant.title,
      sku: variant.sku,
      manage_inventory: variant.manage_inventory,
      allow_backorder: variant.allow_backorder,
      prices: variant.prices,
      options: variant.options,
      metadata: variant.metadata,
    })),
    images: images.map((url) => ({ url })),
    thumbnail: images[0],
    metadata,
    tags: tagIds.map((id) => ({ id })),
  }

  if (context.dryRun) {
    logger.info(
      `Dry-run: prepared payload for product ${product.slug || product.id}`
    )
    if (!hasTaxons) {
      logger.warn(
        `Product ${product.slug || product.id} has no taxons; it will remain in DRAFT status.`
      )
    }
    if (!hasImages) {
      logger.warn(
        `Product ${product.slug || product.id} has no images; it will remain in DRAFT status until images are added.`
      )
    }
    if (typeof logger.debug === "function") {
      logger.debug(JSON.stringify(payload, null, 2))
    }
    return
  }

  // Inject the created inventory item ids into the variant payloads
  for (let i = 0; i < preparedVariants.length; i++) {
    const variant = preparedVariants[i]
    const payloadVariant = payload.variants[i]
    const inventoryItemId = variant.inventoryItemId
    if (inventoryItemId) {
      payloadVariant.inventory_items = [
        {
          inventory_item_id: inventoryItemId,
          required_quantity: 1,
        },
      ]
    }
  }

  const { result: createdProducts } = await createProductsWorkflow(container).run({
    input: {
      products: [payload],
    },
  })

  const created = createdProducts?.[0]
  logger.info(
    `Product ${created?.handle || product.slug || product.id} imported with status ${payload.status} and ${preparedVariants.length} variant(s).`
  )
  if (!hasTaxons) {
    logger.warn(
      `Product ${product.slug || product.id} has no taxons; it remains in DRAFT status. Add classifications to publish.`
    )
  }
  if (!hasImages) {
    logger.warn(
      `Product ${product.slug || product.id} has no images; it remains in DRAFT status. Add images to publish.`
    )
  }
}

function parsePriceToAmount(price: string | number | null | undefined): number {
  if (price === null || price === undefined) {
    return 0
  }

  if (typeof price === "number") {
    return Math.round(price * 100)
  }

  const normalized = price
    .replace(/[^0-9,.-]/g, "")
    .replace(/,(\d{2})$/, ".$1")
  const numeric = Number.parseFloat(normalized)
  if (Number.isNaN(numeric)) {
    return 0
  }
  return Math.round(numeric * 100)
}

function buildMetadata(product: SpreeProduct): Record<string, unknown> {
  const metadata: Record<string, unknown> = {
    spree_product_id: product.id,
  }

  if (product.meta_description) {
    metadata.meta_description = product.meta_description
  }

  if (product.meta_keywords) {
    metadata.meta_keywords = product.meta_keywords
  }

  if (typeof product.total_on_hand === "number") {
    metadata.spree_total_on_hand = product.total_on_hand
  }

  for (const property of product.product_properties || []) {
    if (property.property_name) {
      metadata[property.property_name] = property.value
    }
  }

  return metadata
}

function buildOptionTitle(option: SpreeOptionType): string {
  return option.presentation?.trim() || option.name.trim()
}

function normalizeOptionValue(
  optionTitle: string | undefined | null,
  value: string
): string {
  if (!optionTitle) {
    return value
  }

  const key = optionTitle.trim().toLowerCase()
  if (!SIZE_OPTION_TITLES.has(key)) {
    return value
  }

  const valueKey = value.trim().toLowerCase()
  return SIZE_VALUE_MAP[valueKey] ?? value
}

function buildOptionValue(
  value: SpreeOptionValue,
  optionTitle?: string | null
): string {
  const raw = value.presentation?.trim() || value.name.trim()
  return normalizeOptionValue(optionTitle, raw)
}

function sanitizeImageUrl(
  url: string | null | undefined,
  baseUrl: string | undefined,
  logger: any
): string | null {
  if (!url) {
    return null
  }

  if (/^https?:\/\//i.test(url)) {
    return url
  }

  if (!baseUrl) {
    if (typeof logger?.warn === "function") {
      logger.warn(
        `Skipping relative image path "${url}" because no --base-url was provided.`
      )
    }
    return null
  }

  const normalizedPath = url.startsWith("/") ? url : `/${url}`
  return `${baseUrl}${normalizedPath}`
}

function collectImages(
  product: SpreeProduct,
  baseUrl: string | undefined,
  logger: any
): string[] {
  const images: string[] = []

  for (const image of product.master?.images || []) {
    const sanitized = sanitizeImageUrl(image.large_url, baseUrl, logger)
    if (sanitized) {
      images.push(sanitized)
      if (typeof logger?.debug === "function") {
        logger.debug(`Added master image: ${sanitized}`)
      }
    }
  }

  for (const variant of product.variants || []) {
    for (const image of variant.images || []) {
      const sanitized = sanitizeImageUrl(image.large_url, baseUrl, logger)
      if (sanitized) {
        images.push(sanitized)
        if (typeof logger?.debug === "function") {
          logger.debug(
            `Added image for variant ${variant.sku || variant.id}: ${sanitized}`
          )
        }
      }
    }
  }

  return Array.from(new Set(images))
}

function deriveVariantTitle(
  variant: SpreeVariant,
  optionTitleMap: Map<string, string>,
  optionOrder: string[]
): string {
  const optionValues = (variant.option_values || [])
    .map((value) => {
      const optionName = value.option_type_name || String(value.option_type_id)
      const optionTitle = optionTitleMap.get(optionName) ?? value.option_type_presentation
      return buildOptionValue(value, optionTitle)
    })
    .filter(Boolean)

  if (optionValues.length === optionOrder.length && optionValues.length > 0) {
    return optionValues.join(" / ")
  }

  if (optionValues.length > 0) {
    return `${variant.name} (${optionValues.join(" / ")})`
  }

  return variant.name
}

function buildProductOptions(product: SpreeProduct): {
  options: { title: string; values: string[] }[]
  optionTitleMap: Map<string, string>
  optionOrder: string[]
} {
  const optionTitleMap = new Map<string, string>()
  const optionValuesAccumulator = new Map<string, Set<string>>()

  const optionTypes = product.option_types || []

  for (const optionType of optionTypes) {
    const title = buildOptionTitle(optionType)
    optionTitleMap.set(optionType.name, title)
    optionValuesAccumulator.set(optionType.name, new Set<string>())
  }

  const sourceVariants = (product.variants && product.variants.length > 0
    ? product.variants
    : product.master
    ? [product.master]
    : []) as SpreeVariant[]

  for (const variant of sourceVariants) {
    for (const optionValue of variant.option_values || []) {
      const optionName = optionValue.option_type_name || String(optionValue.option_type_id)
      const title = optionTitleMap.get(optionName)
      if (!title) {
        continue
      }
      const set = optionValuesAccumulator.get(optionName)
      if (!set) {
        continue
      }
      set.add(buildOptionValue(optionValue, title))
    }
  }

  const options: { title: string; values: string[] }[] = []
  const optionOrder: string[] = []

  for (const optionType of optionTypes) {
    const optionName = optionType.name
    const title = optionTitleMap.get(optionName)
    if (!title) {
      continue
    }

    const values = Array.from(optionValuesAccumulator.get(optionName) || [])
    if (!values.length) {
      values.push(optionFallbackTitle)
    }

    optionOrder.push(title)
    options.push({ title, values })
  }

  if (!options.length) {
    optionOrder.push(optionFallbackTitle)
    options.push({ title: optionFallbackTitle, values: [optionFallbackTitle] })
  }

  return { options, optionTitleMap, optionOrder }
}

async function ensureTagIds(
  container: ExecArgs["container"],
  query: any,
  tagValues: string[],
  context: ImportContext
): Promise<string[]> {
  if (!tagValues.length) {
    return []
  }

  const uniqueValues = Array.from(new Set(tagValues.map((value) => value.trim()).filter(Boolean)))
  if (!uniqueValues.length) {
    return []
  }

  const resolvedIds: string[] = []

  for (const value of uniqueValues) {
    const cacheKey = value.toLowerCase()
    const cached = tagCache.get(cacheKey)
    if (cached) {
      resolvedIds.push(cached)
    }
  }

  const missingValues = uniqueValues.filter((value) => {
    const cacheKey = value.toLowerCase()
    return !tagCache.has(cacheKey)
  })

  if (missingValues.length) {
    const {
      data: existing,
    } = await query.graph({
      entity: "product_tag",
      fields: ["id", "value"],
      filters: {
        value: missingValues,
      },
      limit: missingValues.length,
    })

    for (const tag of existing || []) {
      if (!tag?.value || !tag?.id) {
        continue
      }
      const cacheKey = String(tag.value).toLowerCase()
      tagCache.set(cacheKey, tag.id)
      resolvedIds.push(tag.id)
    }
  }

  const stillMissing = uniqueValues.filter((value) => {
    const cacheKey = value.toLowerCase()
    return !tagCache.has(cacheKey)
  })

  if (stillMissing.length && !context.dryRun) {
    const { result: createdTags } = await createProductTagsWorkflow(container).run({
      input: {
        product_tags: stillMissing.map((value) => ({ value })),
      },
    })

    for (const tag of createdTags || []) {
      if (!tag?.id || !tag?.value) {
        continue
      }
      const cacheKey = String(tag.value).toLowerCase()
      tagCache.set(cacheKey, tag.id)
      resolvedIds.push(tag.id)
    }
  }

  for (const value of uniqueValues) {
    const cacheKey = value.toLowerCase()
    const id = tagCache.get(cacheKey)
    if (id) {
      resolvedIds.push(id)
    }
  }

  return Array.from(new Set(resolvedIds))
}

function collectTagNames(product: SpreeProduct): string[] {
  const tags: string[] = []

  for (const classification of product.classifications || []) {
    const value = classification.taxon?.name || classification.taxon?.permalink
    if (value) {
      tags.push(value)
    }
  }

  return tags
}

async function prepareVariants(
  container: ExecArgs["container"],
  product: SpreeProduct,
  optionTitleMap: Map<string, string>,
  optionOrder: string[],
  context: ImportContext,
  logger: any
): Promise<PreparedVariant[]> {
  const sourceVariants = (product.variants && product.variants.length > 0
    ? product.variants
    : product.master
    ? [product.master]
    : []) as SpreeVariant[]

  if (!sourceVariants.length) {
    throw new Error("Product does not contain variants or master variant")
  }

  const prepared: PreparedVariant[] = []

  for (const variant of sourceVariants) {
    const optionsRecord: Record<string, string> = {}
    for (const optionValue of variant.option_values || []) {
      const optionName = optionValue.option_type_name || String(optionValue.option_type_id)
      const optionTitle = optionTitleMap.get(optionName)
      if (!optionTitle) {
        continue
      }
      optionsRecord[optionTitle] = buildOptionValue(optionValue, optionTitle)
    }

    if (!Object.keys(optionsRecord).length && optionOrder.length === 1) {
      optionsRecord[optionOrder[0]] = optionFallbackTitle
    }

    const prices = [
      {
        currency_code: context.currencyCode,
        amount: parsePriceToAmount(variant.price ?? product.price),
      },
    ]

    const stockQuantity = typeof variant.total_on_hand === "number" ? variant.total_on_hand : 0

    const inventoryItemInput: PreparedVariant["inventoryItemInput"] = {
      sku: variant.sku || undefined,
      title: variant.name || product.name,
      description: variant.description || product.description || undefined,
      requires_shipping: true,
      metadata: {
        spree_variant_id: variant.id,
        spree_product_id: product.id,
      },
    }

    if (context.locationId) {
      inventoryItemInput.location_levels = [
        {
          location_id: context.locationId,
          stocked_quantity: stockQuantity,
        },
      ]
    } else if (stockQuantity > 0) {
      logger.warn(
        `Variant ${variant.sku || variant.id} has stock ${stockQuantity} but no stock location is configured.`
      )
    }

    prepared.push({
      title: deriveVariantTitle(variant, optionTitleMap, optionOrder),
      sku: variant.sku || undefined,
      manage_inventory: variant.track_inventory ?? true,
      allow_backorder: variant.is_backorderable ?? false,
      prices,
      options: Object.keys(optionsRecord).length ? optionsRecord : undefined,
      metadata: {
        spree_variant_id: variant.id,
      },
      stock: stockQuantity,
      inventoryItemInput,
    })
    if (typeof logger?.info === "function") {
      logger.info(
        `Variant ${variant.sku || variant.id}: stock=${stockQuantity}, price=${prices[0]?.amount} ${context.currencyCode.toUpperCase()}`
      )
    }
  }

  if (context.dryRun) {
    return prepared
  }

  const itemsToCreate = prepared.map((variant) => variant.inventoryItemInput)

  const { result: createdItems } = await createInventoryItemsWorkflow(container).run({
    input: {
      items: itemsToCreate,
    },
  })

  if (!createdItems || createdItems.length !== prepared.length) {
    logger.warn(
      `Created ${createdItems?.length ?? 0} inventory item(s) for product ${product.slug || product.id}, expected ${prepared.length}.`
    )
  }

  for (let i = 0; i < prepared.length; i++) {
    const created = createdItems?.[i]
    if (created?.id) {
      prepared[i].inventoryItemId = created.id
    }
  }

  return prepared
}
