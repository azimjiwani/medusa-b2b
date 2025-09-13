import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { ALGOLIA_MODULE } from "../modules/algolia"

type WorkflowInput = {
  productIds?: string[]
}

const prepareProductsForAlgoliaStep = createStep(
  "prepare-products-for-algolia",
  async ({ productIds }: WorkflowInput, { container }) => {
    const productModuleService = container.resolve(Modules.PRODUCT)
    
    const query: any = {
      relations: [
        "variants",
        "categories",
        "tags",
        "images",
      ],
    }

    if (productIds?.length) {
      query.id = productIds
    }

    const products = await productModuleService.listProducts(query)

    const algoliaProducts = products.map((product) => ({
      objectID: product.id,
      id: product.id,
      title: product.title,
      handle: product.handle,
      description: product.description,
      thumbnail: product.thumbnail,
      variant_count: product.variants?.length || 0,
      variants: product.variants?.map((variant) => ({
        id: variant.id,
        title: variant.title,
        sku: variant.sku,
      })) || [],
      categories: product.categories?.map((cat) => ({
        id: cat.id,
        name: cat.name,
        handle: cat.handle,
      })) || [],
      tags: product.tags?.map((tag) => ({
        id: tag.id,
        value: tag.value,
      })) || [],
    }))

    return new StepResponse(algoliaProducts)
  }
)

const syncProductsToAlgoliaStep = createStep(
  "sync-products-to-algolia",
  async (products: any[], { container }) => {
    const algoliaService = container.resolve(ALGOLIA_MODULE) as any
    
    if (products.length === 0) {
      return new StepResponse({ success: true, count: 0 })
    }

    const result = await algoliaService.saveProducts(products)
    
    return new StepResponse({
      success: true,
      count: products.length,
      result,
    })
  }
)

export const syncProductsToAlgoliaWorkflow = createWorkflow(
  "sync-products-to-algolia",
  (input: WorkflowInput) => {
    const products = prepareProductsForAlgoliaStep(input)
    const result = syncProductsToAlgoliaStep(products)
    
    return new WorkflowResponse(result)
  }
)