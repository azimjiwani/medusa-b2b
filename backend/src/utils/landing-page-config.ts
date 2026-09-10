import { z } from "@medusajs/framework/zod";

// Destinations stay on the storefront; reject protocol-relative and script URLs.
const internalPath = z
  .string()
  .max(500)
  .refine(
    (value) =>
      value.startsWith("/") && !value.startsWith("//") && !/[\\\s]/.test(value),
    "Use a site path such as /store or /collections/accessories"
  );
const imageUrl = z
  .string()
  .max(2000)
  .refine((value) => {
    if (!value) return true;
    if (value.startsWith("/"))
      return !value.startsWith("//") && !/[\\\s]/.test(value);
    try {
      const url = new URL(value);
      const localImage =
        url.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(url.hostname);
      return (
        (url.protocol === "https:" || localImage) &&
        !url.username &&
        !url.password
      );
    } catch {
      return false;
    }
  }, "Use an HTTPS image URL or a site image path");

export const DEFAULT_BANNERS = [
  {
    id: "discover",
    enabled: true,
    eyebrow: "Batteries N’ Things",
    headline: "Good things.\nGreat possibilities.",
    description:
      "Everyday technology. Thoughtfully selected for your business.",
    link: "/store",
    action: "Discover the collection",
    background: "#f0f1f4",
    artwork: "collection" as const,
    image_url: "",
    image_alt: "",
  },
  {
    id: "phones",
    enabled: true,
    eyebrow: "Phones & devices",
    headline: "Your next\nconnection.",
    description: "Explore phones and devices for wherever the day takes you.",
    link: "/store?category=cell-phones",
    action: "Explore phones",
    background: "#edf2f8",
    artwork: "phones" as const,
    image_url: "",
    image_alt: "",
  },
  {
    id: "accessories",
    enabled: true,
    eyebrow: "Everyday essentials",
    headline: "Small details.\nBig difference.",
    description:
      "Power up. Tune in. Find the accessories that complete every day.",
    link: "/store?category=accessories",
    action: "Shop accessories",
    background: "#f1eef5",
    artwork: "accessories" as const,
    image_url: "",
    image_alt: "",
  },
];

const bannerBaseSchema = z
  .object({
    id: z.string().min(1).max(100),
    enabled: z.boolean(),
    eyebrow: z.string().max(60),
    headline: z.string().max(90),
    description: z.string().max(200),
    action: z.string().max(40),
    link: z.union([internalPath, z.literal("")]),
    background: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, "Use a six-digit hex background color"),
    artwork: z.enum(["collection", "phones", "accessories"]),
    image_url: imageUrl,
    image_alt: z.string().max(180),
  })
  .strict();

export const landingBannerSchema = bannerBaseSchema.superRefine(
  (banner, ctx) => {
    if (!banner.enabled) return;
    for (const key of ["headline", "action", "link"] as const) {
      if (!banner[key].trim())
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: `Add the banner ${
            key === "action"
              ? "button text"
              : key === "link"
              ? "destination"
              : "headline"
          }`,
        });
    }
  }
);

const linkCard = z
  .object({
    id: z.string().min(1).max(100),
    title: z.string().trim().min(1).max(80),
    description: z.string().max(180),
    href: internalPath,
    image_url: imageUrl,
    icon: z.enum(["phone", "power", "headphones", "bag", "sim"]),
    tone: z.enum(["silver", "blue", "sand", "lavender"]),
  })
  .strict();

const landingSectionBaseSchema = z
  .object({
    id: z.string().min(1).max(100),
    type: z.enum(["products", "links"]),
    enabled: z.boolean(),
    eyebrow: z.string().max(60),
    title: z.string().trim().min(1).max(100),
    subtitle: z.string().max(200),
    link_label: z.string().max(40),
    link_href: z.union([internalPath, z.literal("")]),
    source: z.enum(["latest", "collection", "selected"]),
    collection_id: z.string().max(100),
    product_ids: z.array(z.string().startsWith("prod_")).max(12),
    product_limit: z.number().int().min(1).max(12),
    cards: z.array(linkCard).max(8),
  })
  .strict();

export const landingSectionSchema = landingSectionBaseSchema.superRefine(
  (section, ctx) => {
    if (section.link_label && !section.link_href)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["link_href"],
        message: "Add a destination for the section link",
      });
    if (!section.enabled) return;
    if (
      section.type === "products" &&
      section.source === "collection" &&
      !section.collection_id
    )
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["collection_id"],
        message: "Choose a collection",
      });
    if (
      section.type === "products" &&
      section.source === "selected" &&
      !section.product_ids.length
    )
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["product_ids"],
        message: "Choose at least one product",
      });
    if (section.type === "links" && !section.cards.length)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cards"],
        message: "Add at least one link card",
      });
    if (
      new Set(section.cards.map((card) => card.id)).size !==
      section.cards.length
    )
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cards"],
        message: "Card IDs must be unique",
      });
  }
);

