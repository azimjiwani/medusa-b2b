"use client"

// Nuova implementazione matrice variante (Colori x Taglie)
// Requisiti:
// 1. Matrice: colonne = taglie, righe = colori
// 2. Input disattivati se variante non disponibile -> mostra etichetta UNAVAILABLE_LABEL
// 3. Celle colorate in base a quantità disponibile (soglie configurabili)
// 4. Mostrare quantità disponibile nella cella
// 5. Prezzo nascosto

import { addToCartEventBus, AddToCartEventPayload } from "@/lib/data/cart-event-bus"
import Button from "@/modules/common/components/button"
import ShoppingBag from "@/modules/common/icons/shopping-bag"
import ColorImage from "@/modules/products/components/color-image"
import { B2BCustomer } from "@/types"
import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"
import { useCallback, useMemo, useState } from "react"

// ================== COSTANTI CONFIGURABILI ==================
const HIGH_STOCK_THRESHOLD = 50
const LOW_STOCK_THRESHOLD = 5
const UNAVAILABLE_LABEL = "In arrivo" // testo mostrato quando variante non disponibile

// Possibile futura configurazione per classi colore
const COLOR_CLASSES = {
  high: "bg-emerald-50", // > HIGH_STOCK_THRESHOLD
  medium: "bg-yellow-100", // >= LOW_STOCK_THRESHOLD
  low: "bg-red-100", // < LOW_STOCK_THRESHOLD e > 0
  none: "bg-gray-100", // 0 o non esistente
}

// Whitelist e ordinamento esplicito delle taglie da visualizzare.
// Solo le taglie presenti in questo array verranno mostrate e nell'ordine indicato.
// Modificare questo elenco per cambiare il set visibile.
const SIZE_ORDER: string[] = [
  "XXS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "3XL",
]

type Props = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  customer: B2BCustomer | null
  colorKey?: string
  sizeKey?: string
}

