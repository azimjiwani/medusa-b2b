"use client"

import ColorImage from "@/modules/products/components/color-image"
import ImageGallery from "@/modules/products/components/image-gallery"
import { HttpTypes } from "@medusajs/types"
import { Heading } from "@medusajs/ui"
import { ReactNode, useMemo } from "react"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

type MetadataRow = { key: string; value?: string | number | null; content?: ReactNode }

const ProductInfo = ({ product }: ProductInfoProps) => {
  const metadata = (product.metadata || {}) as Record<string, unknown>

  const toDisplayString = (value: unknown): string | undefined => {
    if (typeof value === "string") {
      const trimmed = value.trim()
      return trimmed ? trimmed : undefined
    }
    if (typeof value === "number") return value.toString()
    if (Array.isArray(value)) {
      const parts = value
        .map((v) => toDisplayString(v))
        .filter((v): v is string => Boolean(v))
      return parts.length ? parts.join(", ") : undefined
    }
    return undefined
  }

  const rows: MetadataRow[] = useMemo(() => {
    const entries = Object.entries(metadata)
      .filter(([k]) => !k.startsWith("_") && !k.startsWith("internal"))
      .sort(([a], [b]) => a.localeCompare(b))
      .map<MetadataRow>(([key, value]) => ({ key, value: toDisplayString(value) }))

    if (entries.length === 0) {
      return [{ key: "Info", value: "Nessun metadata disponibile" }]
    }
    return entries
  }, [metadata])

  // ===== Estrazione colori e taglie =====
  const normalized = (s: string) => s.toLowerCase().trim()
  const COLOR_SYNONYMS = ["colore", "color", "colour", "couleur", "farbe"]
  const SIZE_SYNONYMS = ["taglia", "size", "talla", "taille", "größe", "misura"]

  const options = (product.options || []).filter(Boolean)
  const detectOption = (syns: string[]) =>
    options.find((o) => o?.title && syns.some((s) => normalized(o.title!).includes(s)))

  const colorOption = detectOption(COLOR_SYNONYMS)
  const sizeOption = detectOption(SIZE_SYNONYMS)

  const coerceVariantOptions = (variant: HttpTypes.StoreProductVariant) => {
    if (Array.isArray(variant.options)) return variant.options.filter(Boolean)
    if (variant.options && typeof variant.options === "object") {
      return Object.entries(variant.options as Record<string, string | null | undefined>)
        .filter(([, v]) => typeof v === "string" && !!v)
        .map(([k, v]) => ({ option_id: undefined, option: { id: undefined, title: k }, value: v as string }))
    }
    return []
  }

  const getOptionValue = (
    variant: HttpTypes.StoreProductVariant,
    option?: HttpTypes.StoreProductOption | null
  ) => {
    if (!option) return undefined
    const normalizedTarget = normalized(option.title || "")
    const vOptions = coerceVariantOptions(variant)
    const match = (vOptions as any[]).find((opt) => normalized(opt.option?.title || "") === normalizedTarget)
    return match?.value as string | undefined
  }

  const variants = (product.variants || []).filter(Boolean)
  const colorValues = new Set<string>()
  const sizeValues = new Set<string>()
  variants.forEach((v) => {
    if (colorOption) {
      const cv = getOptionValue(v, colorOption)
      if (cv) colorValues.add(cv)
    }
    if (sizeOption) {
      const sv = getOptionValue(v, sizeOption)
      if (sv) sizeValues.add(sv)
    }
  })

  const SIZE_ORDER: string[] = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"]
  const sizeOrderMap = new Map(SIZE_ORDER.map((s, i) => [s.toLowerCase(), i]))
  const orderedSizes = Array.from(sizeValues)
    .filter((s) => sizeOrderMap.has(s.toLowerCase()))
    .sort(
      (a, b) =>
        (sizeOrderMap.get(a.toLowerCase()) ?? 999) -
        (sizeOrderMap.get(b.toLowerCase()) ?? 999)
    )

  const colorList = Array.from(colorValues).sort((a, b) => a.localeCompare(b))
  const splitColorParts = (value: string) =>
    value.split(/[-/]/).map((p) => p.trim()).filter(Boolean)

  return (
    <div id="product-info" className="w-full">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2">
        {/* Colonna sinistra: immagini */}
        <div className="flex w-full flex-col gap-6">
          {product.images?.length ? (
            <ImageGallery product={product} />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center rounded-md border border-dashed border-gray-200 text-sm text-gray-500">
              Nessuna immagine disponibile
            </div>
          )}
        </div>
        {/* Colonna destra: titolo + tabella metadata */}
        <div className="flex w-full flex-col gap-6">
          <div>
            <Heading
              level="h1"
              className="text-3xl font-semibold text-ui-fg-base"
              data-testid="product-title"
            >
              {product.title}
            </Heading>
            {product.subtitle && (
              <p className="mt-2 text-base text-ui-fg-subtle whitespace-pre-line" data-testid="product-subtitle">
                {product.subtitle}
              </p>
            )}
            {product.description && (
              <p className="mt-4 text-sm leading-relaxed text-ui-fg-subtle" data-testid="product-description">
                {product.description}
              </p>
            )}
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Caratteristiche</h2>
            <div className="overflow-x-auto max-h-[420px]">
              <table className="min-w-full text-sm">

                <tbody>
                  {rows.map((row) => (
                    <tr key={row.key} className="odd:bg-white even:bg-gray-50 align-top">
                      <td className="px-3 py-2 font-medium text-gray-700 break-all border-b border-gray-100">
                        {row.key}
                      </td>
                      <td className="px-3 py-2 text-gray-900 break-words border-b border-gray-100">
                        {row.content || row.value || <span className="text-gray-400 italic">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Sezioni Colori (sopra) e Taglie (sotto) */}
            <div className="mt-8 flex flex-col gap-10">
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-700">Colori</h3>
                {colorList.length ? (
                  <div className="flex flex-wrap gap-3">
                    {colorList.map((c) => (
                      <div key={c} className="flex flex-col items-center gap-1 w-14">
                        <ColorImage
                          colors={splitColorParts(c)}
                          size={40}
                          showText={false}
                          alt={c}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-400">Nessun colore</p>
                )}
              </div>
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-700">Taglie</h3>
                {orderedSizes.length ? (
                  <div className="flex flex-wrap gap-2">
                    {orderedSizes.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-1 text-[10px] rounded-md border border-gray-200 bg-white text-gray-700"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-400">Nessuna taglia</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductInfo
