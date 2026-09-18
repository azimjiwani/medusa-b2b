"use server"

import { sdk } from "@/lib/config"
import { getAuthHeaders, getCacheOptions } from "@/lib/data/cookies"
import { getRegion } from "@/lib/data/regions"
import { sortProducts } from "@/lib/util/sort-products"
import { sortFeaturedProducts } from "@/lib/util/sort-featured-products"
import { getFeaturedProductIds } from "./product-ranking"
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
    // Match categories: pick up values the daily BNG sync adds or retires
    // without waiting for a tag revalidation or a redeploy.
    revalidate: 60,
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

/**
 * Option value IDs carried by at least one variant of a product the storefront
 * can list. Menus use this to hide values that would filter to no results.
 */
export const listProductOptionValueIdsInUse = async (): Promise<
  Set<string>
> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("products")),
    // Match categories: pick up values the daily BNG sync adds or retires
    // without waiting for a tag revalidation or a redeploy.
    revalidate: 60,
  }

  const inUse = new Set<string>()
  const limit = 100
  let offset = 0
  let count = 0

  do {
    const response = await sdk.client.fetch<{
      products: Array<{
        id: string
        variants?: Array<{ options?: Array<{ id: string }> | null }> | null
      }>
      count: number
    }>(`/store/products`, {
      credentials: "include",
      method: "GET",
      query: { limit, offset, fields: "id,variants.options.id" },
      headers,
      next,
      cache: "force-cache",
    })
    for (const product of response.products) {
      for (const variant of product.variants ?? []) {
        for (const option of variant.options ?? []) {
          inUse.add(option.id)
        }
      }
    }
    count = response.count
    if (response.products.length === 0) {
      break
    }
    offset += response.products.length
  } while (offset < count)

  return inUse
}

/** BNG options restricted to values that currently match at least one product. */
export const listBngProductOptionsInUse = async (): Promise<
  StorefrontProductOption[]
