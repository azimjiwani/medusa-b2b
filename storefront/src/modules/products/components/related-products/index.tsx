import { listProducts } from "@/lib/data/products"
import { getRegion } from "@/lib/data/regions"
import { SearchProduct } from "@/lib/search/itemsjs-search"
import SearchProductPreview from "@/modules/products/components/search-product-preview"
import { HttpTypes } from "@medusajs/types"
import { Heading } from "@medusajs/ui"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
  customer: any
}

export default async function RelatedProducts({
  product,
  countryCode,
  customer,
  maxProducts = 4,
}: RelatedProductsProps & { maxProducts?: number }) {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  // edit this function to define your related products logic
  // Estendiamo i parametri per includere campi non tipizzati nell'SDK corrente
  type ExtraQuery = HttpTypes.StoreProductParams & {
    tag_id?: string[]
    collection_id?: string[]
    is_giftcard?: boolean
  }
  const queryParams: ExtraQuery = {}
  if (region?.id) {
    queryParams.region_id = region.id
  }
  if (product.collection_id) {
    queryParams.collection_id = [product.collection_id]
  }
  if (product.tags) {
    queryParams.tag_id = product.tags
      .map((t) => t.id)
      .filter(Boolean) as string[]
  }
  queryParams.is_giftcard = false

  const products = await listProducts({
    queryParams,
    countryCode,
  }).then(({ response }) => {
    return response.products.filter(
      (responseProduct) => responseProduct.id !== product.id
    )
  })

  if (!products.length) {
    return null
  }
  if (products.length > maxProducts) {
    // esegui uno shuffle dell'array e prendi i primi maxProducts
    products.sort(() => 0.5 - Math.random())
    products.length = maxProducts
  }

  // Trasforma StoreProduct -> SearchProduct (solo campi usati da SearchProductPreview)
  const normalized = (s: string) => s.toLowerCase().trim()
  const COLOR_SYNONYMS = ["colore", "color", "colour", "couleur", "farbe"]
  const SIZE_SYNONYMS = ["taglia", "size", "talla", "taille", "größe", "misura"]

  const mapToSearchProduct = (p: HttpTypes.StoreProduct): SearchProduct => {
    // Estrai opzioni varianti per colori/taglie
    const options = (p.options || []).filter(Boolean)
    const detectOption = (syns: string[]) =>
      options.find((o) => o?.title && syns.some((s) => normalized(o.title!).includes(s)))
    const colorOption = detectOption(COLOR_SYNONYMS)
    const sizeOption = detectOption(SIZE_SYNONYMS)

    const colors = new Set<string>()
    const sizes = new Set<string>()
    ;(p.variants || []).forEach((v) => {
      if (!v) return
      const vOptions = Array.isArray(v.options)
        ? v.options
        : v.options && typeof v.options === "object"
        ? Object.entries(v.options as Record<string, string | null | undefined>)
            .filter(([, val]) => typeof val === "string" && !!val)
            .map(([k, val]) => ({ option: { title: k }, value: val as string }))
        : []
      const findValue = (optTitle?: string | null) => {
        if (!optTitle) return undefined
        const n = normalized(optTitle)
        const found = (vOptions as any[]).find(
          (o) => normalized(o.option?.title || "") === n
        )
        return found?.value as string | undefined
      }
      if (colorOption) {
        const cv = findValue(colorOption.title)
        if (cv) colors.add(cv)
      }
      if (sizeOption) {
        const sv = findValue(sizeOption.title)
        if (sv) sizes.add(sv)
      }
    })

    return {
      id: p.id,
      title: p.title || "",
      description: p.description || "",
      handle: p.handle || p.id,
      status: (p.status as string) || "active",
      outlet: Boolean((p.metadata as any)?.outlet),
      images: (p.images || []).map((img: any) => img?.url).filter(Boolean),
      tags: (p.tags || []).map((t: any) => t.value || t.id).filter(Boolean),
      colors: Array.from(colors),
      sizes: Array.from(sizes),
      metadata: {
        fabric: (p.metadata as any)?.fabric,
        quality: (p.metadata as any)?.quality,
        packaging_bag: (p.metadata as any)?.packaging_bag,
        packaging_box: (p.metadata as any)?.packaging_box,
        spree_product_id: (p.metadata as any)?.spree_product_id,
        spree_total_on_hand: (p.metadata as any)?.spree_total_on_hand,
      },
    }
  }

  const previewProducts: SearchProduct[] = products.map(mapToSearchProduct)

  return (
    <div className="flex flex-col gap-y-6 small:py-16 py-6 small:px-24 px-6 bg-neutral-50">
      <Heading level="h2" className="text-xl text-neutral-950 font-normal">
        Prodotti correlati
      </Heading>
      <ul className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-4">
        {previewProducts.map((p) => (
          <li key={p.id} className="h-full">
            <SearchProductPreview product={p} customer={customer} />
          </li>
        ))}
      </ul>
    </div>
  )
}
