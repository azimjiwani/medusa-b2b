import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ALGOLIA_MODULE } from "../../../../modules/algolia"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const algoliaService = req.scope.resolve(ALGOLIA_MODULE) as any
  const { q, limit, page, ...otherOptions } = req.query

  if (!q || typeof q !== 'string') {
    return res.status(400).json({
      error: "Query parameter 'q' is required"
    })
  }

  try {
    // Parse limit and page to numbers, with sensible defaults
    const hitsPerPage = limit ? Math.min(parseInt(limit as string), 1000) : 48 // Default to 48, max 1000
    const pageNumber = page ? parseInt(page as string) : 0

    const results = await algoliaService.searchProducts(q, {
      hitsPerPage: hitsPerPage,
      page: pageNumber,
      ...otherOptions
    })
    res.json(results)
  } catch (error) {
    res.status(500).json({
      error: "Search failed",
      message: error.message
    })
  }
}