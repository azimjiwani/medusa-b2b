import type { LandingBanner } from "@/types/landing-page"

export type Banner = LandingBanner

export const banners: Banner[] = [
  {
    id: "discover",
    enabled: true,
    image_url: "",
    image_alt: "",
    eyebrow: "Batteries N’ Things",
    headline: "Good things.\nGreat possibilities.",
    description:
      "Everyday technology. Thoughtfully selected for your business.",
    link: "/store",
    action: "Discover the collection",
    background: "#f0f1f4",
    artwork: "collection",
  },
  {
    id: "phones",
    enabled: true,
    image_url: "",
    image_alt: "",
    eyebrow: "Phones & devices",
    headline: "Your next\nconnection.",
    description: "Explore phones and devices for wherever the day takes you.",
    link: "/store?category=cell-phones",
    action: "Explore phones",
    background: "#edf2f8",
    artwork: "phones",
  },
  {
    id: "accessories",
    enabled: true,
    image_url: "",
    image_alt: "",
    eyebrow: "Everyday essentials",
    headline: "Small details.\nBig difference.",
    description:
      "Power up. Tune in. Find the accessories that complete every day.",
    link: "/store?category=accessories",
    action: "Shop accessories",
    background: "#f1eef5",
    artwork: "accessories",
  },
]
