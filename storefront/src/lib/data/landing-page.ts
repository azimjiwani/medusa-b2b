"use server"

import { sdk } from "@/lib/config"
import { LandingPageConfig, LandingSection } from "@/types/landing-page"
import { listProducts } from "./products"

export async function getLandingPage(): Promise<LandingPageConfig | null> {
  try {
    const { config } = await sdk.client.fetch<{ config: LandingPageConfig }>(
      "/store/landing-page",
      {
        method: "GET",
        cache: "force-cache",
        next: { revalidate: 30, tags: ["landing-page"] },
      }
    )
    return config
  } catch (error) {
    console.error("Unable to load landing page configuration", error)
    return null
  }
}

export async function getLandingProducts(
  section: LandingSection,
  countryCode: string
) {
  if (section.source === "selected" && !section.product_ids.length) return []
  if (section.source === "collection" && !section.collection_id) return []
  const limit = Math.min(12, Math.max(1, section.product_limit))
  const { response } = await listProducts({
    countryCode,
    queryParams: {
      limit,
      order: "-created_at",
      ...(section.source === "collection"
        ? { collection_id: [section.collection_id] }
        : {}),
      ...(section.source === "selected"
        ? { id: section.product_ids.slice(0, limit) }
        : {}),
    },
  })
  if (section.source !== "selected") return response.products
  const products = new Map(
    response.products.map((product) => [product.id, product])
  )
  return section.product_ids.slice(0, limit).flatMap((id) => {
    const product = products.get(id)
    return product ? [product] : []
  })
}
