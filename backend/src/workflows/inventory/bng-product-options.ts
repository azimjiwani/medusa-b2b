import { isB2bInventoryProduct } from "./steps/product-availability"

export const BNG_PRODUCT_OPTION_FIELDS = [
  ["brand", "Brand"],
  ["color", "Color"],
  ["device", "Device"],
  ["capacity", "Capacity"],
  ["length", "Length"],
  ["material", "Material"],
  ["memory", "Memory"],
  ["watts", "Watts"],
] as const

export type BngProductOptionField = (typeof BNG_PRODUCT_OPTION_FIELDS)[number][0]

export interface BngProductOptionSource {
  upcCode?: unknown
  productAvailabilityType: string
  [key: string]: unknown
}

export interface ProductOptionValueSnapshot {
  id: string
  value: string
}

export interface ProductOptionSnapshot {
  id: string
  title: string
  is_exclusive?: boolean
  metadata?: Record<string, unknown> | null
  values: ProductOptionValueSnapshot[]
}

export interface VariantOptionSnapshot extends ProductOptionValueSnapshot {
  option_id?: string
  option?: { id: string; title: string } | null
}

export interface BngProductSnapshot {
  id: string
  metadata?: Record<string, unknown> | null
  options?: ProductOptionSnapshot[] | null
  variants?: Array<{
    id: string
    sku?: string | null
    options?: VariantOptionSnapshot[] | null
  }> | null
}

interface ManagedAssignment {
  option_id: string
  value_id: string
  value: string
  association_managed?: boolean
}

type ManagedState = Partial<Record<BngProductOptionField, ManagedAssignment>>

export interface NormalizedBngProduct {
  sku: string
  attributes: Record<BngProductOptionField, string | null>
  source: BngProductOptionSource
}

export interface BngProductOptionPlanningOptions {
  minB2bProducts: number
  maxRemovals: number
  maxRemovalFraction: number
  maxProductRemovals: number
  maxProductRemovalFraction: number
}

interface DesiredAssignment {
  field: BngProductOptionField
  title: string
  value: string
  variantTitle: string
  variantValue: string
  optionId?: string
  valueId?: string
  associationExists: boolean
  associationManaged: boolean
  associationUpdateRequired: boolean
  previousManagedValueId?: string
}

interface PlannedRemoval {
  field: BngProductOptionField
  title: string
  optionId: string
  valueId: string
  removeAssociation: boolean
  removeVariantAssignment: boolean
}

export interface ProductOptionChange {
  sku: string
  productId: string
  variantId: string
  metadata: Record<string, unknown>
  desiredAssignments: DesiredAssignment[]
  removals: PlannedRemoval[]
  retainedOptionIds: string[]
  preservedVariantOptions: Record<string, string>
  nextManagedState: ManagedState
}

export interface ProductOptionSyncPlan {
  normalizedProducts: NormalizedBngProduct[]
  optionDefinitionsToCreate: Array<{
    field: BngProductOptionField
    title: string
    values: string[]
  }>
  optionValuesToCreate: Array<{
    field: BngProductOptionField
    title: string
    optionId: string
    value: string
  }>
  productChanges: ProductOptionChange[]
  rejections: ProductOptionSyncDiagnostic[]
  summary: {
    sourceRows: number
    b2bRows: number
    duplicatesDeduplicated: number
    productsUnchanged: number
    managedRemovals: number
    proposedProductRemovals: number
  }
}

export interface ProductOptionSyncDependencies {
  createOption(input: {
    title: string
    values: string[]
    is_exclusive: false
    metadata: Record<string, unknown>
  }): Promise<unknown>
  addOptionValues(optionId: string, values: string[]): Promise<unknown>
  addProductOption(
    productId: string,
    optionId: string,
    valueIds: string[]
  ): Promise<unknown>
  updateProductOptionValues(
    productId: string,
    optionId: string,
    add: string[],
    remove: string[]
  ): Promise<unknown>
  replaceProductOptionsAndVariant(
    productId: string,
    optionIds: string[],
    variantId: string,
    options: Record<string, string>
  ): Promise<unknown>
  updateVariantOptions(
    variantId: string,
    options: Record<string, string>
  ): Promise<unknown>
  updateProductMetadata(
    productId: string,
    metadata: Record<string, unknown>
  ): Promise<unknown>
  getOptions(): Promise<ProductOptionSnapshot[]>
}

