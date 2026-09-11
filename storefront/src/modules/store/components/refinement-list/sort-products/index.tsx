"use client"

import { ChevronUpDown } from "@medusajs/icons"

export type SortOptions =
  | "featured"
  | "price_asc"
  | "price_desc"
  | "created_at"
  | "title_asc"
  | "title_desc"

type SortProductsProps = {
  sortBy: SortOptions
  setQueryParams: (name: string, value: SortOptions) => void
  "data-testid"?: string
}

const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "title_asc", label: "Name: A–Z" },
  { value: "title_desc", label: "Name: Z–A" },
  {
    value: "created_at",
    label: "Latest Arrivals",
  },
  {
    value: "price_asc",
    label: "Price: low to high",
  },
  {
    value: "price_desc",
    label: "Price: high to low",
  },
]

const SortProducts = ({
  "data-testid": dataTestId,
  sortBy,
  setQueryParams,
}: SortProductsProps) => {
  const handleChange = (value: SortOptions) => {
    setQueryParams("sortBy", value)
  }

  return (
    <div className="flex min-w-0 flex-col gap-3 text-sm">
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#86868b]">
        Sort by
      </span>
      <div className="relative">
        <select
          className="min-h-11 w-full min-w-0 rounded-xl bg-[#f5f5f7] py-2 pl-3 pr-8 text-[13px] font-medium text-[#515154] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066cc] appearance-none"
          title="Sort by"
          value={sortBy}
          onChange={(e) => handleChange(e.target.value as SortOptions)}
          data-testid={dataTestId}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronUpDown className="w-4 h-4 text-neutral-500" />
        </div>
      </div>
    </div>
  )
}

export default SortProducts
