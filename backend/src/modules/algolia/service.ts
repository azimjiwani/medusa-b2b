import { MedusaService } from "@medusajs/framework/utils"
import { algoliasearch, SearchClient } from "algoliasearch"
import { AlgoliaModuleOptions, AlgoliaProductRecord } from "./types"

class AlgoliaModuleService extends MedusaService({}) {
  private searchClient?: SearchClient
  private writeClient?: SearchClient
  private productIndexName: string

  constructor(container: any, options?: AlgoliaModuleOptions) {
    super(container)
    
    if (!options?.appId || !options?.productIndexName) {
      console.warn("Algolia configuration is missing, service will be disabled")
      return
    }

    this.productIndexName = options.productIndexName

    if (options.searchApiKey) {
      this.searchClient = algoliasearch(options.appId, options.searchApiKey)
    } else {
      console.warn("Algolia search key is missing, search will be disabled")
    }

    if (options.writeApiKey) {
      this.writeClient = algoliasearch(options.appId, options.writeApiKey)
    } else {
      console.warn("Algolia write key is missing, indexing will be disabled")
    }
  }

  async saveProducts(products: AlgoliaProductRecord[]) {
    if (!this.writeClient) {
      throw new Error("Algolia write client not initialized")
    }
    return await this.writeClient.saveObjects({
      indexName: this.productIndexName,
      objects: products as Record<string, unknown>[]
    })
  }

  async deleteProducts(productIds: string[]) {
    if (!this.writeClient) {
      throw new Error("Algolia write client not initialized")
    }
    return await this.writeClient.deleteObjects({
      indexName: this.productIndexName,
      objectIDs: productIds
    })
  }

  async searchProducts(query: string, options?: any) {
    if (!this.searchClient) {
      console.warn("Algolia search client not initialized")
      return { results: [] }
    }
    return await this.searchClient.search({
      requests: [{
        indexName: this.productIndexName,
        query: query,
        ...options
      }]
    })
  }

  async listIndexedObjectIds(): Promise<string[]> {
    if (!this.writeClient) {
      throw new Error("Algolia write client not initialized")
    }
    const objectIDs: string[] = []
    await this.writeClient.browseObjects<{ objectID: string }>({
      indexName: this.productIndexName,
      browseParams: { attributesToRetrieve: ["objectID"], hitsPerPage: 1000 },
      aggregator: (response) => {
        for (const hit of response.hits) {
          objectIDs.push(hit.objectID)
        }
      },
    })
    return objectIDs
  }

  async clearIndex() {
    if (!this.writeClient) {
      throw new Error("Algolia write client not initialized")
    }
    return await this.writeClient.clearObjects({
      indexName: this.productIndexName
    })
  }
}

export default AlgoliaModuleService
