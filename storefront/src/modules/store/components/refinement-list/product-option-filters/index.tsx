"use client"

import type { StorefrontProductOption } from "@/lib/data/products"
import type { ProductOptionFilters } from "@/lib/util/product-option-filters"
import { XMarkMini } from "@medusajs/icons"
import { Container } from "@medusajs/ui"

type ProductOptionFilterProps = {
  options: StorefrontProductOption[]
  selected: ProductOptionFilters
  onChange: (optionId: string, valueId: string, selected: boolean) => void
  onClear: () => void
  idPrefix: string
}

const ProductOptionFilters = ({
  options,
  selected,
  onChange,
  onClear,
  idPrefix,
}: ProductOptionFilterProps) => {
  const activeValues = options.flatMap((option) =>
    option.values
      .filter((value) => selected[option.id]?.includes(value.id))
      .map((value) => ({ option, value }))
  )
  const activeValueIds = new Set(activeValues.map(({ value }) => value.id))
  const unavailableCount = Object.values(selected)
    .flat()
    .filter((valueId) => !activeValueIds.has(valueId)).length

  if (!options.length && unavailableCount === 0) {
    return null
  }

  return (
    <Container
      className="flex flex-col divide-y divide-neutral-200 p-0"
      data-testid={`${idPrefix}-product-option-filters`}
    >
      {(activeValues.length > 0 || unavailableCount > 0) && (
        <div className="flex flex-col gap-2 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">Active filters</span>
            <button
              type="button"
              className="rounded text-xs text-neutral-500 hover:text-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-fg-interactive"
              onClick={onClear}
            >
              Clear all
            </button>
          </div>
          {unavailableCount > 0 && (
            <p className="text-xs text-neutral-500" role="status">
              {unavailableCount} unavailable filter
              {unavailableCount === 1 ? "" : "s"} can be cleared.
            </p>
          )}
          <div className="flex flex-wrap gap-2" aria-label="Active filters">
            {activeValues.map(({ option, value }) => (
              <button
                type="button"
                key={value.id}
                className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-1 text-xs hover:bg-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-fg-interactive"
                aria-label={`Remove ${option.title}: ${value.value}`}
                onClick={() => onChange(option.id, value.id, false)}
              >
                <span>
                  {option.title}: {value.value}
                </span>
                <XMarkMini aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        {options.map((option) => {
          const selectedValues = selected[option.id] ?? []

          return (
            <details key={option.id} open={selectedValues.length > 0}>
              <summary className="cursor-pointer select-none rounded px-3 py-3 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ui-fg-interactive">
                {option.title}
                {selectedValues.length > 0 && ` (${selectedValues.length})`}
              </summary>
              <fieldset className="flex flex-col gap-2 px-3 pb-3">
                <legend className="sr-only">Filter by {option.title}</legend>
                {option.values.map((value) => {
                  const checked = selectedValues.includes(value.id)

                  return (
                    <label
                      key={value.id}
                      className="flex cursor-pointer items-center gap-2 rounded text-sm text-neutral-600 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ui-fg-interactive"
                    >
                      <input
                        id={`${idPrefix}-${value.id}`}
                        type="checkbox"
                        checked={checked}
                        onChange={(event) =>
                          onChange(option.id, value.id, event.target.checked)
                        }
                        className="h-4 w-4 rounded border-neutral-300 text-ui-fg-interactive focus:ring-ui-fg-interactive"
                        aria-label={`Filter by ${option.title}: ${value.value}`}
                      />
                      <span>{value.value}</span>
                    </label>
                  )
                })}
              </fieldset>
            </details>
          )
        })}
      </div>
    </Container>
  )
}

export default ProductOptionFilters