const ProductVariantsMatrix = ({
  product,
  region,
  customer,
  colorKey = "Color",
  sizeKey = "Size",
}: Props) => {
  // ============ GATE DI ACCESSO (login / approvazione) ============
  const isLoggedIn = !!customer
  const isApproved = !!customer?.metadata?.approved

  if (!isLoggedIn || !isApproved) {
    return (
      <div className="flex flex-col gap-6">
        <Text className="text-neutral-600 text-sm">
          {!isLoggedIn
            ? "Please log in to view products"
            : "Contact us for access"}
        </Text>
      </div>
    )
  }

  // ============ NORMALIZZAZIONE / UTIL ============
  const normalized = useCallback((s: string) => s.toLowerCase().trim(), [])

  type VariantOptionEntry = {
    option_id?: string | null
    option?: { id?: string | null; title?: string | null } | null
    value?: string | null
  }

  const coerceVariantOptions = useCallback(
    (variant: HttpTypes.StoreProductVariant): VariantOptionEntry[] => {
      if (Array.isArray(variant.options)) {
        return variant.options.filter(Boolean) as VariantOptionEntry[]
      }
      if (variant.options && typeof variant.options === "object") {
        return Object.entries(variant.options as Record<string, string | null | undefined>)
          .filter(
            (entry): entry is [string, string] =>
              typeof entry[1] === "string" && !!entry[1]
          )
          .map(([key, value]) => ({
            option_id: undefined,
            option: { id: undefined, title: key },
            value,
          }))
      }
      return []
    },
    []
  )

  const memoizedOptions = useMemo(
    () =>
      (product.options ?? []).filter(
        (option): option is NonNullable<typeof option> => Boolean(option)
      ),
    [product.options]
  )

  const productVariants = useMemo(
    () =>
      (product.variants ?? []).filter(
        (variant): variant is NonNullable<typeof variant> => Boolean(variant)
      ),
    [product.variants]
  )

  const optionTitleById = useMemo(() => {
    const map = new Map<string, string>()
    for (const option of memoizedOptions) {
      if (option?.id && option.title) {
        map.set(option.id, option.title)
      }
    }
    return map
  }, [memoizedOptions])

  const getOptionValue = useCallback(
    (
      variant: HttpTypes.StoreProductVariant,
      option?: HttpTypes.StoreProductOption | null
    ) => {
      if (!option) return undefined
      const targetOptionId = option.id
      const normalizedTargetTitle = option.title
        ? normalized(option.title)
        : undefined
      const variantOptions = coerceVariantOptions(variant)
      const variantOption = variantOptions.find((opt) => {
        const optionId = opt.option_id ?? opt.option?.id
        if (targetOptionId && optionId === targetOptionId) return true
        if (!normalizedTargetTitle) return false
        const optionTitle =
          opt.option?.title ??
          (optionId ? optionTitleById.get(optionId) : undefined)
        if (!optionTitle) return false
        return normalized(optionTitle) === normalizedTargetTitle
      })
      return variantOption?.value ?? undefined
    },
    [coerceVariantOptions, normalized, optionTitleById]
  )

  // ============ RILEVA COLORI E TAGLIE ============
  const { colorOption, sizeOption } = useMemo(() => {
    const normalizedColorKey = normalized(colorKey)
    const normalizedSizeKey = normalized(sizeKey)
    const colorSynonyms = [
      normalizedColorKey,
      "colore",
      "color",
      "couleur",
      "farbe",
      "colour",
    ].filter(Boolean)
    const sizeSynonyms = [
      normalizedSizeKey,
      "taglia",
      "size",
      "talla",
      "größe",
      "taille",
      "misura",
    ].filter(Boolean)
    let detectedColor: HttpTypes.StoreProductOption | undefined = memoizedOptions.find((option) =>
      option?.title
        ? colorSynonyms.some((syn) => normalized(option.title!).includes(syn))
        : false
    )
    let detectedSize: HttpTypes.StoreProductOption | undefined = memoizedOptions.find((option) =>
      option?.title
        ? sizeSynonyms.some((syn) => normalized(option.title!).includes(syn))
        : false
    )
    if (!detectedColor) {
      detectedColor = memoizedOptions.find((o) => o !== detectedSize) || undefined
    }
    if (!detectedSize) {
      detectedSize = memoizedOptions.find((o) => o !== detectedColor) || undefined
    }
    if (detectedColor && detectedSize && detectedColor === detectedSize) {
      detectedSize = memoizedOptions.find((o) => o !== detectedColor) || undefined
    }
    return { colorOption: detectedColor || undefined, sizeOption: detectedSize || undefined }
  }, [colorKey, sizeKey, memoizedOptions, normalized])

  // (Colonna nome colore rimossa: manteniamo solo l'immagine colore)

  const colors = useMemo(() => {
    if (!colorOption) return ["Unico"]
    const values = new Set<string>()
    for (const variant of productVariants) {
      const value = getOptionValue(variant, colorOption)
      if (value) values.add(value)
    }
    return values.size ? Array.from(values) : ["Unico"]
  }, [colorOption, productVariants, getOptionValue])

  const sizes = useMemo(() => {
    if (!sizeOption) {
      const values = new Set<string>()
      if (colorOption) {
        for (const variant of productVariants) {
          const fallbackValue = coerceVariantOptions(variant).find((opt) => {
            const optionId = opt.option_id ?? opt.option?.id
            if (colorOption.id && optionId === colorOption.id) return false
            if (!colorOption.id && colorOption.title) {
              const optionTitle =
                opt.option?.title ??
                (optionId ? optionTitleById.get(optionId) : undefined)
              if (
                optionTitle &&
                normalized(optionTitle) === normalized(colorOption.title)
              ) {
                return false
              }
            }
            return true
          })
          if (fallbackValue?.value) values.add(fallbackValue.value)
        }
      }
      return values.size ? Array.from(values) : ["Unica"]
    }
    const values = new Set<string>()
    for (const variant of productVariants) {
      const value = getOptionValue(variant, sizeOption)
      if (value) values.add(value)
    }
    const collected = values.size ? Array.from(values) : ["Unica"]
    // Filtra secondo whitelist e ordina in base a SIZE_ORDER
    const orderMap = new Map(SIZE_ORDER.map((s, idx) => [s.toLowerCase(), idx]))
    return collected
      .filter((s) => orderMap.has(s.toLowerCase()))
      .sort((a, b) =>
        (orderMap.get(a.toLowerCase()) ?? 999) -
        (orderMap.get(b.toLowerCase()) ?? 999)
      )
  }, [
    sizeOption,
    colorOption,
    productVariants,
    getOptionValue,
    optionTitleById,
    normalized,
    coerceVariantOptions,
  ])

  // Mappa colore|taglia -> variante
  const variantMap = useMemo(() => {
    const map = new Map<string, HttpTypes.StoreProductVariant>()
    const fallbackColorValue = colors[0]
    const fallbackSizeValue = sizes[0]
    for (const variant of productVariants) {
      const colorValue =
        (colorOption ? getOptionValue(variant, colorOption) : undefined) ??
        fallbackColorValue
      let resolvedSizeValue: string | undefined
      if (sizeOption) {
        resolvedSizeValue = getOptionValue(variant, sizeOption)
      } else {
        const alternativeOption = coerceVariantOptions(variant).find((opt) => {
          const optionId = opt.option_id ?? opt.option?.id
          if (colorOption?.id && optionId === colorOption.id) return false
          if (!colorOption?.id && colorOption?.title) {
            const optionTitle =
              opt.option?.title ??
              (optionId ? optionTitleById.get(optionId) : undefined)
            if (
              optionTitle &&
              normalized(optionTitle) === normalized(colorOption.title)
            ) {
              return false
            }
          }
          return true
        })
        resolvedSizeValue = alternativeOption?.value ?? undefined
      }
      const sizeValue = resolvedSizeValue ?? fallbackSizeValue
      map.set(`${colorValue}||${sizeValue}`, variant)
    }
    return map
  }, [
    productVariants,
    colorOption,
    sizeOption,
    colors,
    sizes,
    getOptionValue,
    optionTitleById,
    coerceVariantOptions,
    normalized,
  ])

  // Stato quantità per cella
  const [qty, setQty] = useState<Record<string, number>>({})
  const [isAdding, setIsAdding] = useState(false)

  const setCell = (color: string, size: string, value: number) => {
    const key = `${color}||${size}`
    const variant = variantMap.get(key)
    const available = (variant?.inventory_quantity as number | undefined) ?? 0
    const sanitized = Math.max(0, Math.min(999, Math.floor(value) || 0))
    const capped = Math.min(sanitized, Math.max(0, available))
    if (!variant && capped === 0) return
    setQty((prev) => ({ ...prev, [key]: capped }))
  }
  const clearAll = () => setQty({})
  const totalQty = useMemo(
    () => Object.values(qty).reduce((acc, value) => acc + (value || 0), 0),
    [qty]
  )

  const handleAddToCart = async () => {
    if (totalQty === 0) return
    setIsAdding(true)
    try {
      const lineItems: AddToCartEventPayload["lineItems"] = []
      for (const [key, quantity] of Object.entries(qty)) {
        if (quantity <= 0) continue
        const variant = variantMap.get(key)
        if (!variant) continue
        lineItems.push({
          productVariant: {
            ...variant,
            product,
          },
          quantity,
        })
      }
      if (!lineItems.length) return
      addToCartEventBus.emitCartAdd({
        lineItems,
        regionId: region.id,
      })
      clearAll()
    } finally {
      setIsAdding(false)
    }
  }

  // ============ RENDER ============
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 bg-white">
          <thead>
            <tr>
              <th
                className="sticky left-0 z-20 w-16 min-w-[4rem] bg-gray-50 px-3 py-2 border-b border-r"
                aria-label="Color"
              ></th>
              {sizes.map((size) => (
                <th key={size} className="px-3 py-2 text-sm border-b">
                  {size}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {colors.map((color) => {
              const colorParts = color
                .split(/[-/]/)
                .map((p) => p.trim())
                .filter(Boolean)

              return (
                <tr key={color} className="odd:bg-gray-50">
                  <td className="sticky left-0 z-10 bg-gray-50 px-3 py-2 border-r">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-white">
                      <ColorImage colors={colorParts} size={40} className="shadow-none border-0" alt={color} />
                    </div>
                  </td>
                {sizes.map((size) => {
                  const key = `${color}||${size}`
                  const variant = variantMap.get(key)
                  const inventory = (variant?.inventory_quantity as number | undefined) ?? 0
                  const isUnavailable = !variant || inventory <= 0
                  let backgroundClass = COLOR_CLASSES.none
                  if (!isUnavailable) {
                    if (inventory > HIGH_STOCK_THRESHOLD) backgroundClass = COLOR_CLASSES.high
                    else if (inventory >= LOW_STOCK_THRESHOLD)
                      backgroundClass = COLOR_CLASSES.medium
                    else backgroundClass = COLOR_CLASSES.low
                  }
                  const displayQuantity = Math.max(inventory, 0)
                  return (
                    <td
                      key={size}
                      className={`px-2 py-2 text-center border align-top ${backgroundClass}`}
                      title={`Disponibilità: ${displayQuantity}`}
                    >
                      {isUnavailable ? (
                        <span className="text-xs font-medium text-gray-400">
                          {UNAVAILABLE_LABEL}
                        </span>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            max={inventory}
                            step={1}
                            value={qty[key] ?? 0}
                            onChange={(e) =>
                              setCell(color, size, parseInt(e.target.value, 10))
                            }
                            className="w-16 rounded-md border px-2 py-1 text-sm focus:outline-none focus:ring"
                          />
                          <span className="text-[10px] uppercase tracking-wide text-gray-500">
                            DISP: {displayQuantity}
                          </span>
                        </div>
                      )}
                    </td>
                  )
                })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Totale selezionato: <b>{totalQty}</b>
          </span>
          <button
            onClick={clearAll}
            className="rounded-md border px-3 py-1.5 text-xs hover:bg-gray-50"
            disabled={totalQty === 0}
          >
            Svuota
          </button>
        </div>
        <Button
          onClick={handleAddToCart}
          variant="primary"
            className="w-full h-10 flex items-center justify-center gap-2"
          isLoading={isAdding}
          disabled={totalQty === 0}
          data-testid="add-product-button"
        >
          <ShoppingBag
            className="text-white"
            fill={totalQty === 0 ? "none" : "#fff"}
          />
          {totalQty === 0 ? "Seleziona quantitativi" : "Aggiungi al carrello"}
        </Button>
      </div>
    </div>
  )
}

export default ProductVariantsMatrix
