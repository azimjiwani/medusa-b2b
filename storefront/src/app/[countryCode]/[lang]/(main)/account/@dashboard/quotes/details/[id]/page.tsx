import { fetchQuote, fetchQuotePreview } from "@/lib/data/quotes"
import { notFound } from "next/navigation"
import QuoteDetails from "../../components/quote-details/index"

interface PageProps { params: { countryCode: string, lang: string, id: string } }

export default async function QuoteDetailsPage({ params }: PageProps) {
  const { quote } = await fetchQuote(params.id, {}).catch(() => ({ quote: null }))
  const { quote: { order_preview: quotePreview } = { order_preview: null } } = await fetchQuotePreview(params.id, {}).catch(() => ({ quote: { order_preview: null } }))

  if (!quote || !quotePreview) {
    notFound()
  }

  return <QuoteDetails quote={quote} preview={quotePreview} countryCode={params.countryCode} lang={params.lang} />
}
