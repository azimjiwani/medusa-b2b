/**
 * Cache management utilities
 * Use sparingly - only when you need to force cache refresh
 */

const CACHE_VERSION_KEY = "app_cache_version"
const CURRENT_CACHE_VERSION = "1.0.0" // Increment this to force cache clear

export function checkAndClearCache() {
  if (typeof window === "undefined") return

  const storedVersion = localStorage.getItem(CACHE_VERSION_KEY)

  if (storedVersion !== CURRENT_CACHE_VERSION) {
    console.log("[Cache] Version mismatch. Clearing cache...")

    // Clear localStorage (except auth tokens)
    const keysToPreserve = ["medusa_auth", "medusa_region"]
    const preserve: Record<string, string | null> = {}

    keysToPreserve.forEach(key => {
      preserve[key] = localStorage.getItem(key)
    })

    localStorage.clear()

    // Restore preserved keys
    Object.entries(preserve).forEach(([key, value]) => {
      if (value) localStorage.setItem(key, value)
    })

    // Update cache version
    localStorage.setItem(CACHE_VERSION_KEY, CURRENT_CACHE_VERSION)

    console.log("[Cache] Cache cleared successfully")
  }
}

/**
 * Force clear all cache (use with caution)
 */
export function forceClearAllCache() {
  if (typeof window === "undefined") return

  // Clear localStorage
  localStorage.clear()

  // Clear sessionStorage
  sessionStorage.clear()

  // Clear cookies (optional - be careful with auth)
  // document.cookie.split(";").forEach(c => {
  //   document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
  // })

  console.log("[Cache] All cache cleared")
}

/**
 * Add cache-busting query param to URL
 */
export function addCacheBuster(url: string): string {
  if (!url) return url

  const separator = url.includes("?") ? "&" : "?"
  return `${url}${separator}v=${Date.now()}`
}
