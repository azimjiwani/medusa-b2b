"use client"

import useEmblaCarousel from "embla-carousel-react"
import { useCallback, useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "@medusajs/icons"
import {
  banners as defaultBanners,
  type Banner,
} from "@/modules/home/data/banners"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import HeroArtwork from "./artwork"

const Hero = ({
  banners: configuredBanners = defaultBanners,
}: {
  banners?: Banner[]
}) => {
  const banners = configuredBanners.filter((banner) => banner.enabled)
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: banners.length > 1 })
  const [selectedIndex, setSelectedIndex] = useState(0)

  const onSelect = useCallback(() => {
    if (emblaApi) setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on("select", onSelect)
    emblaApi.on("reInit", onSelect)
    return () => {
      emblaApi.off("select", onSelect)
      emblaApi.off("reInit", onSelect)
    }
  }, [emblaApi, onSelect])

  if (!banners.length) return null

  return (
    <section
      aria-label="Featured collections"
      aria-roledescription="carousel"
      className="mx-auto max-w-[1440px] px-4 pt-4 small:px-8 small:pt-6"
    >
      <div
        className="overflow-hidden rounded-[28px] small:rounded-[32px]"
        ref={emblaRef}
      >
        <div className="flex touch-pan-y">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${banners.length}: ${
                banner.eyebrow
              }`}
              aria-hidden={index !== selectedIndex}
              className="relative min-w-0 flex-[0_0_100%]"
              style={{ background: banner.background }}
            >
              <div className="flex min-h-[510px] flex-col px-7 pt-9 small:min-h-[clamp(400px,calc(100svh-20rem),640px)] small:flex-row small:items-center small:px-14 small:py-10">
                <div className="relative z-10 min-w-0 break-words small:w-[60%] small:shrink-0">
                  <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6e6e73] small:mb-5">
                    {banner.eyebrow}
                  </p>
                  <h2 className="break-words whitespace-pre-line text-[clamp(32px,10vw,40px)] font-semibold leading-[1.04] tracking-[-0.045em] text-[#1d1d1f] small:text-[clamp(44px,4.6vw,68px)]">
                    {banner.headline}
                  </h2>
                  <p className="mb-5 mt-4 max-w-[330px] text-[16px] leading-relaxed tracking-[-0.015em] text-[#6e6e73] small:mb-7 small:mt-5 small:max-w-none small:text-lg">
                    {banner.description}
                  </p>
                  <LocalizedClientLink
                    href={banner.link}
                    tabIndex={index === selectedIndex ? 0 : -1}
                    className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-full bg-[#1d1d1f] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#424245] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0066cc]"
                  >
                    <span className="min-w-0">{banner.action}</span>
                    <span className="shrink-0" aria-hidden="true">
                      ↗
                    </span>
                  </LocalizedClientLink>
                </div>
                <div className="pointer-events-none mx-auto -mt-1 h-[220px] min-[380px]:h-[245px] w-full max-w-[390px] small:absolute small:inset-y-3 small:right-5 small:my-auto small:h-[92%] small:w-[40%] small:max-w-none">
                  {banner.image_url ? (
                    // Merchants can use their own image host; do not restrict CMS URLs to Next image domains.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={banner.image_url}
                      alt={banner.image_alt || banner.headline}
                      loading={index === 0 ? "eager" : "lazy"}
                      className="h-full w-full object-contain p-4 small:p-6"
                    />
                  ) : (
                    <HeroArtwork kind={banner.artwork} />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {banners.length > 1 && (
        <div className="relative flex h-14 items-center justify-between small:justify-center">
          <div
            className="flex min-w-0 max-w-[calc(100%_-_6.5rem)] items-center gap-1 overflow-x-auto small:max-w-[calc(100%_-_14rem)]"
            aria-label="Choose a banner"
          >
            {banners.map((banner, index) => (
              <button
                key={banner.id}
                aria-label={`Go to banner ${index + 1}`}
                aria-current={index === selectedIndex ? "true" : undefined}
                onClick={() => emblaApi?.scrollTo(index)}
                className="flex h-11 min-w-11 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0066cc]"
              >
                <span
                  className={`h-[6px] rounded-full transition-all motion-reduce:transition-none ${
                    index === selectedIndex
                      ? "w-6 bg-[#515154]"
                      : "w-[6px] bg-[#d2d2d7]"
                  }`}
                />
              </button>
            ))}
          </div>
          <div className="flex shrink-0 gap-2 small:absolute small:right-0">
            <button
              aria-label="Previous banner"
              onClick={() => emblaApi?.scrollPrev()}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f5f5f7] text-[#515154] transition-colors hover:bg-[#e8e8ed] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0066cc]"
            >
              <ChevronLeft />
            </button>
            <button
              aria-label="Next banner"
              onClick={() => emblaApi?.scrollNext()}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f5f5f7] text-[#515154] transition-colors hover:bg-[#e8e8ed] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0066cc]"
            >
              <ChevronRight />
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

export default Hero
