import { fetchQuotes } from "@/lib/data/quotes"
import { Heading } from "@medusajs/ui"
import QuotesOverview from "./components/quotes-overview/index"

export default async function Quotes({ params }: { params: { countryCode: string, lang: string } }) {
  const { quotes } = await fetchQuotes().catch(() => ({ quotes: [] as any[] }))

  return (
    <div className="w-full" data-testid="quotes-page-wrapper">
      <div className="mb-4">
        <Heading>Quotes</Heading>
      </div>
      <div>
        <QuotesOverview quotes={quotes || []} />
      </div>
    </div>
  )
}
