import { clx } from "@medusajs/ui"
import { DEFAULT_COLOR_HEX, getColorHex } from "../../config/color-map"


type Shape = "Circle" | "Square"

type ColorImageProps = {
  colors: string[]
  size?: number
  className?: string
  shape?: Shape // Circle | Square (default Square)
  showText?: boolean // mostra codice 2 lettere (default true)
  alt?: string // testo alternativo/descrizione (default = join colori)
  locale?: string // codice locale per auto-localizzazione (es. 'it', 'en') default 'it'
  translations?: Record<string, string> // override esterno opzionale singole traduzioni
}

const buildGradient = (colorHexes: string[]) => {
  if (colorHexes.length <= 1) {
    return colorHexes[0] ?? DEFAULT_COLOR_HEX
  }

  const limitedColors = colorHexes.slice(0, 5)
  const segment = 100 / limitedColors.length
  const stops = limitedColors
    .map((color, index) => {
      const start = index === 0 ? 0 : Number((index * segment).toFixed(2))
      const end = Number(((index + 1) * segment).toFixed(2))
      return `${color} ${start}%, ${color} ${end}%`
    })
    .join(", ")

  return `linear-gradient(90deg, ${stops})`
}

const resolveColors = (colors: string[]) => {
  const unique = new Set<string>()

  colors.forEach((color) => {
    const normalized = color.trim()
    if (!normalized) {
      return
    }

    const hex = getColorHex(normalized)
    unique.add(hex)
  })

  return Array.from(unique)
}

// Genera lettere da visualizzare:
// - Se più colori: una lettera (prima lettera) per ciascuno dei primi due colori
// - Se un solo colore: prime due lettere del nome normalizzato
const deriveLetters = (colors: string[]): string[] => {
  const cleaned = colors
    .map((c) => c.trim())
    .filter(Boolean)

  if (cleaned.length === 0) return ["-", "-"]

  if (cleaned.length === 1) {
    const base = cleaned[0]
    const alnum = base.replace(/[^A-Za-z0-9]/g, "").toUpperCase()
    if (alnum.length >= 2) return [alnum[0], alnum[1]]
    if (alnum.length === 1) return [alnum[0], alnum[0]]
    return ["-", "-"]
  }

  // multi-colore: prendi prime due
  const letters: string[] = []
  for (const c of cleaned.slice(0, 2)) {
    const alnum = c.replace(/[^A-Za-z0-9]/g, "").toUpperCase()
    letters.push(alnum[0] || "-")
  }
  // garantisci due lettere
  if (letters.length === 1) letters.push(letters[0])
  return letters
}

// Calcola colore testo contrastato (semplice luminanza media)
const getContrastText = (hex: string): string => {
  const sanitized = hex.replace("#", "")
  if (sanitized.length !== 6) return "#000"
  const r = parseInt(sanitized.substring(0, 2), 16)
  const g = parseInt(sanitized.substring(2, 4), 16)
  const b = parseInt(sanitized.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? "#000" : "#fff"
}

const ColorImage = ({
  colors,
  size = 28,
  className,
  shape = "Square",
  showText = true,
  alt,
  locale = "it",
  translations,
}: ColorImageProps) => {
  const hexColors = resolveColors(colors)
  const background = buildGradient(hexColors)
  const letters = showText ? deriveLetters(colors) : []
  const contrasts = showText
    ? letters.map((_, idx) => {
        const colorSource = colors[idx] ?? colors[0] ?? ""
        const hex = getColorHex(colorSource.trim())
        return getContrastText(hex)
      })
    : []

  const shapeClass = shape === "Circle" ? "rounded-full" : "rounded-md"
  // Calcolo dimensione font proporzionale (circa 36% della dimensione, con min 8 e max 18 per evitare eccessi)
  const fontSizePx = Math.min(18, Math.max(8, Math.round(size * 0.36)))

  // ================= LOCALIZZAZIONE =================
  const BASE_TRANSLATIONS: Record<string, Record<string, string>> = {
    it: {
      black: "Nero",
      white: "Bianco",
      red: "Rosso",
      blue: "Blu",
      navy: "Blu Navy",
      green: "Verde",
      yellow: "Giallo",
      orange: "Arancione",
      purple: "Viola",
      brown: "Marrone",
      grey: "Grigio",
      gray: "Grigio",
      pink: "Rosa",
      beige: "Beige",
      gold: "Oro",
      silver: "Argento",
      ivory: "Avorio",
      bronze: "Bronzo",
      copper: "Rame",
    },
    en: {},
  }

  const localeMap = {
    ...(BASE_TRANSLATIONS[locale] || {}),
    ...(translations || {}),
  }

  const localizeToken = (token: string) => {
    const key = token.trim().toLowerCase()
    return localeMap[key] || token.trim()
  }

  const localizeColorString = (value: string) => {
    // separa su - o / mantenendo struttura semplificata
    const parts = value.split(/[-/]/).map((p) => p.trim()).filter(Boolean)
    if (!parts.length) return value
    return parts.map(localizeToken).join(" / ")
  }

  const localizedColorLabel = (alt || colors.map(localizeColorString).join("; ")).trim()

  return (
    <span
      className={clx(
        "inline-flex items-center justify-center border border-gray-200 shadow-sm select-none",
        shapeClass,
        className
      )}
      style={{
        width: size,
        height: size,
        background,
      }}
      role="img"
      aria-label={localizedColorLabel}
      title={localizedColorLabel}
    >
      {showText && letters.length > 0 && (
        <span
          className="flex gap-[1px] items-center justify-center font-semibold leading-none"
          style={{ fontSize: fontSizePx, lineHeight: 1 }}
        >
          {letters.map((ltr, i) => (
            <span
              key={`${ltr}-${i}`}
              style={{ color: contrasts[i], fontSize: fontSizePx }}
              className="tracking-wide"
            >
              {ltr}
            </span>
          ))}
        </span>
      )}
    </span>
  )
}

export default ColorImage
