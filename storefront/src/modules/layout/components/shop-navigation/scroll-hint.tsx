"use client"

import { useCallback, useEffect, useState, type RefObject } from "react"
import { ChevronDown } from "@medusajs/icons"

/**
 * Tracks whether a scrollable element has more content below the fold.
 * Recomputes on scroll, on resize, and whenever `deps` change (e.g. the
 * list contents are swapped without remounting the element).
 */
export function useHasMoreBelow(
  ref: RefObject<HTMLElement | null>,
  deps: unknown[] = []
) {
  const [hasMore, setHasMore] = useState(false)
  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    setHasMore(el.scrollHeight - el.scrollTop - el.clientHeight > 1)
  }, [ref])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    update()
    el.addEventListener("scroll", update, { passive: true })
    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(update)
        : null
    observer?.observe(el)
    return () => {
      el.removeEventListener("scroll", update)
      observer?.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, update, ...deps])

  return hasMore
}

/**
 * A fade plus a bouncing chevron pinned to the bottom of a scrollable list,
 * shown only while there is more content below. Purely decorative: it does
 * not intercept pointer events, so the row beneath it stays clickable.
 */
export default function ScrollHint({ visible }: { visible: boolean }) {
  return (
    <div
      aria-hidden="true"
      data-testid="scroll-hint"
      className={`pointer-events-none absolute inset-x-0 bottom-0 flex h-14 items-end justify-center bg-gradient-to-t from-white via-white/85 to-transparent pb-1 transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <span className="flex h-7 w-7 animate-bounce items-center justify-center rounded-full border border-black/5 bg-white text-[#86868b] shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
        <ChevronDown className="h-3.5 w-3.5" />
      </span>
    </div>
  )
}
