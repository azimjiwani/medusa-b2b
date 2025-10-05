"use server"

/**
 * Modalità dinamica vs statica per le regioni.
 * Se sono impostate le env FIXED_REGION_ID o FIXED_REGION_CODE si passa
 * automaticamente alla modalità "statica" evitando fetch e mapping inutili.
 * In caso contrario si mantiene il comportamento attuale (dinamico).
 */

import { sdk } from "@/lib/config"
import medusaError from "@/lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { getCacheOptions } from "./cookies"

const FIXED_REGION_ID = process.env.FIXED_REGION_ID
const FIXED_REGION_CODE = process.env.FIXED_REGION_CODE // iso_2 di uno dei paesi della regione

// --------------------------------------------------
// Implementazione dinamica (originale) incapsulata
// --------------------------------------------------

const dynamicRegionMap = new Map<string, HttpTypes.StoreRegion>()

const dynamicListRegions = async (): Promise<HttpTypes.StoreRegion[]> => {
  const next = { ...(await getCacheOptions("regions")) }
  return sdk.client
    .fetch<{ regions: HttpTypes.StoreRegion[] }>(`/store/regions`, {
      method: "GET",
      next,
      cache: "force-cache",
    })
    .then(({ regions }: { regions: HttpTypes.StoreRegion[] }) => regions)
    .catch(medusaError)
}

const dynamicRetrieveRegion = async (id: string): Promise<HttpTypes.StoreRegion> => {
  const next = { ...(await getCacheOptions(["regions", id].join("-"))) }
  return sdk.client
    .fetch<{ region: HttpTypes.StoreRegion }>(`/store/regions/${id}`, {
      method: "GET",
      next,
      cache: "force-cache",
    })
    .then(({ region }: { region: HttpTypes.StoreRegion }) => region)
    .catch(medusaError)
}

const dynamicGetRegion = async (countryCode: string): Promise<HttpTypes.StoreRegion | null> => {
  try {
    if (dynamicRegionMap.has(countryCode)) {
      return dynamicRegionMap.get(countryCode) ?? null
    }
    const regions = await dynamicListRegions()
    if (!regions) return null

    regions.forEach((region) => {
      region.countries?.forEach((c) => {
        if (c?.iso_2) dynamicRegionMap.set(c.iso_2, region)
      })
    })

    let region = countryCode ? dynamicRegionMap.get(countryCode) : undefined
    if (!region) {
      const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "us"
      region = dynamicRegionMap.get(DEFAULT_REGION)
    }
    if (!region) {
      const first = dynamicRegionMap.values().next().value
      if (first) region = first as HttpTypes.StoreRegion
    }
    return region ?? null
  } catch {
    return null
  }
}

// --------------------------------------------------
// Implementazione statica (fissa)
// --------------------------------------------------
let fixedRegionPromise: Promise<HttpTypes.StoreRegion> | null = null

const resolveFixedRegion = async (): Promise<HttpTypes.StoreRegion> => {
  if (fixedRegionPromise) return fixedRegionPromise

  if (!FIXED_REGION_ID && !FIXED_REGION_CODE) {
    throw new Error("resolveFixedRegion chiamata senza configurazione fissa")
  }

  if (FIXED_REGION_ID) {
    fixedRegionPromise = (async () => {
      const next = { ...(await getCacheOptions(["regions", FIXED_REGION_ID].join("-"))) }
      return sdk.client
        .fetch<{ region: HttpTypes.StoreRegion }>(`/store/regions/${FIXED_REGION_ID}`, {
          method: "GET",
          next,
          cache: "force-cache",
        })
        .then(({ region }) => region)
        .catch(medusaError)
    })()
    return fixedRegionPromise
  }

  // Caso FIXED_REGION_CODE
  fixedRegionPromise = (async () => {
    const next = { ...(await getCacheOptions("regions")) }
    const regions = await sdk.client
      .fetch<{ regions: HttpTypes.StoreRegion[] }>(`/store/regions`, {
        method: "GET",
        next,
        cache: "force-cache",
      })
      .then(({ regions }) => regions)
      .catch(medusaError)

    const match = regions.find((r) => r.countries?.some((c) => c.iso_2 === FIXED_REGION_CODE))
    if (!match) {
      throw new Error(`Nessuna regione trovata per FIXED_REGION_CODE='${FIXED_REGION_CODE}'`)
    }
    return match
  })()
  return fixedRegionPromise
}

const staticListRegions = async (): Promise<HttpTypes.StoreRegion[]> => {
  return [await resolveFixedRegion()]
}

const staticRetrieveRegion = async (id: string): Promise<HttpTypes.StoreRegion> => {
  const region = await resolveFixedRegion()
  if (FIXED_REGION_ID && id !== FIXED_REGION_ID) {
    // Fail-fast: evita silenzio in caso di uso improprio
    throw new Error(`retrieveRegion: id '${id}' diverso da FIXED_REGION_ID '${FIXED_REGION_ID}' in modalità statica`)
  }
  return region
}

const staticGetRegion = async (_countryCode: string): Promise<HttpTypes.StoreRegion | null> => {
  try {
    return await resolveFixedRegion()
  } catch {
    return null
  }
}

// --------------------------------------------------
// Facciata (API pubblica invariata)
// --------------------------------------------------

const IS_STATIC = Boolean(FIXED_REGION_ID || FIXED_REGION_CODE)

export const listRegions = async (): Promise<HttpTypes.StoreRegion[]> =>
  IS_STATIC ? staticListRegions() : dynamicListRegions()

export const retrieveRegion = async (id: string): Promise<HttpTypes.StoreRegion> =>
  IS_STATIC ? staticRetrieveRegion(id) : dynamicRetrieveRegion(id)

export const getRegion = async (countryCode: string): Promise<HttpTypes.StoreRegion | null> =>
  IS_STATIC ? staticGetRegion(countryCode) : dynamicGetRegion(countryCode)

// Per debug rapido (opzionale):
// console.log(`[regions] mode=${IS_STATIC ? 'static' : 'dynamic'}`)
