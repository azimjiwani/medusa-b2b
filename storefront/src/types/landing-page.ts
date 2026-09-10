export type LandingBanner = {
  id: string
  enabled: boolean
  eyebrow: string
  headline: string
  description: string
  action: string
  link: string
  background: string
  artwork: "collection" | "phones" | "accessories"
  image_url: string
  image_alt: string
}

export type LandingCard = {
  id: string
  title: string
  description: string
  href: string
  image_url: string
  icon: "phone" | "power" | "headphones" | "bag" | "sim"
  tone: "silver" | "blue" | "sand" | "lavender"
}

export type LandingSection = {
  id: string
  type: "products" | "links"
  enabled: boolean
  eyebrow: string
  title: string
  subtitle: string
  link_label: string
  link_href: string
  source: "latest" | "collection" | "selected"
  collection_id: string
  product_ids: string[]
  product_limit: number
  cards: LandingCard[]
}

export type LandingPageConfig = {
  hero_enabled: boolean
  banners: LandingBanner[]
  explore_label: string
  explore_href: string
  sections: LandingSection[]
}
