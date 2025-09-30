"use client"

import { useEffect } from "react"
import { checkAndClearCache } from "@/lib/cache-manager"

/**
 * Client component that checks and clears cache on mount
 * Add this to your root layout to automatically manage cache versions
 */
export function CacheManager() {
  useEffect(() => {
    checkAndClearCache()
  }, [])

  return null
}
