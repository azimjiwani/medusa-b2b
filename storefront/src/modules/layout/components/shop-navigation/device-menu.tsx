"use client"

import { useEffect, useId, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "@medusajs/icons"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"

type DeviceItem = { id: string; label: string; href: string }

const DEVICE_BRANDS = ["Apple", "Google", "Samsung", "Other devices"] as const

function newestDeviceFirst(a: DeviceItem, b: DeviceItem) {
  // Shared compatibility labels (e.g. "iPhone 13/14") belong with their
  // newest generation. Device options have model names, not release dates.
  const generation = (label: string) =>
    Math.max(0, ...(label.match(/\d+/g) ?? []).map(Number))

  return (
    generation(b.label) - generation(a.label) ||
    b.label.localeCompare(a.label, undefined, {
      numeric: true,
      sensitivity: "base",
    })
  )
}

function deviceBrand(label: string) {
  const name = label.trim()
  if (/^(apple\b|iphone\b|ipad\b|ipod\b)/i.test(name)) return "Apple"
  if (/^(google\b|pixel\b)/i.test(name)) return "Google"
  // The catalog also uses model-only names, such as "A 06/A06s" and "S 24 Ultra".
  if (/^(samsung\b|galaxy\b|[as]\s*\d|z\s*(flip|fold)\b)/i.test(name)) {
    return "Samsung"
  }
  return "Other devices"
}

export default function DeviceMenu({
  items,
  onSelect,
  mobile = false,
}: {
  items: DeviceItem[]
  onSelect: () => void
  mobile?: boolean
}) {
  const [activeBrand, setActiveBrand] = useState<string | null>(null)
  const root = useRef<HTMLDivElement>(null)
  const backButton = useRef<HTMLButtonElement>(null)
  const previousBrand = useRef<string | null>(null)
  const id = useId()

  useEffect(() => {
    if (mobile) {
      if (root.current?.parentElement) root.current.parentElement.scrollTop = 0
      if (activeBrand) {
        backButton.current?.focus({ preventScroll: true })
      } else if (previousBrand.current) {
        root.current
          ?.querySelector<HTMLButtonElement>(
            `button[data-device-brand="${previousBrand.current}"]`
          )
          ?.focus({ preventScroll: true })
      }
    }
    previousBrand.current = activeBrand
  }, [activeBrand, mobile])
  const brandId = (brand: string) => `${id}-${brand.replace(/\s+/g, "-")}`
  const groups = DEVICE_BRANDS.map((brand) => ({
    brand,
    devices: items
      .filter((item) => deviceBrand(item.label) === brand)
      .sort(newestDeviceFirst),
  })).filter(({ devices }) => devices.length)
  const activeGroup = groups.find(({ brand }) => brand === activeBrand)

  return (
    <div
      ref={root}
      className={
        mobile
          ? "min-w-0"
          : "grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-3"
      }
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !activeBrand) return
        event.stopPropagation()
        if (!mobile) {
          root.current
            ?.querySelector<HTMLButtonElement>('button[aria-expanded="true"]')
            ?.focus()
        }
        setActiveBrand(null)
      }}
    >
      {(!mobile || !activeGroup) && (
        <ul className="space-y-1">
          {groups.map(({ brand }) => (
            <li key={brand}>
              <button
                type="button"
                data-device-brand={brand}
                id={`${brandId(brand)}-trigger`}
                aria-expanded={activeBrand === brand}
                aria-controls={`${brandId(brand)}-devices`}
                onPointerEnter={(event) => {
                  if (!mobile && event.pointerType === "mouse")
                    setActiveBrand(brand)
                }}
                onFocus={() => {
                  if (!mobile) setActiveBrand(brand)
                }}
                onClick={() => setActiveBrand(brand)}
                className={`flex min-h-12 w-full items-center justify-between gap-1 rounded-xl px-3 py-3 text-left text-[15px] small:min-h-11 small:py-2 small:text-[13px] font-medium transition-colors hover:bg-[#f5f5f7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066cc] ${
                  activeBrand === brand
                    ? "bg-[#f5f5f7] text-[#0066cc]"
                    : "text-[#515154]"
                }`}
              >
                {brand}
                <ChevronRight
                  aria-hidden="true"
                  className="h-3.5 w-3.5 shrink-0"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
      {activeGroup && (
        <div
          id={`${brandId(activeGroup.brand)}-devices`}
          role="region"
          aria-label={mobile ? activeGroup.brand : undefined}
          aria-labelledby={
            mobile ? undefined : `${brandId(activeGroup.brand)}-trigger`
          }
          className={
            mobile ? "min-w-0" : "min-w-0 border-l border-black/5 pl-3"
          }
        >
          {mobile && (
            <div className="sticky -top-3 z-10 mb-2 flex items-center justify-between border-b border-black/5 bg-white pb-2">
              <button
                ref={backButton}
                type="button"
                onClick={() => setActiveBrand(null)}
                className="flex min-h-12 items-center gap-2 rounded-xl px-3 text-sm font-medium text-[#0066cc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0066cc]"
              >
                <ChevronLeft aria-hidden="true" className="h-4 w-4" />
                All device brands
              </button>
              <span className="pr-3 text-sm font-semibold">
                {activeGroup.brand}
              </span>
            </div>
          )}
          <ul className="space-y-1 small:max-h-[min(60dvh,28rem)] small:overflow-y-auto">
            {activeGroup.devices.map((item) => (
              <li key={item.id}>
                <LocalizedClientLink
                  href={item.href}
                  prefetch={false}
                  onClick={onSelect}
                  className="flex min-h-12 items-center rounded-xl px-3 py-3 text-[15px] small:min-h-11 small:py-2 small:text-[13px] leading-snug text-[#515154] transition-colors hover:bg-[#f5f5f7] hover:text-[#0066cc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066cc]"
                >
                  <span className="break-words">{item.label}</span>
                </LocalizedClientLink>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
