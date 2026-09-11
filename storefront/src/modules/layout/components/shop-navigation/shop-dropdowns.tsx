"use client"

import { useCallback, useEffect, useId, useRef, useState } from "react"
import { ChevronDown, XMark } from "@medusajs/icons"
import type { StorefrontProductOption } from "@/lib/data/products"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { PRODUCT_OPTION_FILTER_PARAM } from "@/lib/util/product-option-filters"
import DeviceMenu from "./device-menu"

const SHOP_GROUPS = ["Device", "Category", "Brand"] as const

type Props = {
  categories: { id: string; name: string; handle: string }[]
  options: StorefrontProductOption[]
}

export default function ShopDropdowns({ categories, options }: Props) {
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const lastPointer = useRef<string | null>(null)
  const navigation = useRef<HTMLElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const menuId = useId()
  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = null
  }, [])
  const close = useCallback(() => {
    cancelClose()
    setOpenMenu(null)
  }, [cancelClose])

  useEffect(() => {
    const media = window.matchMedia?.("(max-width: 1023px)")
    if (!media) return
    const update = () => setIsMobile(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  const closeFromButton = () => {
    navigation.current
      ?.querySelector<HTMLButtonElement>('button[aria-expanded="true"]')
      ?.focus()
    close()
  }

  useEffect(() => {
    const outsideClick = (event: PointerEvent) => {
      if (!navigation.current?.contains(event.target as Node)) close()
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      const nav = navigation.current
      // Return keyboard users to the trigger without stealing focus on hover.
      if (nav?.contains(document.activeElement)) {
        nav
          .querySelector<HTMLButtonElement>('button[aria-expanded="true"]')
          ?.focus()
      }
      close()
    }
    document.addEventListener("pointerdown", outsideClick)
    document.addEventListener("keydown", escape)
    return () => {
      cancelClose()
      document.removeEventListener("pointerdown", outsideClick)
      document.removeEventListener("keydown", escape)
    }
  }, [cancelClose, close])

  const menus = SHOP_GROUPS.map((title) => {
    const option = options.find((option) => option.title === title)
    const items =
      title === "Category"
        ? categories.map((category) => ({
            id: category.id,
            label: category.name,
            href: `/store?${new URLSearchParams({
              category: category.handle,
            })}`,
          }))
        : (option?.values ?? []).map((value) => ({
            id: value.id,
            label: value.value,
            href: `/store?${new URLSearchParams({
              [PRODUCT_OPTION_FILTER_PARAM]: `${option!.id}:${value.id}`,
            })}`,
          }))
    return {
      title,
      items: items.sort((a, b) => a.label.localeCompare(b.label)),
    }
  })

  return (
    <nav
      ref={navigation}
      aria-label="Shop navigation"
      className="relative flex w-full items-center justify-center gap-1 small:gap-2"
      onPointerEnter={cancelClose}
      onPointerLeave={(event) => {
        if (isMobile || event.pointerType !== "mouse") return
        cancelClose()
        // Allow the pointer to cross the small gap between trigger and panel.
        closeTimer.current = setTimeout(close, 180)
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) close()
      }}
    >
      {menus.map(({ title, items }) => {
        const open = openMenu === title
        const panelId = `${menuId}-${title}`
        return (
          <div
            key={title}
            className="flex flex-1 justify-center small:flex-none"
          >
            <button
              type="button"
              id={`${panelId}-trigger`}
              aria-label={`Shop by ${title}`}
              aria-expanded={open}
              aria-controls={panelId}
              onPointerEnter={(event) => {
                if (isMobile || event.pointerType !== "mouse") return
                cancelClose()
                setOpenMenu(title)
              }}
              onPointerDown={(event) => {
                lastPointer.current = event.pointerType
              }}
              onClick={() => {
                cancelClose()
                // A desktop click after hover keeps the revealed menu open.
                const mouseClick = !isMobile && lastPointer.current === "mouse"
                lastPointer.current = null
                setOpenMenu((current) =>
                  mouseClick ? title : current === title ? null : title
                )
              }}
              className={`flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[14px] small:w-auto font-medium tracking-tight transition-colors hover:bg-[#f5f5f7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066cc] small:px-3 small:text-[13px] ${
                open ? "bg-[#f5f5f7] text-[#0066cc]" : "text-[#515154]"
              }`}
            >
              <span className="text-left leading-tight">
                <span className="hidden text-[#86868b] small:inline small:text-[13px]">
                  Shop by{" "}
                </span>
                {title}
              </span>
              <ChevronDown
                aria-hidden="true"
                className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                  open ? "rotate-180" : ""
                }`}
              />
            </button>
            {open && (
              <div
                id={panelId}
                aria-labelledby={`${panelId}-trigger`}
                onPointerEnter={cancelClose}
                className="absolute -inset-x-3 top-full z-10 mt-1 flex max-h-[calc(100dvh-116px-env(safe-area-inset-bottom))] flex-col overflow-hidden rounded-b-2xl border border-black/5 bg-white shadow-[0_16px_48px_rgba(0,0,0,0.14)] small:inset-x-0 small:mt-2 small:max-h-[calc(100dvh-104px)] small:rounded-2xl"
              >
                <div className="flex shrink-0 items-center justify-between border-b border-black/5 px-4 py-1 small:border-0 small:px-6 small:pb-0 small:pt-4">
                  <h2 className="text-sm font-semibold text-[#1d1d1f] small:text-[11px] small:uppercase small:tracking-[0.12em] small:text-[#86868b]">
                    Shop by {title}
                  </h2>
                  <button
                    type="button"
                    aria-label="Close shop menu"
                    onClick={closeFromButton}
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-[#515154] hover:bg-[#f5f5f7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0066cc] small:hidden"
                  >
                    <XMark aria-hidden="true" className="h-5 w-5" />
                  </button>
                </div>
                <div className="min-h-0 overflow-y-auto overscroll-contain p-3 small:p-4">
                  {items.length && title === "Device" ? (
                    <DeviceMenu
                      items={items}
                      onSelect={close}
                      mobile={isMobile}
                    />
                  ) : items.length ? (
                    <ul className="grid grid-cols-1 gap-1 small:max-h-[min(60dvh,28rem)] small:grid-cols-2 small:overflow-y-auto">
                      {items.map((item) => (
                        <li key={item.id} className="min-w-0">
                          <LocalizedClientLink
                            href={item.href}
                            prefetch={false}
                            onClick={close}
                            className="flex min-h-12 items-center rounded-xl px-3 py-3 text-[15px] small:min-h-11 small:py-2 small:text-[13px] leading-snug text-[#515154] transition-colors hover:bg-[#f5f5f7] hover:text-[#0066cc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066cc]"
                          >
                            <span className="break-words">{item.label}</span>
                          </LocalizedClientLink>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-2 py-3 text-sm text-[#86868b]">
                      No options available.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}
