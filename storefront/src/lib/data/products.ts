"use server"

import { sdk } from "@/lib/config"
import { getAuthHeaders, getCacheOptions } from "@/lib/data/cookies"
import { getRegion } from "@/lib/data/regions"
import { sortProducts } from "@/lib/util/sort-products"
import {
  BNG_PRODUCT_OPTION_DEFINITIONS,
  FilterOption,
  ProductOptionFilters,
  sanitizeProductOptionFilters,
} from "@/lib/util/product-option-filters"
import type { SortOptions } from "@/modules/store/components/refinement-list/sort-products"
import { HttpTypes } from "@medusajs/types"

type StoreProductListQuery = HttpTypes.FindParams &
  HttpTypes.StoreProductListParams

export type StorefrontProductOption = FilterOption & {
  values: Array<Pick<HttpTypes.StoreProductOptionValue, "id" | "value">>
}

export const listBngProductOptions = async (): Promise<
  StorefrontProductOption[]
> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("products")),
  }

  const productOptions: HttpTypes.StoreProductOption[] = []
  const limit = 100
  let offset = 0
  let count = 0

  do {
    const response = await sdk.client.fetch<{
      product_options: HttpTypes.StoreProductOption[]
      count: number
    }>(`/store/product-options`, {
      credentials: "include",
      method: "GET",
      query: { limit, offset },
      headers,
      next,
      cache: "force-cache",
    })
    productOptions.push(...response.product_options)
    count = response.count
    if (response.product_options.length === 0) {
      break
    }
    offset += response.product_options.length
  } while (offset < count)

  const byField = new Map(
    productOptions
      .filter(
        (option) =>
          option.metadata?.bng_managed === true && option.values?.length
      )
      .map((option) => [option.metadata?.bng_field, option])
  )

  return BNG_PRODUCT_OPTION_DEFINITIONS.flatMap(({ field, title }) => {
    const option = byField.get(field)

    if (!option?.values?.length) {
      return []
    }

    return [
      {
        id: option.id,
        title,
        values: [...option.values]
          .map(({ id, value }) => ({ id, value }))
          .sort((left, right) => left.value.localeCompare(right.value)),
      },
    ]
  })
}

export const getProductsById = async ({
  ids,
  regionId,
}: {
  ids: string[]
  regionId: string
}) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("products")),
  }

  return sdk.client
    .fetch<{ products: HttpTypes.StoreProduct[] }>(`/store/products`, {
      credentials: "include",
      method: "GET",
      query: {
        id: ids,
        region_id: regionId,
        fields:
          "*variants,*variants.calculated_price,*variants.inventory_quantity",
      },
      headers,
      next,
      cache: "force-cache",
    })
    .then(({ products }) => products)
}

export const getProductByHandle = async (handle: string, regionId: string) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("products")),
  }

  return sdk.client
    .fetch<{ products: HttpTypes.StoreProduct[] }>(`/store/products`, {
      credentials: "include",
      method: "GET",
      query: {
        handle,
        region_id: regionId,
        fields:
          "*variants.calculated_price,+variants.inventory_quantity,+metadata,+tags",
      },
      headers,
      next,
      cache: "force-cache",
    })
    .then(({ products }) => products[0])
}

export const listProducts = async ({
  pageParam = 1,
  queryParams,
  countryCode,
}: {
  pageParam?: number
  queryParams?: StoreProductListQuery
  countryCode: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: StoreProductListQuery
}> => {
  const limit = queryParams?.limit || 12
  const _pageParam = Math.max(pageParam, 1)
  const offset = (_pageParam - 1) * limit
  const region = await getRegion(countryCode)

  if (!region) {
    return {
      response: { products: [], count: 0 },
      nextPage: null,
    }
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("products")),
  }

  return sdk.client
    .fetch<{ products: HttpTypes.StoreProduct[]; count: number }>(
      `/store/products`,
      {
        credentials: "include",
        method: "GET",
        query: {
          limit,
          offset,
          region_id: region.id,
          fields: "*variants.calculated_price,*variants.inventory_quantity",
          ...queryParams,
        },
        headers,
        next,
        cache: "force-cache",
      }
    )
    .then(({ products, count }) => {
      const nextPage = count > offset + limit ? pageParam + 1 : null

      return {
        response: {
          products,
          count,
        },
        nextPage: nextPage,
        queryParams,
      }
    })
}

/**
 * This will fetch all products to the Next.js cache and sort them based on the sortBy parameter.
 * It will then return the paginated products based on the page and limit parameters.
 */
export const listProductsWithSort = async ({
  page = 0,
  queryParams,
  sortBy = "created_at",
  countryCode,
}: {
  page?: number
  queryParams?: StoreProductListQuery
  sortBy?: SortOptions
  countryCode: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: StoreProductListQuery
}> => {
  const limit = queryParams?.limit || 12

  // First, get the total count with a minimal request
  const {
    response: { count },
  } = await listProducts({
    pageParam: 0,
    queryParams: {
      ...queryParams,
      limit: 1,
    },
    countryCode,
  })

  if (count === 0) {
    return {
      response: { products: [], count: 0 },
      nextPage: null,
      queryParams,
    }
  }

  // Then fetch all products based on the actual count
  const {
    response: { products },
  } = await listProducts({
    pageParam: 0,
    queryParams: {
      ...queryParams,
      limit: count, // Fetch all products based on actual count
    },
    countryCode,
  })

  const sortedProducts = sortProducts(products, sortBy)

  const pageParam = (page - 1) * limit

  const nextPage = count > pageParam + limit ? pageParam + limit : null

  const paginatedProducts = sortedProducts.slice(pageParam, pageParam + limit)

  return {
    response: {
      products: paginatedProducts,
      count,
    },
    nextPage,
    queryParams,
  }
}

export const listFilteredProducts = async ({
  page = 1,
  queryParams,
  optionFilters = {},
  options,
  sortBy = "created_at",
  countryCode,
}: {
  page?: number
  queryParams?: StoreProductListQuery
  optionFilters?: ProductOptionFilters
  options: StorefrontProductOption[]
  sortBy?: SortOptions
  countryCode: string
}): Promise<{
  products: HttpTypes.StoreProduct[]
  count: number
}> => {
  const sanitizedFilters = sanitizeProductOptionFilters(optionFilters, options)
  const optionValueIds = Object.values(sanitizedFilters).flat()

  if (Array.isArray(queryParams?.id) && queryParams.id.length === 0) {
    return { products: [], count: 0 }
  }

  const { response } = await listProductsWithSort({
    page,
    queryParams: {
      ...queryParams,
      ...(optionValueIds.length ? { option_value_id: optionValueIds } : {}),
    },
    sortBy,
    countryCode,
  })
  return response
}

interface SearchHit {
  id: string
  objectID?: string
}

export const searchProductIds = async (searchQuery: string) => {
  if (!searchQuery.trim()) {
    return []
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY) {
      headers["x-publishable-api-key"] =
        process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
    }

    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
      }/store/products/search?q=${encodeURIComponent(searchQuery)}&limit=1000`,
      {
        headers,
        cache: "no-store",
      }
    )

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    const hits = (data.results?.[0]?.hits || []) as SearchHit[]
    return hits.map((hit) => hit.objectID || hit.id)
  } catch (error) {
    console.error("Search error:", error)
    return []
  }
}
