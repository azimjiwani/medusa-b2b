"use server"

import { sdk } from "@/lib/config"

type RankingConfig = {
  product_ids: string[]
  categories: { category_id: string; product_ids: string[] }[]
}

export async function getFeaturedProductIds(
  categoryIds: string[] = []
): Promise<string[]> {
  try {
    const { config } = await sdk.client.fetch<{ config: RankingConfig }>(
      "/store/product-ranking",
      {
        method: "GET",
        cache: "force-cache",
        next: { revalidate: 30, tags: ["product-ranking"] },
      }
    )
    const categories = [...new Set(categoryIds)]
    return categories.length === 1
      ? config.categories.find((item) => item.category_id === categories[0])
          ?.product_ids ?? []
      : config.product_ids
  } catch (error) {
    console.error("Unable to load product rankings", error)
    return []
  }
}
