import { ModuleRegistrationName } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { isB2bInventoryProduct } from "./steps/product-availability"
import {
  BngProductOptionValidationError,
  applyBngProductOptions,
  planBngProductOptions,
  type BngProductOptionPlanningOptions,
  type BngProductOptionSource,
  type BngProductSnapshot,
  type ProductOptionSnapshot,
  type ProductOptionSyncPlan,
  type ProductOptionSyncSummary,
} from "./bng-product-options"

type Environment = Record<string, string | undefined>

const nonNegativeNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

export const getBngProductOptionPlanningOptions = (
  env: Environment = process.env
): BngProductOptionPlanningOptions => ({
  minB2bProducts: nonNegativeNumber(
    env.BNG_SYNC_MIN_B2B_PRODUCTS,
    env.NODE_ENV === "production" ? 100 : 1
  ),
  maxRemovals: nonNegativeNumber(env.BNG_SYNC_MAX_OPTION_REMOVALS, 100),
  maxRemovalFraction: nonNegativeNumber(
    env.BNG_SYNC_MAX_OPTION_REMOVAL_FRACTION,
    0.25
  ),
  maxProductRemovals: nonNegativeNumber(env.BNG_SYNC_MAX_PRODUCT_REMOVALS, 100),
  maxProductRemovalFraction: nonNegativeNumber(
    env.BNG_SYNC_MAX_PRODUCT_REMOVAL_FRACTION,
    0.25
  ),
})

export const isBngProductOptionSyncEnabled = (
  env: Environment = process.env
) => env.BNG_PRODUCT_OPTIONS_SYNC_ENABLED === "true"

async function listAll(
  list: (skip: number, take: number) => Promise<unknown[]>
): Promise<unknown[]> {
  const result: unknown[] = []
  const take = 100
  for (let skip = 0; ; skip += take) {
    const page = await list(skip, take)
    result.push(...page)
    if (page.length < take) {
      return result
    }
  }
}

export async function loadBngProductOptionState(
  container: MedusaContainer
): Promise<{
  products: BngProductSnapshot[]
  options: ProductOptionSnapshot[]
}> {
  const productService = container.resolve(ModuleRegistrationName.PRODUCT) as any
  const [products, options] = await Promise.all([
    listAll((skip, take) =>
      productService.listProducts(
        {},
        {
          skip,
          take,
          relations: ["variants.options.option", "options.values"],
        }
      )
    ),
    listAll((skip, take) =>
      productService.listProductOptions(
        {},
        { skip, take, relations: ["values"] }
      )
    ),
  ])

  return {
    products: products as BngProductSnapshot[],
    options: options as ProductOptionSnapshot[],
  }
}

export async function prepareBngProductOptionSync(
  container: MedusaContainer,
  sourceProducts: BngProductOptionSource[],
  planningOptions = getBngProductOptionPlanningOptions()
): Promise<ProductOptionSyncPlan> {
  const state = await loadBngProductOptionState(container)
  return planBngProductOptions(
    sourceProducts,
    state.products,
    state.options,
    planningOptions
  )
}

export async function reconcileBngProductOptions(
  container: MedusaContainer,
  sourceProducts: BngProductOptionSource[],
  options: {
    dryRun: boolean
    plan?: ProductOptionSyncPlan
    planningOptions?: BngProductOptionPlanningOptions
  }
): Promise<ProductOptionSyncSummary> {
  const productService = container.resolve(ModuleRegistrationName.PRODUCT) as any
  let plan: ProductOptionSyncPlan
  try {
    plan =
      options.plan ??
      (await prepareBngProductOptionSync(
        container,
        sourceProducts,
        options.planningOptions
      ))
  } catch (error) {
    if (!(error instanceof BngProductOptionValidationError)) {
      throw error
    }

    return {
      dryRun: options.dryRun,
      sourceRows: sourceProducts.length,
      b2bRows: sourceProducts.filter(isB2bInventoryProduct).length,
      duplicatesDeduplicated: 0,
      optionDefinitionsCreated: 0,
      optionValuesCreated: 0,
      productAssociationsUpdated: 0,
      variantAssignmentsUpdated: 0,
      removals: 0,
      productsUnchanged: 0,
      rejections: [],
      failures: error.failures,
      proposed: {
        optionDefinitions: [],
        optionValues: [],
        productAssociations: [],
        variantAssignments: [],
        removals: [],
      },
    }
  }

  return applyBngProductOptions(
    plan,
    {
      createOption: (input) => productService.createProductOptions(input),
      addOptionValues: async (optionId, values) => {
        const option = await productService.retrieveProductOption(optionId, {
          relations: ["values"],
        })
        const existingValues = (option.values ?? []).map(
          ({ value }: { value: string }) => value
        )
        return productService.updateProductOptions(optionId, {
          values: [...new Set([...existingValues, ...values])],
        })
      },
      addProductOption: (productId, optionId, valueIds) =>
        productService.addProductOptionToProduct({
          product_id: productId,
          product_option_id: optionId,
          product_option_value_ids: valueIds,
        }),
      updateProductOptionValues: (productId, optionId, add, remove) =>
        productService.updateProductOptionValuesOnProduct({
          product_id: productId,
          product_option_id: optionId,
          add,
          remove,
        }),
      replaceProductOptionsAndVariant: (
        productId,
        optionIds,
        variantId,
        variantOptions
      ) =>
        productService.updateProducts(productId, {
          option_ids: optionIds,
          variants: [
            {
              id: variantId,
              options: variantOptions,
            },
          ],
        }),
      updateVariantOptions: (variantId, variantOptions) =>
        productService.updateProductVariants(variantId, {
          options: variantOptions,
        }),
      updateProductMetadata: (productId, metadata) =>
        productService.updateProducts(productId, { metadata }),
      getOptions: async () =>
        (
          await loadBngProductOptionState(container)
        ).options,
    },
    { dryRun: options.dryRun }
  )
}
