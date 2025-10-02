import { CACHE_VERSION_MODULE } from "../modules/cache-version";

const CACHE_VERSION_ID = "cv_default"; // We'll use a single row to store the version

/**
 * Get the current cache version from database
 */
export async function getCacheVersion(cacheVersionService: any): Promise<string> {
  try {
    // Try to retrieve existing cache version
    const cacheVersions = await cacheVersionService.listCacheVersions({
      id: CACHE_VERSION_ID,
    });

    if (cacheVersions && cacheVersions.length > 0) {
      return cacheVersions[0].version;
    }

    // If no cache version exists, create the initial one
    const newCacheVersion = await cacheVersionService.createCacheVersions({
      id: CACHE_VERSION_ID,
      version: "1.0.0",
    });

    return newCacheVersion.version;
  } catch (error) {
    console.error("Error reading cache version from database:", error);
    return "1.0.0";
  }
}

/**
 * Increment the cache version in database
 * Increments the patch version (e.g., 1.0.0 -> 1.0.1)
 */
export async function incrementCacheVersion(cacheVersionService: any): Promise<string> {
  try {
    const currentVersion = await getCacheVersion(cacheVersionService);
    const parts = currentVersion.split(".");

    // Increment the last part (patch version)
    const major = parseInt(parts[0] || "1", 10);
    const minor = parseInt(parts[1] || "0", 10);
    const patch = parseInt(parts[2] || "0", 10) + 1;

    const newVersion = `${major}.${minor}.${patch}`;

    // Update the cache version in database
    await cacheVersionService.updateCacheVersions({
      id: CACHE_VERSION_ID,
      version: newVersion,
    });

    console.log(`Cache version updated: ${currentVersion} -> ${newVersion}`);
    return newVersion;
  } catch (error) {
    console.error("Error incrementing cache version:", error);
    throw error;
  }
}

/**
 * Set a specific cache version in database
 */
export async function setCacheVersion(cacheVersionService: any, version: string): Promise<void> {
  try {
    await cacheVersionService.updateCacheVersions({
      id: CACHE_VERSION_ID,
      version,
    });
    console.log(`Cache version set to: ${version}`);
  } catch (error) {
    console.error("Error setting cache version:", error);
    throw error;
  }
}
