import { retrieveCustomer } from "@/lib/data/customer"
import { listRegions } from "@/lib/data/regions"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import Hero from "@/modules/home/components/hero"
import NewlyAddedCarousel from "@/modules/home/components/newly-added-carousel"
import { Metadata } from "next"
import { Suspense } from "react"

export const dynamicParams = true

export const metadata: Metadata = {
  title: "More Europe - B2B",
  description:
    "More Europe fornisce abbigliamento promozionale e da lavoro. Scopri il nostro catalogo di prodotti personalizzabili per la tua azienda.",
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

export default async function Home({ params: { countryCode } }: { params: { countryCode: string } }) {
  const customer = await retrieveCustomer()

  return (
    <div className="flex flex-col gap-y-8">
      <Hero />
      <Suspense fallback={null}>
        <NewlyAddedCarousel countryCode={countryCode} customer={customer} />
      </Suspense>
      <div className="flex justify-center mt-4">
        <LocalizedClientLink
          href="/store"
          className="flex items-center gap-x-2 text-blue-600 hover:text-blue-800 text-lg font-medium font-sans"
        >
          Explore all products
          <span aria-hidden="true" className="text-xl">↗</span>
        </LocalizedClientLink>
      </div>
      {/* <Suspense fallback={null}>
        <FeaturedProducts countryCode={countryCode} />
      </Suspense> */}
    </div>
  )
}
export const dynamic = "force-dynamic"
