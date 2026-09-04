"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Fragment, useEffect, useRef, useState } from "react"

import SortProducts, { SortOptions } from "./sort-products"
import { Container } from "@medusajs/ui"
import SearchInResults from "./search-in-results"
import { HttpTypes } from "@medusajs/types"
import CategoryList from "./category-list"
import ProductOptionFilters from "./product-option-filters"
import type { StorefrontProductOption } from "@/lib/data/products"
import {
  clearProductOptionFilterParams,
  readProductOptionFilters,
  updateProductOptionFilterParams,
} from "@/lib/util/product-option-filters"
import { Dialog, Transition } from "@headlessui/react"
import { Adjustments, XMark } from "@medusajs/icons"

type RefinementListProps = {
  sortBy: SortOptions
  listName?: string
  "data-testid"?: string
  categories?: HttpTypes.StoreProductCategory[]
  currentCategory?: HttpTypes.StoreProductCategory
  hideSearch?: boolean
  productOptions?: StorefrontProductOption[]
}

const RefinementList = ({
  sortBy,
  listName,
  "data-testid": dataTestId,
  categories,
  currentCategory,
  hideSearch = false,
  productOptions = [],
}: RefinementListProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const selectedOptions = readProductOptionFilters(searchParams)
  const pendingSearchParams = useRef(new URLSearchParams(searchParams))
  const serializedSearchParams = searchParams.toString()

  useEffect(() => {
    pendingSearchParams.current = new URLSearchParams(serializedSearchParams)
  }, [serializedSearchParams])

  const createQueryString = (name: string, value: string) => {
    const params = new URLSearchParams(pendingSearchParams.current)
    params.set(name, value)
    return params.toString()
  }

  const navigateWithParams = (params: URLSearchParams) => {
    pendingSearchParams.current = params
    const query = params.toString()
    router.push(`${pathname}${query ? `?${query}` : ""}`)
  }

  const setQueryParams = (name: string, value: string) => {
    navigateWithParams(new URLSearchParams(createQueryString(name, value)))
  }

  const updateOption = (
    optionId: string,
    valueId: string,
    selected: boolean
  ) => {
    navigateWithParams(
      updateProductOptionFilterParams(
        pendingSearchParams.current,
        optionId,
        valueId,
        selected
      )
    )
  }

  const clearOptions = () => {
    navigateWithParams(
      clearProductOptionFilterParams(pendingSearchParams.current)
    )
  }

  const filterPanel = (idPrefix: string) => (
    <div className="flex w-full flex-col gap-3">
      <Container className="flex w-full flex-col divide-y divide-neutral-200 p-0">
        {!hideSearch && <SearchInResults listName={listName} />}
        <SortProducts
          sortBy={sortBy}
          setQueryParams={setQueryParams}
          data-testid={
            idPrefix === "desktop"
              ? dataTestId
              : dataTestId
              ? `${dataTestId}-mobile`
              : undefined
          }
        />
      </Container>
      <ProductOptionFilters
        options={productOptions}
        selected={selectedOptions}
        onChange={updateOption}
        onClear={clearOptions}
        idPrefix={idPrefix}
      />
      {categories && (
        <CategoryList
          categories={categories}
          currentCategory={currentCategory}
        />
      )}
    </div>
  )

  return (
    <>
      <aside
        className="hidden w-1/5 flex-col gap-3 small:flex"
        aria-label="Catalog refinements"
        data-testid="desktop-refinement-list"
      >
        {filterPanel("desktop")}
      </aside>

      <div className="w-full small:hidden" data-testid="mobile-refinement-list">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-rounded border border-neutral-300 bg-white px-4 py-3 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-fg-interactive"
          onClick={() => setMobileFiltersOpen(true)}
          aria-expanded={mobileFiltersOpen}
          aria-controls="mobile-filter-drawer"
        >
          <Adjustments aria-hidden="true" />
          Filters
        </button>

        <Transition appear show={mobileFiltersOpen} as={Fragment}>
          <Dialog
            as="div"
            className="relative z-[75]"
            onClose={setMobileFiltersOpen}
          >
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
            </Transition.Child>

            <div className="fixed inset-0 flex justify-end">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-out duration-200"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in duration-150"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel
                  id="mobile-filter-drawer"
                  className="flex h-full w-[min(90vw,24rem)] flex-col overflow-y-auto bg-neutral-100 p-4 shadow-xl"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <Dialog.Title className="text-lg font-medium">
                      Filters
                    </Dialog.Title>
                    <button
                      type="button"
                      className="rounded p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-fg-interactive"
                      onClick={() => setMobileFiltersOpen(false)}
                      aria-label="Close filters"
                    >
                      <XMark aria-hidden="true" />
                    </button>
                  </div>
                  {filterPanel("mobile")}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition>
      </div>
    </>
  )
}

export default RefinementList
