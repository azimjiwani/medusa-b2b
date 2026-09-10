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
 * calculated price, so price sorting uses a lightweight, paginated price index
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
  categoryId,
  optionFilters = {},
  options,
  sortBy = "created_at",
  countryCode,
}: {
  searchQuery: string
  page?: number
  limit?: number
  categoryId?: string
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
      ...(categoryId ? { category_id: [categoryId] } : {}),
      ...(optionValueIds.length ? { option_value_id: optionValueIds } : {}),
    },
    headers,
    cache: "no-store",
  })
}
