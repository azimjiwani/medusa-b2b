"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Fragment, useEffect, useRef, useState } from "react"

import SortProducts, { SortOptions } from "./sort-products"
import SearchInResults from "./search-in-results"
import { HttpTypes } from "@medusajs/types"
import ProductOptionFilters from "./product-option-filters"
import type { StorefrontProductOption } from "@/lib/data/products"
import {
  clearProductOptionFilterParams,
  readProductOptionFilters,
  updateProductOptionFilterParams,
} from "@/lib/util/product-option-filters"
import { getVisibleCategories } from "@/lib/util/category-filters"
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
  hideSearch = false,
  productOptions = [],
  categories = [],
  currentCategory,
}: RefinementListProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const desktopSidebar = useRef<HTMLElement>(null)
  const [sidebarTop, setSidebarTop] = useState(96)

  useEffect(() => {
    const sidebar = desktopSidebar.current
    if (!sidebar) return

    // Tall filters scroll with the page until their bottom is visible.
    // Shorter filters stay below the header, without an inner scrollbar.
    const updateSidebarTop = () => {
      setSidebarTop(
        Math.min(96, window.innerHeight - sidebar.offsetHeight - 16)
      )
    }
    const observer = new ResizeObserver(updateSidebarTop)
    observer.observe(sidebar)
    window.addEventListener("resize", updateSidebarTop)
    updateSidebarTop()
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", updateSidebarTop)
    }
  }, [])
  const selectedOptions = readProductOptionFilters(searchParams)
  const selectedCategories = [
    ...new Set(searchParams.getAll("category").filter(Boolean)),
  ]
  if (
    !selectedCategories.length &&
    pathname.split("/")[2] === "categories" &&
    currentCategory
  ) {
    selectedCategories.push(currentCategory.handle)
  }
  const pendingPathname = useRef(pathname)
  const pendingSearchParams = useRef(new URLSearchParams(searchParams))
  const serializedSearchParams = searchParams.toString()

  useEffect(() => {
    pendingSearchParams.current = new URLSearchParams(serializedSearchParams)
    pendingPathname.current = pathname
  }, [pathname, serializedSearchParams])

  const createQueryString = (name: string, value: string) => {
    const params = new URLSearchParams(pendingSearchParams.current)
    params.set(name, value)
    return params.toString()
  }

  const navigateWithParams = (
    params: URLSearchParams,
    targetPath = pendingPathname.current
  ) => {
    pendingSearchParams.current = params
    pendingPathname.current = targetPath
    const query = params.toString()
    router.push(`${targetPath}${query ? `?${query}` : ""}`)
  }

  const setQueryParams = (name: string, value: string) => {
    const params = new URLSearchParams(createQueryString(name, value))
    if (name === "sortBy") params.delete("page")
    navigateWithParams(params)
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

  const categoryTargetPath = () =>
    pathname.split("/")[2] === "categories"
      ? `/${pathname.split("/")[1]}/store`
      : pendingPathname.current

  const updateCategory = (handle: string, checked: boolean) => {
    const params = new URLSearchParams(pendingSearchParams.current)
    const handles = new Set(params.getAll("category").filter(Boolean))
    if (
      !handles.size &&
      pendingPathname.current.split("/")[2] === "categories" &&
      currentCategory
    ) {
      handles.add(currentCategory.handle)
    }
    if (checked) handles.add(handle)
    else handles.delete(handle)
    params.delete("category")
    for (const value of handles) params.append("category", value)
    params.delete("page")
    navigateWithParams(params, categoryTargetPath())
  }

  const clearOptions = () => {
    const params = clearProductOptionFilterParams(pendingSearchParams.current)
    params.delete("category")
    navigateWithParams(params, categoryTargetPath())
  }

  const filterPanel = (idPrefix: string) => (
    <div className="flex w-full flex-col gap-3">
      <div className="flex min-w-0 w-full flex-col gap-3 rounded-[24px] bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.035)]">
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
      </div>
      <ProductOptionFilters
        categories={getVisibleCategories(categories, selectedCategories)}
        selectedCategories={selectedCategories}
        onCategoryChange={updateCategory}
        options={productOptions}
        selected={selectedOptions}
        onChange={updateOption}
        onClear={clearOptions}
        idPrefix={idPrefix}
      />
    </div>
  )

  return (
    <>
      <aside
        ref={desktopSidebar}
        style={{ top: sidebarTop }}
        className="hidden w-1/5 flex-col gap-3 small:sticky small:flex small:self-start"
        aria-label="Catalog refinements"
        data-testid="desktop-refinement-list"
      >
        {filterPanel("desktop")}
      </aside>

      <div className="w-full small:hidden" data-testid="mobile-refinement-list">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.035)] px-4 py-3 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-fg-interactive"
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
                  className="flex h-full w-[min(94vw,24rem)] flex-col overflow-y-auto rounded-l-[28px] bg-[#f5f5f7] p-5 shadow-xl"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <Dialog.Title className="text-[24px] font-semibold tracking-tight text-[#1d1d1f]">
                      Filters
                    </Dialog.Title>
                    <button
                      type="button"
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e8e8ed] p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-fg-interactive"
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
