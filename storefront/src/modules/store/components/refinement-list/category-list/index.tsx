"use client"

import type { HttpTypes } from "@medusajs/types"
import { ChevronDown } from "@medusajs/icons"

export type FilterCategory = Pick<
  HttpTypes.StoreProductCategory,
  "id" | "name" | "handle"
>

const CategoryList = ({
  categories,
  selected,
  onChange,
  idPrefix,
}: {
  categories: FilterCategory[]
  selected: string[]
  onChange: (handle: string, checked: boolean) => void
  idPrefix: string
}) => {
  if (!categories.length) return null

  const choices = [...categories].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <details className="group/filter border-t border-[#f0f0f2]">
      <summary className="flex min-h-[54px] cursor-pointer list-none items-center justify-between gap-3 rounded-lg py-3 text-[13px] font-medium text-[#515154] transition-colors hover:text-[#1d1d1f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066cc] [&::-webkit-details-marker]:hidden">
        <span>Category</span>
        <ChevronDown
          aria-hidden="true"
          className="h-4 w-4 text-[#86868b] transition-transform duration-200 group-open/filter:rotate-180 motion-reduce:transition-none"
        />
      </summary>
      <fieldset className="flex min-w-0 flex-col gap-1 pb-3">
        <legend className="sr-only">Filter by Category</legend>
        {choices.map((category) => (
          <label
            key={category.id}
            className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-[13px] text-[#6e6e73] transition-colors hover:bg-[#f5f5f7] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ui-fg-interactive"
          >
            <span className="relative flex h-[18px] w-[18px] shrink-0 items-center justify-center">
              <input
                type="checkbox"
                name={`${idPrefix}-category`}
                value={category.handle}
                checked={selected.includes(category.handle)}
                onChange={(event) =>
                  onChange(category.handle, event.target.checked)
                }
                className="peer h-[18px] w-[18px] appearance-none rounded-[5px] border border-[#d2d2d7] bg-white checked:border-[#1d1d1f] checked:bg-[#1d1d1f]"
                aria-label={`Filter by Category: ${category.name}`}
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
            <span className="min-w-0 break-words">{category.name}</span>
          </label>
        ))}
      </fieldset>
    </details>
  )
}

export default CategoryList
