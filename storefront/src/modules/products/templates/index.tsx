import ProductVariantsMatrix from "@/modules/products/components/product-variants-matrix"
import RelatedProducts from "@/modules/products/components/related-products"
import ProductInfo from "@/modules/products/templates/product-info"
import SkeletonRelatedProducts from "@/modules/skeletons/templates/skeleton-related-products"
import { B2BCustomer } from "@/types"
import { HttpTypes } from "@medusajs/types"
import { notFound } from "next/navigation"
import React, { Suspense } from "react"
import ProductFacts from "../components/product-facts"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  customer: B2BCustomer | null
}

// Mapping metadati -> etichette visualizzate (solo questi verranno mostrati)
// Chiave = chiave originale nel metadata del prodotto
// Valore = etichetta da mostrare nella tabella
const METADATA_MAP: Record<string, string> = {
  quality: "Quality",
  qualita: "Quality",
  tessuto: "Tessuto",
  fabric: "Tessuto",
  materiale: "Tessuto",
  material: "Tessuto",
  packaging: "Packaging",
  packaging_description: "Packaging",
  packaging_box: "Packaging Box",
  packaging_bag: "Packaging Bag",
  // Aggiungere qui ulteriori chiavi autorizzate
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  customer,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  const minimalCustomer = customer
    ? {
        isLoggedIn: true,
        isApproved: !!customer.metadata?.approved,
      }
    : { isLoggedIn: false, isApproved: false }

  // Filtra i metadati mantenendo solo quelli elencati nel mapping
  const originalMetadata = (product.metadata || {}) as Record<string, unknown>
  const filteredMetadata: Record<string, unknown> = {}
  Object.entries(originalMetadata).forEach(([key, value]) => {
    if (METADATA_MAP[key]) {
      filteredMetadata[METADATA_MAP[key]] = value // Usa etichetta mappata come nuova chiave
    }
  })

  // Cloniamo il prodotto sostituendo metadata con quello filtrato (le chiavi diventano etichette)
  const productForInfo: HttpTypes.StoreProduct = {
    ...product,
    metadata: filteredMetadata,
  }

  // ======= Estrazione colori e taglie per sezione riepilogo =======
  // Stessa logica concettuale della matrice: identificare option color / size da varianti
  const normalized = (s: string) => s.toLowerCase().trim()
  const COLOR_SYNONYMS = ["colore", "color", "colour", "couleur", "farbe"]
  const SIZE_SYNONYMS = ["taglia", "size", "talla", "taille", "größe", "misura"]

  const options = (product.options || []).filter(Boolean)
  const detectOption = (syns: string[]) =>
    options.find((o) => o?.title && syns.some((s) => normalized(o.title!).includes(s)))

  const colorOption = detectOption(COLOR_SYNONYMS)
  const sizeOption = detectOption(SIZE_SYNONYMS)

  const getOptionValue = (
    variant: NonNullable<HttpTypes.StoreProductVariant>,
    option?: HttpTypes.StoreProductOption | null
  ) => {
    if (!option) return undefined
    // variant.options può essere array o oggetto, riuso logica semplificata
    const vOptions = Array.isArray(variant.options)
      ? variant.options
      : variant.options && typeof variant.options === "object"
    ? Object.entries(variant.options as Record<string, string | null | undefined>)
      .filter(([, v]) => typeof v === "string" && !!v)
      .map(([k, v]) => ({ option_id: undefined, option: { id: undefined, title: k }, value: v as string }))
        : []
    const normalizedTarget = normalized(option.title || "")
    const match = (vOptions as any[]).find((opt) => {
      const title = opt.option?.title || ""
      return normalized(title) === normalizedTarget
    })
    return match?.value as string | undefined
  }

  const variantList = (product.variants || []).filter(Boolean)

  const colorValues = new Set<string>()
  const sizeValues = new Set<string>()
  variantList.forEach((variant) => {
    if (colorOption) {
      const cv = getOptionValue(variant, colorOption)
      if (cv) colorValues.add(cv)
    }
    if (sizeOption) {
      const sv = getOptionValue(variant, sizeOption)
      if (sv) sizeValues.add(sv)
    }
  })

  // Whitelist / ordine taglie (riuso dell'array del componente matrice)
  const SIZE_ORDER: string[] = [
    "XXS","XS","S","M","L","XL","XXL","3XL","4XL"
  ]
  const sizeOrderMap = new Map(SIZE_ORDER.map((s, i) => [s.toLowerCase(), i]))
  const orderedSizes = Array.from(sizeValues)
    .filter((s) => sizeOrderMap.has(s.toLowerCase()))
    .sort((a,b) => (sizeOrderMap.get(a.toLowerCase())! - sizeOrderMap.get(b.toLowerCase())!))

  const colorList = Array.from(colorValues)
    .sort((a,b) => a.localeCompare(b))

  const splitColorParts = (value: string) => value.split(/[-/]/).map(p => p.trim()).filter(Boolean)

  return (
    <div className="flex flex-col gap-y-10 my-6">
      {/* Sezione superiore: Immagini + Metadata (ProductInfo include tabella metadata) */}
      <div className="content-container" data-testid="product-container">
        <ProductInfo product={productForInfo} />
      </div>

      {/* Facts / informazioni aggiuntive */}
      <div className="content-container" data-testid="product-facts-container">
        <ProductFacts product={product} customer={customer} />
      </div>

      {/* Matrice varianti spostata sotto Caratteristiche + Colori/Taglie */}
      <div className="content-container" data-testid="variants-matrix-container">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Disponibilità varianti</h2>
        <ProductVariantsMatrix product={product} region={region} customer={customer} colorKey="Colore" sizeKey="Taglia" />
      </div>

      {/* Prodotti correlati */}
      <div className="content-container" data-testid="related-products-container">
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts
            product={product}
            countryCode={countryCode}
            customer={minimalCustomer}
          />
        </Suspense>
      </div>
    </div>
  )
}

export default ProductTemplate
