import { SUPPORTED_LOCALES } from "@/i18n/config"
import { retrieveCustomer } from "@/lib/data/customer"
import { listRegions } from "@/lib/data/regions"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import Hero from "@/modules/home/components/hero"
import NewlyAddedCarousel from "@/modules/home/components/newly-added-carousel"
import { Metadata } from "next"
import { Suspense } from "react"

export const dynamicParams = false // generiamo esplicitamente le combinazioni

export const metadata: Metadata = {
  title: "More Europe - B2B",
  description: "More Europe fornisce abbigliamento promozionale e da lavoro. Scopri il nostro catalogo di prodotti personalizzabili per la tua azienda.",
}

// Pre-generiamo tutte le combinazioni (region countryCode × lang supportata)
// In modalità regione fissa ci sarà una sola region => produce solo varianti lingua.
export async function generateStaticParams() {
  const regions = await listRegions().catch(() => [])
  const countryCodes = regions
    .map(r => r.countries?.map(c => c.iso_2).filter(Boolean) as string[])
    .flat()
    .filter((v, i, a) => a.indexOf(v) === i)

  // Se non troviamo regioni (caso degradato) evitiamo build rotta generando il default fallback
  const effectiveCountryCodes = countryCodes.length > 0 ? countryCodes : [process.env.NEXT_PUBLIC_DEFAULT_REGION || "it"]

  return effectiveCountryCodes.flatMap(cc =>
    SUPPORTED_LOCALES.map(lang => ({ countryCode: cc, lang }))
  )
}

interface PageParams {
  countryCode: string
  lang: string
}

export default async function Home({ params: { countryCode, lang } }: { params: PageParams }) {
  // countryCode = ISO2 regione; lang = locale UI
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
    </div>
  )
}
