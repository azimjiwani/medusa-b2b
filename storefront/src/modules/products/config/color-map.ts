export const normalizeColorName = (name: string) =>
  name.trim().toUpperCase().replace(/\s+/g, " ")

export const COLOR_HEX_MAP: Record<string, string> = {
  "PURPLE": "#7D3C98",
  "WHITE": "#FFFFFF",
  "ROYAL": "#4169E1",
  "YELLOW": "#FFD700",
  "DARK GREY": "#4A4A4A",
  "WATER GREEN": "#2BBBAD",
  "BURGUNDY": "#800020",
  "SAND": "#C2B280",
  "LIGHT GREEN": "#90EE90",
  "ORANGE": "#FF7F11",
  "DARK NAVY": "#001F54",
  "CHARCOAL": "#36454F",
  "LEAD GREY": "#6D6F71",
  "BLACK": "#000000",
  "NAVY MARINE": "#1F2A44",
  "CYAN": "#00FFFF",
  "DARK ORANGE": "#FF4500",
  "NAVY 02": "#203A5F",
  "ARMY": "#4B5320",
  "HAZELNUT": "#8E6E53",
  "SILVER GREY": "#C0C0C0",
  "FOREST GREEN": "#228B22",
  "LIME": "#32CD32",
  "SKY BLUE": "#87CEEB",
  "CHOCOLATE MELANGE": "#5D3A1A",
  "PINK": "#FFC0CB",
  "CHERRY": "#DE3163",
  "ROYAL BLUE": "#2A52BE",
  "DARK FUXIA": "#B0006D",
  "CHOCOLATE": "#7B3F00",
  "TURQUOISE": "#40E0D0",
  "RED": "#FF0000",
  "CREAM": "#FFFDD0",
  "BIANCO PANNA": "#FFF5E1",
  "ASH MEL": "#B2BEB5",
  "NAVY BLUE": "#000080",
  "FUXIA": "#FF00FF",
  "ROYAL / YELLOW": "#4169E1",
  "BLACK 13": "#1A1A1A",
}

export const DEFAULT_COLOR_HEX = "#D1D5DB"

export const getColorHex = (name: string) => {
  const normalized = normalizeColorName(name)
  return COLOR_HEX_MAP[normalized] ?? DEFAULT_COLOR_HEX
}