export interface ProductOptionSyncSummary {
  dryRun: boolean
  sourceRows: number
  b2bRows: number
  duplicatesDeduplicated: number
  optionDefinitionsCreated: number
  optionValuesCreated: number
  productAssociationsUpdated: number
  variantAssignmentsUpdated: number
  removals: number
  productsUnchanged: number
  rejections: ProductOptionSyncPlan["rejections"]
  failures: ProductOptionSyncDiagnostic[]
  proposed: {
    optionDefinitions: ProductOptionSyncPlan["optionDefinitionsToCreate"]
    optionValues: ProductOptionSyncPlan["optionValuesToCreate"]
    productAssociations: Array<{
      sku: string
      productId: string
      field: BngProductOptionField
      title: string
      value: string
    }>
    variantAssignments: Array<{
      sku: string
      variantId: string
      options: Record<string, string>
    }>
    removals: Array<PlannedRemoval & { sku: string; productId: string }>
  }
}

export interface ProductOptionSyncDiagnostic {
  sku?: string
  operation: string
  reason: string
}

export class BngProductOptionValidationError extends Error {
  readonly failures: ProductOptionSyncSummary["failures"]

  constructor(message: string, failures?: ProductOptionSyncSummary["failures"]) {
    super(message)
    this.name = "BngProductOptionValidationError"
    this.failures = failures ?? [{ operation: "validate-source", reason: message }]
  }
}

const normalizeText = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null
  }

  const normalized = String(value).trim()
  return normalized || null
}

const normalizeSku = (value: unknown) => normalizeText(value) ?? ""

const normalizedSourceSignature = (source: BngProductOptionSource) => {
  const normalizedEntries = Object.entries(source)
    .map(([key, value]) => [key, normalizeText(value)] as const)
    .sort(([left], [right]) => left.localeCompare(right))

  return JSON.stringify(normalizedEntries)
}

const getManagedState = (
  metadata: Record<string, unknown>
): ManagedState => {
  const candidate = metadata.bng_product_options
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return {}
  }

  return candidate as ManagedState
}

const getVariantOptionId = (option: VariantOptionSnapshot) =>
  option.option_id ?? option.option?.id

const getVariantOptionTitle = (option: VariantOptionSnapshot) =>
  option.option?.title

const hasSameAssignment = (
  association: ProductOptionSnapshot | undefined,
  variantOptions: VariantOptionSnapshot[],
  optionId: string | undefined,
  valueId: string | undefined,
  managed: ManagedAssignment | undefined,
  desiredValue: string
) =>
  !!optionId &&
  !!valueId &&
  association?.values.some(({ id }) => id === valueId) === true &&
  variantOptions.some(
    (option) =>
      option.id === valueId && getVariantOptionId(option) === optionId
  ) &&
  managed?.option_id === optionId &&
  managed.value_id === valueId &&
  managed.value === desiredValue

