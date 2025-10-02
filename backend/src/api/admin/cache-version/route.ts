import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework";
import { getCacheVersion, incrementCacheVersion } from "../../../utils/cache-version";
import { CACHE_VERSION_MODULE } from "../../../modules/cache-version";

/**
 * GET /admin/cache-version
 * Returns the current cache version
 */
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  try {
    const cacheVersionService = req.scope.resolve(CACHE_VERSION_MODULE);
    const version = await getCacheVersion(cacheVersionService);
    return res.json({ version });
  } catch (error) {
    console.error("Error getting cache version:", error);
    return res.status(500).json({ message: "Failed to get cache version" });
  }
};

/**
 * POST /admin/cache-version
 * Increments the cache version
 */
export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  try {
    const cacheVersionService = req.scope.resolve(CACHE_VERSION_MODULE);
    const newVersion = await incrementCacheVersion(cacheVersionService);
    return res.json({
      version: newVersion,
      message: "Cache version updated successfully"
    });
  } catch (error) {
    console.error("Error updating cache version:", error);
    return res.status(500).json({ message: "Failed to update cache version" });
  }
};
