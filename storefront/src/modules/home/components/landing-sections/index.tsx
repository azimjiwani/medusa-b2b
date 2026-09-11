import { Suspense } from "react"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { getLandingProducts } from "@/lib/data/landing-page"
import { LandingCard, LandingSection } from "@/types/landing-page"
import { MinimalCustomerInfo } from "@/types"
import ProductTile from "@/modules/products/components/product-tile"
import Tray from "./tray"

const tones = {
  silver: "bg-[#eeeeef]",
  blue: "bg-[#eaf1f9]",
  sand: "bg-[#f4efe7]",
  lavender: "bg-[#efedf8]",
}

function CardIllustration({ icon }: { icon: LandingCard["icon"] }) {
  return (
    <svg
      viewBox="0 0 160 160"
      fill="none"
      aria-hidden="true"
      className="h-40 w-40 text-[#515154]"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icon === "phone" && (
        <>
          <rect x="46" y="16" width="68" height="128" rx="14" fill="white" />
          <rect
            x="54"
            y="24"
            width="52"
            height="110"
            rx="8"
            fill="#d6e4f4"
            stroke="none"
          />
          <path d="M70 27h20M75 135h10" />
          <circle cx="80" cy="81" r="23" stroke="#9db9d7" />
        </>
      )}
      {icon === "sim" && (
        <>
          <path
            d="M48 22h44l28 28v76a12 12 0 0 1-12 12H48a12 12 0 0 1-12-12V34a12 12 0 0 1 12-12Z"
            fill="white"
          />
          <rect
            x="54"
            y="70"
            width="48"
            height="44"
            rx="8"
            fill="#e6d4ad"
            stroke="#b69d6d"
          />
          <path
            d="M70 70v44m16-44v44M54 85h16m16 0h16M54 99h16m16 0h16"
            stroke="#b69d6d"
            strokeWidth="2"
          />
        </>
      )}
      {icon === "power" && (
        <>
          <rect x="39" y="58" width="82" height="76" rx="19" fill="white" />
          <path d="M62 58V30m36 28V30" strokeWidth="8" />
          <path
            d="m85 75-17 25h16l-8 19 20-27H81z"
            fill="#c6b28e"
            stroke="none"
          />
        </>
      )}
      {icon === "headphones" && (
        <>
          <path
            d="M34 91V72a46 46 0 0 1 92 0v19"
            strokeWidth="10"
            stroke="#aba5c4"
          />
          <rect x="25" y="77" width="28" height="56" rx="13" fill="white" />
          <rect x="107" y="77" width="28" height="56" rx="13" fill="white" />
        </>
      )}
      {icon === "bag" && (
        <>
          <rect x="32" y="53" width="96" height="84" rx="12" fill="white" />
          <path d="M58 63V44a22 22 0 0 1 44 0v19" />
          <path d="m64 98 12 12 23-25" stroke="#8fa497" strokeWidth="5" />
        </>
      )}
    </svg>
  )
}

function SectionHeading({ section }: { section: LandingSection }) {
  return (
    <div className="mx-auto mb-7 flex max-w-[1344px] flex-col justify-between gap-5 px-6 small:flex-row small:items-end small:px-8">
      <div>
        {section.eyebrow && (
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#86868b]">
            {section.eyebrow}
          </p>
        )}
        <h2 className="max-w-4xl text-[30px] font-semibold leading-[1.12] tracking-[-0.035em] text-[#1d1d1f] small:text-[40px]">
          {section.title}
        </h2>
        {section.subtitle && (
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#6e6e73]">
            {section.subtitle}
          </p>
        )}
      </div>
      {section.link_label && section.link_href && (
        <LocalizedClientLink
          href={section.link_href}
          className="shrink-0 text-sm font-medium text-[#0066cc] hover:underline"
        >
          {section.link_label} <span aria-hidden="true">↗</span>
        </LocalizedClientLink>
      )}
    </div>
  )
}

async function ProductSection({
  section,
  countryCode,
  customer,
}: {
  section: LandingSection
  countryCode: string
  customer: MinimalCustomerInfo
}) {
  let products
  try {
    products = await getLandingProducts(section, countryCode)
  } catch (error) {
    console.error(`Unable to load home section ${section.id}`, error)
    return null
  }
  if (!products.length) return null
  return (
    <section aria-label={section.title} className="py-8 small:py-12">
      <SectionHeading section={section} />
      <Tray label={section.title}>
        {products.map((product) => (
          <li key={product.id} className="min-w-0 snap-start">
            <ProductTile product={product} customer={customer} variant="tray" />
          </li>
        ))}
      </Tray>
    </section>
  )
}

function LinkSection({ section }: { section: LandingSection }) {
  if (!section.cards.length) return null
  return (
    <section aria-label={section.title} className="py-8 small:py-12">
      <SectionHeading section={section} />
      <Tray label={section.title}>
        {section.cards.map((card) => (
          <li key={card.id} className="min-w-0 snap-start">
            <LocalizedClientLink
              href={card.href}
              className={`group flex h-full min-h-[380px] flex-col overflow-hidden rounded-[24px] p-7 transition-transform duration-300 hover:-translate-y-1 motion-reduce:transform-none ${
                tones[card.tone]
              }`}
            >
              <h3 className="text-[23px] font-semibold leading-tight tracking-tight text-[#1d1d1f]">
                {card.title}
              </h3>
              {card.description && (
                <p className="mt-2 text-sm leading-relaxed text-[#6e6e73]">
                  {card.description}
                </p>
              )}
              <div className="flex min-h-48 flex-1 items-center justify-center py-5">
                {/* CMS image URLs may use the merchant's own image host. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {card.image_url ? (
                  <img
                    src={card.image_url}
                    alt=""
                    loading="lazy"
                    className="h-44 w-full object-contain mix-blend-multiply"
                  />
                ) : (
                  <CardIllustration icon={card.icon} />
                )}
              </div>
              <span className="text-sm font-medium text-[#0066cc]">
                Explore <span aria-hidden="true">↗</span>
              </span>
            </LocalizedClientLink>
          </li>
        ))}
      </Tray>
    </section>
  )
}

export default function LandingSections({
  sections,
  countryCode,
  customer,
}: {
  sections: LandingSection[]
  countryCode: string
  customer: MinimalCustomerInfo
}) {
  return (
    <div className="bg-[#f5f5f7] pb-4 pt-4">
      {sections
        .filter((section) => section.enabled)
        .map((section) =>
          section.type === "links" ? (
            <LinkSection key={section.id} section={section} />
          ) : (
            <Suspense
              key={section.id}
              fallback={
                <section className="py-8 small:py-12">
                  <SectionHeading section={section} />
                  <div className="mx-6 h-[410px] animate-pulse rounded-[24px] bg-white" />
                </section>
              }
            >
              <ProductSection
                section={section}
                countryCode={countryCode}
                customer={customer}
              />
            </Suspense>
          )
        )}
    </div>
  )
}