export function planBngProductOptions(
  sourceProducts: BngProductOptionSource[],
  currentProducts: BngProductSnapshot[],
  globalOptions: ProductOptionSnapshot[],
  options: BngProductOptionPlanningOptions
): ProductOptionSyncPlan {
  const b2bProducts = sourceProducts.filter(isB2bInventoryProduct)
  if (b2bProducts.length < options.minB2bProducts) {
    throw new BngProductOptionValidationError(
      `Expected at least ${options.minB2bProducts} B2B products, received ${b2bProducts.length}`
    )
  }

  const sourceBySku = new Map<
    string,
    { product: NormalizedBngProduct; signature: string }
  >()
  let duplicatesDeduplicated = 0

  for (const source of b2bProducts) {
    const sku = normalizeSku(source.upcCode)
    if (!sku) {
      throw new BngProductOptionValidationError("Blank B2B UPC is not allowed")
    }

    const product: NormalizedBngProduct = {
      sku,
      attributes: Object.fromEntries(
        BNG_PRODUCT_OPTION_FIELDS.map(([field]) => [
          field,
          normalizeText(source[field]),
        ])
      ) as NormalizedBngProduct["attributes"],
      source,
    }
    const signature = normalizedSourceSignature(source)
    const existing = sourceBySku.get(sku)
    if (existing) {
      if (existing.signature !== signature) {
        throw new BngProductOptionValidationError(
          `Conflicting BNG rows share normalized UPC ${sku}`
        )
      }
      duplicatesDeduplicated++
      continue
    }
    sourceBySku.set(sku, { product, signature })
  }

  const normalizedProducts = [...sourceBySku.values()].map(({ product }) => product)
  const optionByField = new Map<BngProductOptionField, ProductOptionSnapshot>()

  for (const [field, title] of BNG_PRODUCT_OPTION_FIELDS) {
    const matches = globalOptions.filter(
      (option) => option.title.trim() === title && option.is_exclusive === false
    )
    if (matches.length > 1) {
      throw new BngProductOptionValidationError(
        `Multiple reusable global options exist for ${title}`
      )
    }
    if (matches.length === 1) {
      optionByField.set(field, matches[0])
    }
  }

  const desiredValuesByField = new Map<BngProductOptionField, Set<string>>()
  for (const product of normalizedProducts) {
    for (const [field] of BNG_PRODUCT_OPTION_FIELDS) {
      const value = product.attributes[field]
      if (value) {
        const values = desiredValuesByField.get(field) ?? new Set<string>()
        values.add(value)
        desiredValuesByField.set(field, values)
      }
    }
  }

  const optionDefinitionsToCreate: ProductOptionSyncPlan["optionDefinitionsToCreate"] = []
  const optionValuesToCreate: ProductOptionSyncPlan["optionValuesToCreate"] = []
  for (const [field, title] of BNG_PRODUCT_OPTION_FIELDS) {
    const desiredValues = [...(desiredValuesByField.get(field) ?? [])].sort()
    const globalOption = optionByField.get(field)
    if (!globalOption) {
      optionDefinitionsToCreate.push({ field, title, values: desiredValues })
      continue
    }

    const existingByNormalizedValue = new Map<string, ProductOptionValueSnapshot>()
    for (const value of globalOption.values) {
      const normalized = normalizeText(value.value)
      if (!normalized) {
        continue
      }
      if (existingByNormalizedValue.has(normalized)) {
        throw new BngProductOptionValidationError(
          `Global option ${title} has conflicting normalized value ${normalized}`
        )
      }
      existingByNormalizedValue.set(normalized, value)
    }
    for (const value of desiredValues) {
      if (!existingByNormalizedValue.has(value)) {
        optionValuesToCreate.push({
          field,
          title,
          optionId: globalOption.id,
          value,
        })
      }
    }
  }

  const productsBySku = new Map<
    string,
    { product: BngProductSnapshot; variant: NonNullable<BngProductSnapshot["variants"]>[number] }
  >()
  for (const product of currentProducts) {
    for (const variant of product.variants ?? []) {
      const sku = normalizeSku(variant.sku)
      if (!sku) {
        continue
      }
      if (productsBySku.has(sku)) {
        throw new BngProductOptionValidationError(
          `Multiple Medusa variants share normalized SKU ${sku}`
        )
      }
      productsBySku.set(sku, { product, variant })
    }
  }

  const b2bSkus = new Set(normalizedProducts.map(({ sku }) => sku))
  const proposedProductRemovals = currentProducts.filter(
    (product) =>
      !(product.variants ?? []).some((variant) =>
        b2bSkus.has(normalizeSku(variant.sku))
      )
  ).length
  const productRemovalFraction =
    proposedProductRemovals / Math.max(1, currentProducts.length)
  if (
    proposedProductRemovals > options.maxProductRemovals ||
    productRemovalFraction > options.maxProductRemovalFraction
  ) {
    throw new BngProductOptionValidationError(
      `${proposedProductRemovals} product removals exceeds the limit of ${options.maxProductRemovals} or fraction ${options.maxProductRemovalFraction}`
    )
  }

  const productChanges: ProductOptionChange[] = []
  const rejections: ProductOptionSyncPlan["rejections"] = []
  let productsUnchanged = 0
  let managedRemovals = 0
  for (const desired of normalizedProducts) {
    const current = productsBySku.get(desired.sku)
    if (!current) {
      rejections.push({
        sku: desired.sku,
        operation: "match-product",
        reason: "No Medusa variant has the normalized BNG SKU",
      })
      continue
    }

    const metadata = { ...(current.product.metadata ?? {}) }
    const managedState = getManagedState(metadata)
    const nextManagedState: ManagedState = { ...managedState }
    const associations = current.product.options ?? []
    const variantOptions = current.variant.options ?? []
    const desiredAssignments: DesiredAssignment[] = []
    const removals: PlannedRemoval[] = []
    let changed = false

    for (const [field, title] of BNG_PRODUCT_OPTION_FIELDS) {
      const desiredValue = desired.attributes[field]
      const globalOption = optionByField.get(field)
      const value = globalOption?.values.find(
        (candidate) => normalizeText(candidate.value) === desiredValue
      )
      const association = globalOption
        ? associations.find(({ id }) => id === globalOption.id)
        : undefined
      const managed = managedState[field]

      if (!desiredValue) {
        if (!managed) {
          continue
        }

        const managedAssociation = associations.find(
          ({ id }) => id === managed.option_id
        )
        const managedValueIsCurrent = variantOptions.some(
          (option) =>
            option.id === managed.value_id &&
            getVariantOptionId(option) === managed.option_id
        )
        const managedValueIsAssociated = managedAssociation?.values.some(
          ({ id }) => id === managed.value_id
        )
        if (managedAssociation && managedValueIsAssociated) {
          const otherValues = managedAssociation.values.filter(
            ({ id }) => id !== managed.value_id
          )
          removals.push({
            field,
            title,
            optionId: managed.option_id,
            valueId: managed.value_id,
            removeAssociation:
              managed.association_managed !== false && otherValues.length === 0,
            removeVariantAssignment: managedValueIsCurrent,
          })
          managedRemovals++
        }
        delete nextManagedState[field]
        changed = true
        continue
      }

      const conflictingAssociation = associations.find(
        (candidate) =>
          candidate.title.trim() === title && candidate.id !== globalOption?.id
      )
      if (conflictingAssociation && managed?.option_id !== conflictingAssociation.id) {
        rejections.push({
          sku: desired.sku,
          operation: `assign-${field}`,
          reason: `Product already has an unmanaged ${title} option`,
        })
        continue
      }

      if (!managed && association) {
        const manualVariantValue = variantOptions.find(
          (option) => getVariantOptionId(option) === association.id
        )
        if (manualVariantValue) {
          if (normalizeText(manualVariantValue.value) !== desiredValue) {
            rejections.push({
              sku: desired.sku,
              operation: `assign-${field}`,
              reason: `Product already has a manually assigned ${title} value`,
            })
          }
          continue
        }
      }

      desiredAssignments.push({
        field,
        title,
        value: desiredValue,
        variantTitle: globalOption?.title ?? title,
        variantValue: value?.value ?? desiredValue,
        optionId: globalOption?.id,
        valueId: value?.id,
        associationExists: !!association,
        associationManaged: managed
          ? managed.association_managed !== false
          : !association,
        associationUpdateRequired:
          !association ||
          !value ||
          (!!managed?.value_id && managed.value_id !== value.id),
        previousManagedValueId: managed?.value_id,
      })

      if (
        !hasSameAssignment(
          association,
          variantOptions,
          globalOption?.id,
          value?.id,
          managed,
          desiredValue
        )
      ) {
        changed = true
      }
    }

    if (!changed) {
      productsUnchanged++
      continue
    }

    const managedOptionIds = new Set([
      ...desiredAssignments.flatMap(({ optionId }) =>
        optionId ? [optionId] : []
      ),
      ...removals
        .filter(({ removeVariantAssignment }) => removeVariantAssignment)
        .map(({ optionId }) => optionId),
    ])
    const newManagedTitles = new Set(
      desiredAssignments
        .filter(({ optionId }) => !optionId)
        .map(({ title }) => title)
    )
    const preservedVariantOptions = Object.fromEntries(
      variantOptions
        .filter((option) => {
          const title = getVariantOptionTitle(option)
          const optionId = getVariantOptionId(option)
          return (
            !!title &&
            (!optionId || !managedOptionIds.has(optionId)) &&
            !newManagedTitles.has(title.trim())
          )
        })
        .map((option) => [getVariantOptionTitle(option)!, option.value])
    )

    productChanges.push({
      sku: desired.sku,
      productId: current.product.id,
      variantId: current.variant.id,
      metadata,
      desiredAssignments,
      removals,
      retainedOptionIds: associations
        .filter(
          (association) =>
            !removals.some(
              ({ optionId, removeAssociation }) =>
                removeAssociation && optionId === association.id
            )
        )
        .map(({ id }) => id),
      preservedVariantOptions,
      nextManagedState,
    })
  }

  const removalFraction = managedRemovals / Math.max(1, normalizedProducts.length)
  if (
    managedRemovals > options.maxRemovals ||
    removalFraction > options.maxRemovalFraction
  ) {
    throw new BngProductOptionValidationError(
      `${managedRemovals} managed removals exceeds the limit of ${options.maxRemovals} or fraction ${options.maxRemovalFraction}`
    )
  }

  return {
    normalizedProducts,
    optionDefinitionsToCreate,
    optionValuesToCreate,
    productChanges,
    rejections,
    summary: {
      sourceRows: sourceProducts.length,
      b2bRows: b2bProducts.length,
      duplicatesDeduplicated,
      productsUnchanged,
      managedRemovals,
      proposedProductRemovals,
    },
  }
}

