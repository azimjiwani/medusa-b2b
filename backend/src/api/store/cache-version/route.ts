import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { getCacheVersion } from "../../../utils/cache-version";
import { CACHE_VERSION_MODULE } from "../../../modules/cache-version";

/**
 * GET /store/cache-version
 * Public endpoint that returns the current cache version
 * Used by the storefront to check if local cache should be cleared
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const cacheVersionService = req.scope.resolve(CACHE_VERSION_MODULE);
    const version = await getCacheVersion(cacheVersionService);
    return res.json({ version });
  } catch (error) {
    console.error("Error getting cache version:", error);
    return res.status(500).json({ message: "Failed to get cache version" });
  }
};
