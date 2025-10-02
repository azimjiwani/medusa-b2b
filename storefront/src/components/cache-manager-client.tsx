"use client"

import { useEffect } from "react"
import { checkAndClearCache } from "@/lib/cache-manager"

/**
 * Client component that checks and clears cache on mount
 * Add this to your root layout to automatically manage cache versions
 */
export function CacheManager() {
  useEffect(() => {
    console.log("[CacheManager] Component mounted - triggering cache check")
    // Call async function to check and clear cache
    checkAndClearCache().catch((error) => {
      console.error("[CacheManager] Error checking cache:", error)
    })
  }, [])

  return null
}
