/**
 * Cache management utilities
 * Use sparingly - only when you need to force cache refresh
 */

const CACHE_VERSION_KEY = "app_cache_version"

/**
 * Fetch the current cache version from the backend
 */
async function fetchBackendCacheVersion(): Promise<string | null> {
  try {
    const url = `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/cache-version`
    const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

    console.log("[Cache] Fetching cache version from:", url)
    console.log("[Cache] Using publishable key:", publishableKey ? `${publishableKey.substring(0, 10)}...` : "MISSING")

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": publishableKey,
      },
      credentials: "include", // Include cookies for CORS
    })

    console.log("[Cache] Response status:", response.status)
    console.log("[Cache] Response headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      console.error("[Cache] Failed to fetch cache version from backend:", response.status, response.statusText)
      const text = await response.text()
      console.error("[Cache] Response body:", text)
      return null
    }

    const data = await response.json()
    console.log("[Cache] Received version from backend:", data.version)
    return data.version
  } catch (error) {
    console.error("[Cache] Error fetching cache version:", error)
    return null
  }
}

/**
 * Check backend cache version and clear local cache if needed
 */
export async function checkAndClearCache() {
  console.log("[Cache] ========== Starting cache check ==========")

  if (typeof window === "undefined") {
    console.log("[Cache] Running on server, skipping cache check")
    return
  }

  console.log("[Cache] Running on client, proceeding with cache check")

  const backendVersion = await fetchBackendCacheVersion()

  // If we can't get the backend version, skip cache check
  if (!backendVersion) {
    console.log("[Cache] Could not fetch backend version, skipping cache check")
    return
  }

  const storedVersion = localStorage.getItem(CACHE_VERSION_KEY)
  console.log("[Cache] Stored version in localStorage:", storedVersion)
  console.log("[Cache] Backend version:", backendVersion)

  if (storedVersion !== backendVersion) {
    console.log(`[Cache] ⚠️  VERSION MISMATCH! Clearing cache...`)
    console.log(`[Cache] Stored: "${storedVersion}" | Backend: "${backendVersion}"`)

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

    // Update cache version to match backend
    localStorage.setItem(CACHE_VERSION_KEY, backendVersion)

    console.log("[Cache] ✅ Cache cleared successfully. Reloading page...")

    // Reload the page to ensure fresh data
    window.location.reload()
  } else {
    console.log(`[Cache] ✅ Cache version up to date (${backendVersion})`)
  }

  console.log("[Cache] ========== Cache check complete ==========")
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
