import { render, screen } from "@testing-library/react"
import type { ComponentProps, ReactNode } from "react"
import { describe, expect, it, vi } from "vitest"

import Hero from "."

vi.mock("embla-carousel-react", () => ({
  default: () => [vi.fn(), undefined],
}))

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    className,
  }: {
    src: string
    alt: string
    className?: string
  }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} />
  },
}))

vi.mock("next/link", () => ({
  default: ({
    children,
    ...props
  }: ComponentProps<"a"> & { children: ReactNode }) => (
    <a {...props}>{children}</a>
  ),
}))

vi.mock("@medusajs/icons", () => ({
  ChevronLeft: () => <span />,
  ChevronRight: () => <span />,
}))

describe("Hero", () => {
  it("preserves the full 16:9 banner artwork at mobile widths", () => {
    render(<Hero />)

    for (const image of screen.getAllByRole("img")) {
      expect(image.parentElement?.className).toContain("aspect-video")
      expect(image.parentElement?.className).not.toContain("h-[80vh]")
      expect(image.className).toContain("object-contain")
    }
  })
})