> => {
  const [options, inUse] = await Promise.all([
    listBngProductOptions(),
    listProductOptionValueIdsInUse(),
  ])

  return options.flatMap((option) => {
    const values = option.values.filter(({ id }) => inUse.has(id))
    return values.length ? [{ ...option, values }] : []
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
  const _pageParam = Number.isFinite(pageParam)
    ? Math.max(Math.floor(pageParam), 1)
    : 1
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
    // Listings include prices and stock; do not retain cached pages indefinitely.
    revalidate: 60,
  }

  return sdk.client
    .fetch<{ products: HttpTypes.StoreProduct[]; count: number }>(
      `/store/products`,
      {
        credentials: "include",
        method: "GET",
        query: {
          region_id: region.id,
          fields: "*variants.calculated_price,*variants.inventory_quantity",
          ...queryParams,
          limit,
          offset,
        },
        headers,
        next,
        cache: "force-cache",
      }
    )
    .then(({ products, count }) => {
      const nextPage = count > offset + limit ? _pageParam + 1 : null

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
 * Use native pagination for newest-first and alphabetical listings. Medusa cannot order by
 * calculated price or curated rank, so those sorts use a lightweight, paginated index
 * and fetches full product details only for the requested page.
 */
export const listProductsWithSort = async ({
  page = 1,
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
  const pageNumber = Number.isFinite(page) ? Math.max(Math.floor(page), 1) : 1

  if (sortBy === "featured") {
    const categoryIds = queryParams?.category_id
    const featuredIds = await getFeaturedProductIds(
      typeof categoryIds === "string" ? [categoryIds] : categoryIds ?? []
    )
    if (featuredIds.length) {
      // Rank the complete matching ID index before paginating. Loading only
      // today's page would miss featured products on later pages.
      const index: HttpTypes.StoreProduct[] = []
      const indexPageSize = 100
      let indexPage = 1
      let count = 0
      do {
        const { response } = await listProducts({
          pageParam: indexPage,
          countryCode,
          queryParams: {
            ...queryParams,
            limit: indexPageSize,
            fields: "id,created_at",
            order: "id",
          },
        })
        count = response.count
        index.push(...response.products)
        if (!response.products.length) break
        indexPage += 1
      } while ((indexPage - 1) * indexPageSize < count)

      const offset = (pageNumber - 1) * limit
      const pageIds = sortFeaturedProducts(index, featuredIds)
        .slice(offset, offset + limit)
        .map((product) => product.id)
      let products: HttpTypes.StoreProduct[] = []
      if (pageIds.length) {
        const { response } = await listProducts({
          pageParam: 1,
          queryParams: { ...queryParams, id: pageIds, limit },
          countryCode,
        })
        const byId = new Map(
          response.products.map((product) => [product.id, product])
        )
        products = pageIds.flatMap((id) => {
          const product = byId.get(id)
          return product ? [product] : []
        })
      }
      return {
        response: { products, count },
        nextPage: count > offset + limit ? pageNumber + 1 : null,
        queryParams,
      }
    }
  }

  if (sortBy !== "price_asc" && sortBy !== "price_desc") {
    return listProducts({
      pageParam: pageNumber,
      queryParams: {
        ...queryParams,
        limit,
        order:
          sortBy === "title_asc"
            ? "title"
            : sortBy === "title_desc"
            ? "-title"
            : "-created_at",
      },
      countryCode,
    })
  }

  // Keep individual cache entries small and omit inventory, images, and other
  // product details from the scan. Preserve filters and customer pricing context.
  const pricePageSize = 100
  const priceIndex: HttpTypes.StoreProduct[] = []
  let pricePage = 1
  let count = 0

  do {
    const { response } = await listProducts({
      pageParam: pricePage,
      queryParams: {
        ...queryParams,
        limit: pricePageSize,
        order: "id",
        fields: "id,type_id,variants.id,*variants.calculated_price",
      },
      countryCode,
    })
    count = response.count
    priceIndex.push(...response.products)
    if (response.products.length === 0) {
      break
    }
    pricePage += 1
  } while ((pricePage - 1) * pricePageSize < count)

  const offset = (pageNumber - 1) * limit
  const pageIds = sortProducts(priceIndex, sortBy)
    .slice(offset, offset + limit)
    .map((product) => product.id)
  let products: HttpTypes.StoreProduct[] = []

  if (pageIds.length) {
    const { response } = await listProducts({
      pageParam: 1,
      queryParams: { ...queryParams, id: pageIds, limit },
      countryCode,
    })
    // The API does not preserve the order of the ID filter.
    const byId = new Map(
      response.products.map((product) => [product.id, product])
    )
    products = pageIds.flatMap((id) => {
      const product = byId.get(id)
      return product ? [product] : []
    })
  }

  return {
    response: {
      products,
      count,
    },
    nextPage: count > offset + limit ? pageNumber + 1 : null,
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

export const searchCatalogProducts = async ({
  searchQuery,
  page = 1,
  limit = 48,
  categoryIds = [],
  optionFilters = {},
  options,
  sortBy = "created_at",
  countryCode,
}: {
  searchQuery: string
  page?: number
  limit?: number
  categoryIds?: string[]
  optionFilters?: ProductOptionFilters
  options: StorefrontProductOption[]
  sortBy?: SortOptions
  countryCode: string
}): Promise<{ products: HttpTypes.StoreProduct[]; count: number }> => {
  if (!searchQuery.trim()) {
    return { products: [], count: 0 }
  }

  const region = await getRegion(countryCode)
  if (!region) {
    return { products: [], count: 0 }
  }

  const headers = {
    ...(await getAuthHeaders()),
  }
  const sanitizedFilters = sanitizeProductOptionFilters(optionFilters, options)
  const optionValueIds = Object.values(sanitizedFilters).flat()

  return sdk.client.fetch<{
    products: HttpTypes.StoreProduct[]
    count: number
  }>(`/store/catalog-search`, {
    credentials: "include",
    method: "GET",
    query: {
      q: searchQuery,
      limit,
      offset: (Math.max(page, 1) - 1) * limit,
      region_id: region.id,
      fields: "*variants.calculated_price,*variants.inventory_quantity",
      sortBy,
      ...(categoryIds.length ? { category_id: categoryIds } : {}),
      ...(optionValueIds.length ? { option_value_id: optionValueIds } : {}),
    },
    headers,
    cache: "no-store",
  })
}