const createSummary = (
  plan: ProductOptionSyncPlan,
  dryRun: boolean
): ProductOptionSyncSummary => ({
  dryRun,
  ...plan.summary,
  optionDefinitionsCreated: dryRun ? plan.optionDefinitionsToCreate.length : 0,
  optionValuesCreated: dryRun
    ? plan.optionValuesToCreate.length +
      plan.optionDefinitionsToCreate.reduce(
        (count, definition) => count + definition.values.length,
        0
      )
    : 0,
  productAssociationsUpdated: dryRun
    ? plan.productChanges.reduce(
        (count, change) =>
          count +
          change.desiredAssignments.filter(
            ({ associationUpdateRequired }) => associationUpdateRequired
          ).length,
        0
      )
    : 0,
  variantAssignmentsUpdated: dryRun ? plan.productChanges.length : 0,
  removals: dryRun ? plan.summary.managedRemovals : 0,
  rejections: plan.rejections,
  failures: [],
  proposed: {
    optionDefinitions: plan.optionDefinitionsToCreate,
    optionValues: plan.optionValuesToCreate,
    productAssociations: plan.productChanges.flatMap((change) =>
      change.desiredAssignments
        .filter(({ associationUpdateRequired }) => associationUpdateRequired)
        .map((assignment) => ({
          sku: change.sku,
          productId: change.productId,
          field: assignment.field,
          title: assignment.title,
          value: assignment.value,
        }))
    ),
    variantAssignments: plan.productChanges.map((change) => ({
      sku: change.sku,
      variantId: change.variantId,
      options: {
        ...change.preservedVariantOptions,
        ...Object.fromEntries(
          change.desiredAssignments.map(({ variantTitle, variantValue }) => [
            variantTitle,
            variantValue,
          ])
        ),
      },
    })),
    removals: plan.productChanges.flatMap((change) =>
      change.removals.map((removal) => ({
        ...removal,
        sku: change.sku,
        productId: change.productId,
      }))
    ),
  },
})

