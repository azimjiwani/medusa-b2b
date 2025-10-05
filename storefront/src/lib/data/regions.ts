"use server"

import { sdk } from "@/lib/config"
import medusaError from "@/lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { getCacheOptions } from "./cookies"

export const listRegions = async (): Promise<HttpTypes.StoreRegion[]> => {
  const next = {
    ...(await getCacheOptions("regions")),
  }

  return sdk.client
    .fetch<{ regions: HttpTypes.StoreRegion[] }>(`/store/regions`, {
      method: "GET",
      next,
      cache: "force-cache",
    })
    .then(({ regions }: { regions: HttpTypes.StoreRegion[] }) => regions)
    .catch(medusaError)
}

export const retrieveRegion = async (
  id: string
): Promise<HttpTypes.StoreRegion> => {
  const next = {
    ...(await getCacheOptions(["regions", id].join("-"))),
  }

  return sdk.client
    .fetch<{ region: HttpTypes.StoreRegion }>(`/store/regions/${id}`, {
      method: "GET",
      next,
      cache: "force-cache",
    })
    .then(({ region }: { region: HttpTypes.StoreRegion }) => region)
    .catch(medusaError)
}

const regionMap = new Map<string, HttpTypes.StoreRegion>()

export const getRegion = async (
  countryCode: string
): Promise<HttpTypes.StoreRegion | null> => {
  try {
    if (regionMap.has(countryCode)) {
      return regionMap.get(countryCode) ?? null
    }

    const regions = await listRegions()

    if (!regions) {
      return null
    }

    regions.forEach((region) => {
      region.countries?.forEach((c) => {
        regionMap.set(c?.iso_2 ?? "", region)
      })
    })

    // Attempt direct match first
    let region = countryCode ? regionMap.get(countryCode) : undefined

    // If no direct match (e.g. locale 'en' that isn't a country code), try default region env or 'us'
    if (!region) {
      const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "us"
      region = regionMap.get(DEFAULT_REGION)
    }

    // As a final fallback pick the first region in the map
    if (!region) {
      const first = regionMap.values().next().value
      if (first) {
        region = first as HttpTypes.StoreRegion
      }
    }

    return region ?? null
  } catch (e: any) {
    return null
  }
}
