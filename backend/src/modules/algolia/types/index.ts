export interface AlgoliaModuleOptions {
  appId: string
  apiKey: string
  productIndexName: string
}

export interface AlgoliaProductRecord {
  objectID: string
  id: string
  title: string
  handle: string
  description: string | null
  thumbnail: string | null
  variant_count: number
  variants: any[]
  categories: any[]
  tags: any[]
  [key: string]: any
}