export async function applyBngProductOptions(
  plan: ProductOptionSyncPlan,
  dependencies: ProductOptionSyncDependencies,
  options: { dryRun: boolean }
): Promise<ProductOptionSyncSummary> {
  const summary = createSummary(plan, options.dryRun)
  if (options.dryRun) {
    return summary
  }

  for (const definition of plan.optionDefinitionsToCreate) {
    try {
      await dependencies.createOption({
        title: definition.title,
        values: definition.values,
        is_exclusive: false,
        metadata: { bng_managed: true, bng_field: definition.field },
      })
      summary.optionDefinitionsCreated++
      summary.optionValuesCreated += definition.values.length
    } catch (error) {
      summary.failures.push({
        operation: `create-option-${definition.field}`,
        reason: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const valuesByOptionId = new Map<string, string[]>()
  for (const value of plan.optionValuesToCreate) {
    const values = valuesByOptionId.get(value.optionId) ?? []
    values.push(value.value)
    valuesByOptionId.set(value.optionId, values)
  }
  for (const [optionId, values] of valuesByOptionId) {
    try {
      await dependencies.addOptionValues(optionId, values)
      summary.optionValuesCreated += values.length
    } catch (error) {
      summary.failures.push({
        operation: "create-option-values",
        reason: error instanceof Error ? error.message : String(error),
      })
    }
  }

  if (summary.failures.length) {
    return summary
  }

  const refreshedOptions = await dependencies.getOptions()
  const optionByTitle = new Map(
    refreshedOptions
      .filter(({ is_exclusive }) => is_exclusive === false)
      .map((option) => [option.title.trim(), option])
  )

  for (const change of plan.productChanges) {
    try {
      const nextManagedState: ManagedState = { ...change.nextManagedState }
      const variantOptions = { ...change.preservedVariantOptions }
      const nextOptionIds = new Set(change.retainedOptionIds)
      const resolvedAssignments: Array<{
        assignment: DesiredAssignment
        option: ProductOptionSnapshot
        value: ProductOptionValueSnapshot
      }> = []

      for (const assignment of change.desiredAssignments) {
        const option = optionByTitle.get(assignment.title)
        const value = option?.values.find(
          (candidate) => normalizeText(candidate.value) === assignment.value
        )
        if (!option || !value) {
          throw new Error(
            `Could not resolve ${assignment.title}=${assignment.value} after option creation`
          )
        }

        resolvedAssignments.push({ assignment, option, value })
        variantOptions[option.title] = value.value
        nextOptionIds.add(option.id)
        nextManagedState[assignment.field] = {
          option_id: option.id,
          value_id: value.id,
          value: assignment.value,
          association_managed: assignment.associationManaged,
        }
      }

      // Persist ownership before the association/variant mutation. If that later
      // mutation succeeds but the final metadata write fails, the next run can
      // still distinguish this assignment from pre-existing manual state.
      if (resolvedAssignments.length) {
        const preMutationState: ManagedState = {
          ...getManagedState(change.metadata),
          ...Object.fromEntries(
            resolvedAssignments.map(({ assignment, option, value }) => [
              assignment.field,
              {
                option_id: option.id,
                value_id: value.id,
                value: assignment.value,
                association_managed: assignment.associationManaged,
              },
            ])
          ),
        }
        await dependencies.updateProductMetadata(change.productId, {
          ...change.metadata,
          bng_product_options: preMutationState,
        })
      }

      for (const { assignment, option, value } of resolvedAssignments) {
        if (!assignment.associationExists) {
          await dependencies.addProductOption(change.productId, option.id, [value.id])
          summary.productAssociationsUpdated++
        } else if (assignment.associationUpdateRequired) {
          const remove =
            assignment.previousManagedValueId &&
            assignment.previousManagedValueId !== value.id
              ? [assignment.previousManagedValueId]
              : []
          await dependencies.updateProductOptionValues(
            change.productId,
            option.id,
            [value.id],
            remove
          )
          summary.productAssociationsUpdated++
        }
      }

      if (change.removals.some(({ removeAssociation }) => removeAssociation)) {
        await dependencies.replaceProductOptionsAndVariant(
          change.productId,
          [...nextOptionIds],
          change.variantId,
          variantOptions
        )
      } else {
        await dependencies.updateVariantOptions(change.variantId, variantOptions)
      }
      summary.variantAssignmentsUpdated++

      for (const removal of change.removals) {
        if (removal.removeAssociation) {
          summary.removals++
        } else {
          await dependencies.updateProductOptionValues(
            change.productId,
            removal.optionId,
            [],
            [removal.valueId]
          )
          summary.removals++
        }
      }

      const metadata = { ...change.metadata }
      if (Object.keys(nextManagedState).length) {
        metadata.bng_product_options = nextManagedState
      } else {
        delete metadata.bng_product_options
      }
      await dependencies.updateProductMetadata(change.productId, metadata)
    } catch (error) {
      summary.failures.push({
        sku: change.sku,
        operation: "reconcile-product-options",
        reason: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return summary
}
