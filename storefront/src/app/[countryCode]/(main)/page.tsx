import { listRegions } from "@/lib/data/regions"
import Hero from "@/modules/home/components/hero"
import NewlyAddedCarousel from "@/modules/home/components/newly-added-carousel"
import LandingSections from "@/modules/home/components/landing-sections"
import { getLandingPage } from "@/lib/data/landing-page"
import { Metadata } from "next"
import { Suspense } from "react"
import { retrieveCustomer } from "@/lib/data/customer"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"

export const dynamicParams = true

export const metadata: Metadata = {
  title: "Batteries N' Things",
  description:
    "Batteries N' Things provide premium technology products at the best prices in the country.",
}

export async function generateStaticParams() {
  const countryCodes = await listRegions().then(
    (regions) =>
      regions
        ?.map((r) => r.countries?.map((c) => c.iso_2))
        .flat()
        .filter(Boolean) as string[]
  )
  return countryCodes.map((countryCode) => ({ countryCode }))
}

export default async function Home({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  const [customer, landingPage] = await Promise.all([
    retrieveCustomer(),
    getLandingPage(),
  ])

  return (
    <div className="small:min-h-[calc(100svh-7rem)]">
      {landingPage?.hero_enabled !== false && (
        <Hero banners={landingPage?.banners} />
      )}
      <div className="flex justify-center bg-white px-6 py-8">
        <LocalizedClientLink
          href={landingPage?.explore_href || "/store"}
          className="flex items-center gap-x-2 text-[#0066cc] hover:underline text-base font-medium font-sans"
        >
          {landingPage?.explore_label || "Explore all products"}
          <span aria-hidden="true" className="text-xl">
            ↗
          </span>
        </LocalizedClientLink>
      </div>
      {landingPage ? (
        <LandingSections
          sections={landingPage.sections}
          countryCode={countryCode}
          customer={{
            isLoggedIn: !!customer,
            isApproved: !!customer?.metadata?.approved,
          }}
        />
      ) : (
        <Suspense fallback={null}>
          <NewlyAddedCarousel countryCode={countryCode} customer={customer} />
        </Suspense>
      )}
    </div>
  )
}
export const dynamic = "force-dynamic"