export const landingPageSchema = z
  .object({
    hero_enabled: z.boolean(),
    banners: z
      .array(landingBannerSchema)
      .max(8)
      .default(() => structuredClone(DEFAULT_BANNERS)),
    explore_label: z.string().trim().min(1).max(60),
    explore_href: internalPath,
    sections: z.array(landingSectionSchema).max(12),
  })
  .strict()
  .superRefine((page, ctx) => {
    if (
      new Set(page.banners.map((banner) => banner.id)).size !==
      page.banners.length
    )
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["banners"],
        message: "Banner IDs must be unique",
      });
    if (
      new Set(page.sections.map((section) => section.id)).size !==
      page.sections.length
    )
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sections"],
        message: "Section IDs must be unique",
      });
  });

export const landingPageDraftSchema = z
  .object({
    hero_enabled: z.boolean(),
    banners: z
      .array(bannerBaseSchema)
      .max(8)
      .default(() => structuredClone(DEFAULT_BANNERS)),
    explore_label: z.string().trim().min(1).max(60),
    explore_href: internalPath,
    sections: z.array(landingSectionBaseSchema).max(12),
  })
  .strict();

export type LandingBanner = z.infer<typeof bannerBaseSchema>;

export type LandingPageConfig = z.infer<typeof landingPageSchema>;
export type LandingSection = LandingPageConfig["sections"][number];
export type LandingCard = LandingSection["cards"][number];

const sectionBase = {
  enabled: true,
  eyebrow: "",
  subtitle: "",
  link_label: "",
  link_href: "",
  source: "latest" as const,
  collection_id: "",
  product_ids: [],
  product_limit: 8,
  cards: [],
};

export const DEFAULT_LANDING_PAGE: LandingPageConfig = {
  hero_enabled: true,
  banners: structuredClone(DEFAULT_BANNERS),
  explore_label: "Explore all products",
  explore_href: "/store",
  sections: [
    {
      ...sectionBase,
      id: "latest",
      type: "products",
      eyebrow: "JUST IN",
      title: "Fresh finds. Ready for your shelves.",
      subtitle: "The latest additions to our wholesale collection.",
      link_label: "Shop all",
      link_href: "/store",
      product_limit: 8,
    },
    {
      ...sectionBase,
      id: "discover",
      type: "links",
      eyebrow: "FIND YOUR NEXT BESTSELLER",
      title: "A little of everything. All in one place.",
      subtitle: "Explore the essentials your customers come back for.",
      cards: [
        {
          id: "phones",
          title: "Phones & devices",
          description: "Your next connection starts here.",
          href: "/store?category=cell-phones",
          image_url: "",
          icon: "phone",
          tone: "blue",
        },
        {
          id: "power",
          title: "Power essentials",
          description: "Keep every day fully charged.",
          href: "/store?category=home-charger",
          image_url: "",
          icon: "power",
          tone: "sand",
        },
        {
          id: "accessories",
          title: "Everyday accessories",
          description: "Small details. Big possibilities.",
          href: "/store?category=accessories",
          image_url: "",
          icon: "headphones",
          tone: "lavender",
        },
        {
          id: "wholesale",
          title: "Made for your business",
          description: "Your account. Your wholesale advantage.",
          href: "/account",
          image_url: "",
          icon: "bag",
          tone: "silver",
        },
      ],
    },
  ],
};

export const LANDING_PAGE_METADATA_KEY = "bnt_landing_page";

export function readLandingPageState(
  metadata: Record<string, unknown> | null | undefined
) {
  const raw = metadata?.[LANDING_PAGE_METADATA_KEY] as
    | Record<string, unknown>
    | undefined;
  const published = landingPageSchema.safeParse(raw?.published);
  const draft = landingPageDraftSchema.safeParse(raw?.draft);
  return {
    draft: draft.success
      ? draft.data
      : published.success
      ? published.data
      : structuredClone(DEFAULT_LANDING_PAGE),
    published: published.success
      ? published.data
      : structuredClone(DEFAULT_LANDING_PAGE),
    published_at:
      typeof raw?.published_at === "string" ? raw.published_at : null,
    saved_at: typeof raw?.saved_at === "string" ? raw.saved_at : null,
  };
}

export function updateLandingPageMetadata(
  metadata: Record<string, unknown> | null | undefined,
  config: LandingPageConfig,
  action: "save" | "publish"
) {
  const previous = readLandingPageState(metadata);
  const now = new Date().toISOString();
  return {
    ...metadata,
    [LANDING_PAGE_METADATA_KEY]: {
      draft: config,
      published: action === "publish" ? config : previous.published,
      published_at: action === "publish" ? now : previous.published_at,
      saved_at: now,
    },
  };
}
