import { MedusaService } from "@medusajs/framework/utils"
import { algoliasearch, SearchClient } from "algoliasearch"
import { AlgoliaModuleOptions, AlgoliaProductRecord } from "./types"

class AlgoliaModuleService extends MedusaService({}) {
  private client: SearchClient
  private productIndexName: string

  constructor(container: any, options?: AlgoliaModuleOptions) {
    super(container)
    
    if (!options?.appId || !options?.apiKey || !options?.productIndexName) {
      console.warn("Algolia configuration is missing, service will be disabled")
      return
    }

    this.client = algoliasearch(options.appId, options.apiKey)
    this.productIndexName = options.productIndexName
  }

  async saveProducts(products: AlgoliaProductRecord[]) {
    if (!this.client) {
      console.warn("Algolia client not initialized")
      return
    }
    return await this.client.saveObjects({
      indexName: this.productIndexName,
      objects: products as Record<string, unknown>[]
    })
  }

  async deleteProducts(productIds: string[]) {
    if (!this.client) {
      console.warn("Algolia client not initialized")
      return
    }
    return await this.client.deleteObjects({
      indexName: this.productIndexName,
      objectIDs: productIds
    })
  }

  async searchProducts(query: string, options?: any) {
    if (!this.client) {
      console.warn("Algolia client not initialized")
      return { results: [] }
    }
    return await this.client.search({
      requests: [{
        indexName: this.productIndexName,
        query: query,
        ...options
      }]
    })
  }

  async clearIndex() {
    if (!this.client) {
      console.warn("Algolia client not initialized")
      return
    }
    return await this.client.clearObjects({
      indexName: this.productIndexName
    })
  }
}

export default AlgoliaModuleService