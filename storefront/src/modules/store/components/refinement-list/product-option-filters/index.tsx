"use client"

import type { StorefrontProductOption } from "@/lib/data/products"
import type { ProductOptionFilters } from "@/lib/util/product-option-filters"
import { ChevronDown, XMarkMini } from "@medusajs/icons"

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
    <div
      className="flex min-w-0 flex-col rounded-[24px] bg-white px-5 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.035)]"
      data-testid={`${idPrefix}-product-option-filters`}
    >
      <div className="flex min-h-12 items-center justify-between gap-2">
        <h2 className="text-[15px] font-semibold tracking-tight text-[#1d1d1f]">
          Filter by
        </h2>
        {activeValues.length + unavailableCount > 0 && (
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#edf3fb] px-1.5 text-xs font-medium text-[#0066cc]">
            {activeValues.length + unavailableCount}
          </span>
        )}
      </div>
      {(activeValues.length > 0 || unavailableCount > 0) && (
        <div className="flex flex-col gap-2 border-t border-[#f0f0f2] pb-4 pt-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-[#86868b]">Selected</span>
            <button
              type="button"
              className="min-h-11 rounded-lg text-xs font-medium text-[#0066cc] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-fg-interactive"
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
                className="inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-xl bg-[#f5f5f7] px-3 py-2 text-xs text-[#515154] hover:bg-[#e8e8ed] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-fg-interactive"
                aria-label={`Remove ${option.title}: ${value.value}`}
                onClick={() => onChange(option.id, value.id, false)}
              >
                <span className="min-w-0 break-words text-left">
                  {option.title}: {value.value}
                </span>
                <XMarkMini
                  aria-hidden="true"
                  className="shrink-0 text-[#86868b]"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        {options.map((option) => {
          const selectedValues = selected[option.id] ?? []

          return (
            <details
              key={option.id}
              open={selectedValues.length > 0}
              className="group/filter border-t border-[#f0f0f2]"
            >
              <summary className="flex min-h-[54px] cursor-pointer list-none items-center justify-between gap-3 rounded-lg py-3 text-[13px] font-medium text-[#515154] transition-colors hover:text-[#1d1d1f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066cc] [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 break-words">{option.title}</span>
                <span className="flex shrink-0 items-center gap-2">
                  {selectedValues.length > 0 && (
                    <span className="text-xs text-[#0066cc]">
                      {selectedValues.length}
                    </span>
                  )}
                  <ChevronDown
                    aria-hidden="true"
                    className="h-4 w-4 text-[#86868b] transition-transform duration-200 group-open/filter:rotate-180 motion-reduce:transition-none"
                  />
                </span>
              </summary>
              <fieldset className="flex max-h-64 min-w-0 flex-col gap-1 overflow-y-auto pb-3 small:max-h-none small:overflow-visible">
                <legend className="sr-only">Filter by {option.title}</legend>
                {option.values.map((value) => {
                  const checked = selectedValues.includes(value.id)

                  return (
                    <label
                      key={value.id}
                      className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-[13px] text-[#6e6e73] transition-colors hover:bg-[#f5f5f7] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ui-fg-interactive"
                    >
                      <span className="relative flex h-[18px] w-[18px] shrink-0 items-center justify-center">
                        <input
                          id={`${idPrefix}-${value.id}`}
                          type="checkbox"
                          checked={checked}
                          onChange={(event) =>
                            onChange(option.id, value.id, event.target.checked)
                          }
                          className="peer h-[18px] w-[18px] appearance-none rounded-[5px] border border-[#d2d2d7] bg-white checked:border-[#1d1d1f] checked:bg-[#1d1d1f]"
                          aria-label={`Filter by ${option.title}: ${value.value}`}
                        />
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 16 16"
                          fill="none"
                          className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100"
                        >
                          <path
                            d="m3.5 8 3 3 6-6"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <span className="min-w-0 break-words">{value.value}</span>
                    </label>
                  )
                })}
              </fieldset>
            </details>
          )
        })}
      </div>
    </div>
  )
}

export default ProductOptionFilters
