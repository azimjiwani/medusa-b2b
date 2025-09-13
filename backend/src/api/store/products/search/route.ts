import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ALGOLIA_MODULE } from "../../../../modules/algolia"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const algoliaService = req.scope.resolve(ALGOLIA_MODULE) as any
  const { q, ...options } = req.query

  if (!q || typeof q !== 'string') {
    return res.status(400).json({
      error: "Query parameter 'q' is required"
    })
  }

  try {
    const results = await algoliaService.searchProducts(q, {
      hitsPerPage: options.limit || 20,
      page: options.page || 0,
      ...options
    })
    res.json(results)
  } catch (error) {
    res.status(500).json({
      error: "Search failed",
      message: error.message
    })
  }
}