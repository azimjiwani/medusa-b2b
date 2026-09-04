import type { HttpTypes } from "@medusajs/types"

export const PRODUCT_OPTION_FILTER_PARAM = "option"

export const BNG_PRODUCT_OPTION_DEFINITIONS = [
  { field: "brand", title: "Brand" },
  { field: "device", title: "Device" },
  { field: "capacity", title: "Capacity" },
  { field: "memory", title: "Memory" },
  { field: "color", title: "Color" },
  { field: "length", title: "Length" },
  { field: "material", title: "Material" },
  { field: "watts", title: "Watts" },
] as const

export const BNG_PRODUCT_OPTION_TITLES = BNG_PRODUCT_OPTION_DEFINITIONS.map(
  ({ title }) => title
)

export type ProductOptionFilters = Record<string, string[]>

export type FilterOption = Pick<
  HttpTypes.StoreProductOption,
  "id" | "title"
> & {
  values?: Array<Pick<HttpTypes.StoreProductOptionValue, "id" | "value">>
}

const decodeFilter = (encoded: string) => {
  const separator = encoded.indexOf(":")

  if (separator < 1 || separator === encoded.length - 1) {
    return null
  }

  return {
    optionId: encoded.slice(0, separator),
    valueId: encoded.slice(separator + 1),
  }
}

export const parseProductOptionFilters = (
  values: string | string[] | undefined
): ProductOptionFilters => {
  const filters: ProductOptionFilters = {}

  for (const encoded of typeof values === "string" ? [values] : values ?? []) {
    const decoded = decodeFilter(encoded)

    if (!decoded) {
      continue
    }

    const selected = filters[decoded.optionId] ?? []
    if (!selected.includes(decoded.valueId)) {
      filters[decoded.optionId] = [...selected, decoded.valueId]
    }
  }

  return filters
}

export const readProductOptionFilters = (
  searchParams: Pick<URLSearchParams, "getAll">
) => parseProductOptionFilters(searchParams.getAll(PRODUCT_OPTION_FILTER_PARAM))

export const sanitizeProductOptionFilters = (
  filters: ProductOptionFilters,
  options: FilterOption[]
): ProductOptionFilters => {
  const allowedValues = new Map(
    options.map((option) => [
      option.id,
      new Set((option.values ?? []).map((value) => value.id)),
    ])
  )

  return Object.fromEntries(
    Object.entries(filters).flatMap(([optionId, valueIds]) => {
      const allowed = allowedValues.get(optionId)
      const sanitized = allowed
        ? valueIds.filter((valueId) => allowed.has(valueId))
        : []

      return sanitized.length ? [[optionId, sanitized]] : []
    })
  )
}

export const updateProductOptionFilterParams = (
  current: URLSearchParams,
  optionId: string,
  valueId: string,
  selected: boolean
) => {
  const params = new URLSearchParams(current)
  const filters = readProductOptionFilters(params)
  const values = filters[optionId] ?? []
  const nextValues = selected
    ? [...new Set([...values, valueId])]
    : values.filter((id) => id !== valueId)

  if (nextValues.length) {
    filters[optionId] = nextValues
  } else {
    delete filters[optionId]
  }

  params.delete(PRODUCT_OPTION_FILTER_PARAM)
  params.delete("page")

  for (const [selectedOptionId, selectedValueIds] of Object.entries(filters)) {
    for (const selectedValueId of selectedValueIds) {
      params.append(
        PRODUCT_OPTION_FILTER_PARAM,
        `${selectedOptionId}:${selectedValueId}`
      )
    }
  }

  return params
}

export const clearProductOptionFilterParams = (current: URLSearchParams) => {
  const params = new URLSearchParams(current)
  params.delete(PRODUCT_OPTION_FILTER_PARAM)
  params.delete("page")
  return params
}
