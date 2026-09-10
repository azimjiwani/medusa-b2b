"use client"

import {
  Children,
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react"
import { ChevronLeft, ChevronRight } from "@medusajs/icons"

export default function Tray({
  children,
  label,
}: {
  children: ReactNode
  label: string
}) {
  const ref = useRef<HTMLUListElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)
  const [hasOverflow, setHasOverflow] = useState(false)
  const count = Math.max(1, Children.toArray(children).length)
  const columnWidth = (maximum: number) => {
    const columns = Math.min(count, maximum)
    return `calc((100% - ${(columns - 1) * 20}px) / ${columns})`
  }
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const update = () => {
      setHasOverflow(element.scrollWidth > element.clientWidth + 4)
      setCanPrev(element.scrollLeft > 4)
      setCanNext(
        element.scrollLeft + element.clientWidth < element.scrollWidth - 4
      )
    }
    const observer = new ResizeObserver(update)
    observer.observe(element)
    element.addEventListener("scroll", update, { passive: true })
    update()
    return () => {
      observer.disconnect()
      element.removeEventListener("scroll", update)
    }
  }, [children])
  const scroll = (direction: number) => {
    const element = ref.current
    if (!element) return
    element.scrollBy({
      left: direction * (element.clientWidth + 20),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    })
  }
  const buttonClass =
    "grid h-11 w-11 place-items-center rounded-full bg-[#e8e8ed] text-[#515154] transition-colors hover:bg-[#d9d9df] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066cc] disabled:opacity-30"
  return (
    <div className="relative mx-auto grid max-w-[1344px] grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-x-3 px-6 small:px-8">
      <ul
        ref={ref}
        aria-label={label}
        tabIndex={hasOverflow ? 0 : -1}
        style={
          {
            "--tray-two": columnWidth(2),
            "--tray-three": columnWidth(3),
            "--tray-four": columnWidth(4),
          } as CSSProperties
        }
        className="col-span-3 col-start-1 row-start-1 grid min-w-0 grid-flow-col auto-cols-[100%] snap-x snap-mandatory gap-5 overflow-x-auto pb-6 pt-2 outline-offset-4 xsmall:auto-cols-[var(--tray-two)] small:auto-cols-[var(--tray-three)] medium:auto-cols-[var(--tray-four)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </ul>
      {hasOverflow && (
        <>
          <button
            type="button"
            aria-label={`Previous ${label}`}
            disabled={!canPrev}
            onClick={() => scroll(-1)}
            className={`${buttonClass} col-start-1 row-start-2 large:absolute large:col-auto large:row-auto large:-left-5 large:top-[calc(50%_-_8px)] large:-translate-y-1/2`}
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            aria-label={`Next ${label}`}
            disabled={!canNext}
            onClick={() => scroll(1)}
            className={`${buttonClass} col-start-3 row-start-2 large:absolute large:col-auto large:row-auto large:-right-5 large:top-[calc(50%_-_8px)] large:-translate-y-1/2`}
          >
            <ChevronRight />
          </button>
        </>
      )}
    </div>
  )
}
