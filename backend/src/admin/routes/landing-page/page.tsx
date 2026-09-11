import { defineRouteConfig } from "@medusajs/admin-sdk";
import {
  Button,
  Container,
  Heading,
  Input,
  Textarea,
  toast,
  Toaster,
} from "@medusajs/ui";
import { useEffect, useState, type ReactNode } from "react";
import { sdk } from "../../lib/client";
import { ProductPicker as SharedProductPicker } from "../../components/product-picker";
import { LandingSortableList } from "../../components/landing-sortable-list";
import type {
  LandingPageConfig,
  LandingSection,
  LandingCard,
  LandingBanner,
} from "../../../utils/landing-page-config";

type PageState = {
  draft: LandingPageConfig;
  published: LandingPageConfig;
  saved_at: string | null;
  published_at: string | null;
};
const selectClass =
  "h-9 w-full rounded-md border border-ui-border-base bg-ui-bg-field px-3 text-sm text-ui-fg-base";
const tones = {
  silver: "#eeeeef",
  blue: "#eaf1f9",
  sand: "#f4efe7",
  lavender: "#efedf8",
};
const id = () => crypto.randomUUID();

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {hint && <span className="text-xs text-ui-fg-subtle">{hint}</span>}
    </label>
  );
}

function makeSection(type: LandingSection["type"]): LandingSection {
  return {
    id: id(),
    type,
    enabled: true,
    eyebrow: "",
    title: type === "products" ? "New product tray" : "Explore more",
    subtitle: "",
    link_label: "",
    link_href: "",
    source: "latest",
    collection_id: "",
    product_ids: [],
    product_limit: 8,
    cards: type === "links" ? [makeCard()] : [],
  };
}
function makeCard(): LandingCard {
  return {
    id: id(),
    title: "Shop the collection",
    description: "Discover something new.",
    href: "/store",
    image_url: "",
    icon: "bag",
    tone: "silver",
  };
}
function makeBanner(): LandingBanner {
  return {
    id: id(),
    enabled: true,
    eyebrow: "Featured collection",
    headline: "Discover something new.",
    description: "Explore our latest products.",
    action: "Shop now",
    link: "/store",
    background: "#f0f1f4",
    artwork: "collection",
    image_url: "",
    image_alt: "",
  };
}

function move<T>(items: T[], index: number, direction: number): T[] {
  const result = [...items];
  const destination = index + direction;
  if (destination < 0 || destination >= items.length) return result;
  [result[index], result[destination]] = [result[destination], result[index]];
  return result;
}

export function ProductPicker({
  section,
  onChange,
}: {
  section: LandingSection;
  onChange: (patch: Partial<LandingSection>) => void;
}) {
  return (
    <SharedProductPicker
      productIds={section.product_ids}
      onChange={(product_ids) => onChange({ product_ids })}
    />
  );
}

function BannerEditor({
  banner,
  update,
  onUploading,
}: {
  banner: LandingBanner;
  update: (patch: Partial<LandingBanner>) => void;
  onUploading: (uploading: boolean) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const upload = async (file?: File) => {
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp", "image/avif"].includes(
        file.type
      ) ||
      file.size > 5 * 1024 * 1024
    ) {
      toast.error("Choose a PNG, JPEG, WebP, or AVIF image smaller than 5 MB.");
      return;
    }
    setUploading(true);
    onUploading(true);
    try {
      const { files } = await sdk.admin.upload.create({ files: [file] });
      if (!files[0]?.url) throw new Error("No uploaded image was returned");
      update({ image_url: files[0].url });
    } catch {
      toast.error("Image upload failed. Please try again.");
    } finally {
      setUploading(false);
      onUploading(false);
    }
  };
  return (
    <div className="min-w-0 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Heading level="h2">Banner</Heading>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={banner.enabled}
            onChange={(event) => update({ enabled: event.target.checked })}
          />
          Visible
        </label>
      </div>
      <Field
        label="Eyebrow"
        hint="The small text above the headline. Optional."
      >
        <Input
          value={banner.eyebrow}
          maxLength={60}
          onChange={(event) => update({ eyebrow: event.target.value })}
        />
      </Field>
      <Field
        label="Headline"
        hint="Use line breaks to control the headline. Keep it short for mobile."
      >
        <Textarea
          value={banner.headline}
          maxLength={90}
          rows={3}
          onChange={(event) => update({ headline: event.target.value })}
        />
      </Field>
      <Field label="Description">
        <Textarea
          value={banner.description}
          maxLength={200}
          rows={3}
          onChange={(event) => update({ description: event.target.value })}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Button text"
          hint="The label shown on this banner’s button, such as Discover the collection."
        >
          <Input
            value={banner.action}
            maxLength={40}
            onChange={(event) => update({ action: event.target.value })}
          />
        </Field>
        <Field
          label="Button destination"
          hint="Use a site path without /ca, such as /store or /collections/accessories."
        >
          <Input
            value={banner.link}
            maxLength={500}
            onChange={(event) => update({ link: event.target.value })}
          />
        </Field>
      </div>
      <Field
        label="Image URL"
        hint="Optional. Add your own product or campaign image, or upload one below. The full image is shown without cropping."
      >
        <Input
          value={banner.image_url}
          maxLength={2000}
          placeholder="https://…"
          onChange={(event) => update({ image_url: event.target.value })}
        />
      </Field>
      <Field
        label={uploading ? "Uploading image…" : "Upload banner image"}
        hint="PNG, JPEG, WebP, or AVIF, up to 5 MB. A square or landscape image works best."
      >
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif"
          disabled={uploading}
          onChange={(event) => {
            void upload(event.target.files?.[0]);
            event.target.value = "";
          }}
          className="max-w-full text-sm"
        />
      </Field>
      {banner.image_url && (
        <div className="space-y-2">
          <img
            src={banner.image_url}
            alt={banner.image_alt || "Banner image preview"}
            className="h-48 w-full rounded-lg bg-ui-bg-subtle object-contain"
          />
          <Button
            variant="secondary"
            size="small"
            onClick={() => update({ image_url: "", image_alt: "" })}
          >
            Remove image
          </Button>
        </div>
      )}
      <Field
        label="Image description"
        hint="A short description for screen readers. If blank, the headline is used."
      >
        <Input
          value={banner.image_alt}
          maxLength={180}
          onChange={(event) => update({ image_alt: event.target.value })}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Fallback illustration" hint="Shown when no image is set.">
          <select
            className={selectClass}
            value={banner.artwork}
            onChange={(event) =>
              update({
                artwork: event.target.value as LandingBanner["artwork"],
              })
            }
          >
            <option value="collection">Phones and headphones</option>
            <option value="phones">Phones</option>
            <option value="accessories">Headphones and charger</option>
          </select>
        </Field>
        <Field
          label="Background color"
          hint="Choose a light color to keep the dark text readable."
        >
          <input
            type="color"
            value={banner.background}
            onChange={(event) => update({ background: event.target.value })}
            className="h-9 w-full cursor-pointer rounded-md border border-ui-border-base"
          />
        </Field>
      </div>
      <div
        className="rounded-xl p-5 text-[#1d1d1f]"
        style={{ background: banner.background }}
      >
        <p className="text-[10px] uppercase tracking-widest text-[#6e6e73]">
          {banner.eyebrow}
        </p>
        <p className="mt-3 whitespace-pre-line break-words text-2xl font-semibold leading-tight">
          {banner.headline || "Your headline"}
        </p>
        <p className="mt-3 text-sm text-[#6e6e73]">{banner.description}</p>
        {banner.image_url && (
          <img
            src={banner.image_url}
            alt=""
            className="mt-4 h-32 w-full object-contain"
          />
        )}
        <span className="mt-4 inline-block rounded-full bg-[#1d1d1f] px-4 py-2 text-xs text-white">
          {banner.action || "Button text"} ↗
        </span>
      </div>
    </div>
  );
}

function CardEditor({
  card,
  update,
}: {
  card: LandingCard;
  update: (patch: Partial<LandingCard>) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const upload = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      toast.error("Choose an image smaller than 5 MB.");
      return;
    }
    setUploading(true);
    try {
      const { files } = await sdk.admin.upload.create({ files: [file] });
      if (files[0]?.url) update({ image_url: files[0].url });
    } catch {
      toast.error("Image upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="grid gap-4">
      <Field label="Card title">
        <Input
          value={card.title}
          maxLength={80}
          onChange={(event) => update({ title: event.target.value })}
        />
      </Field>
      <Field label="Description">
        <Input
          value={card.description}
          maxLength={180}
          onChange={(event) => update({ description: event.target.value })}
        />
      </Field>
      <Field
        label="Destination"
        hint="Use a storefront path without the country prefix, e.g. /store or /collections/accessories."
      >
        <Input
          value={card.href}
          onChange={(event) => update({ href: event.target.value })}
        />
      </Field>
      <Field
        label="Image URL"
        hint="Optional. Leave empty to use the illustration below."
      >
        <Input
          value={card.image_url}
          onChange={(event) => update({ image_url: event.target.value })}
          placeholder="https://…"
        />
      </Field>
      <Field label={uploading ? "Uploading image…" : "Upload image"}>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif"
          disabled={uploading}
          onChange={(event) => void upload(event.target.files?.[0])}
          className="text-sm"
        />
      </Field>
      {card.image_url && (
        <img
          src={card.image_url}
          alt="Card preview"
          className="h-28 w-full rounded-lg bg-ui-bg-subtle object-contain"
        />
      )}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Illustration">
          <select
            className={selectClass}
            value={card.icon}
            onChange={(event) =>
              update({ icon: event.target.value as LandingCard["icon"] })
            }
          >
            <option value="phone">Phone</option>
            <option value="sim">SIM card</option>
            <option value="power">Charger</option>
            <option value="headphones">Headphones</option>
            <option value="bag">Shopping bag</option>
          </select>
        </Field>
        <Field label="Background">
          <select
            className={selectClass}
            value={card.tone}
            onChange={(event) =>
              update({ tone: event.target.value as LandingCard["tone"] })
            }
          >
            <option value="silver">Silver</option>
            <option value="blue">Ice blue</option>
            <option value="sand">Warm sand</option>
            <option value="lavender">Lavender</option>
          </select>
        </Field>
      </div>
    </div>
  );
}

const LandingPageEditor = () => {
  const [state, setState] = useState<PageState | null>(null);
  const [config, setConfig] = useState<LandingPageConfig | null>(null);
  const [selectedBannerId, setSelectedBannerId] = useState<string | null>(null);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [collections, setCollections] = useState<
    { id: string; title: string }[]
  >([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    sdk.client
      .fetch<PageState>("/admin/landing-page")
      .then((data) => {
        setState(data);
        setConfig(data.draft);
        setSelectedBannerId(data.draft.banners[0]?.id ?? null);
        setSelectedId(data.draft.sections[0]?.id ?? null);
      })
      .catch(() =>
        setError("The landing page could not be loaded. Refresh to try again.")
      );
    sdk.admin.productCollection
      .list({ limit: 100 })
      .then(({ collections }) => setCollections(collections))
      .catch(() => toast.error("Could not load collections."));
  }, []);
  const unsaved =
    !!config && JSON.stringify(config) !== JSON.stringify(state?.draft);
  const unpublished =
    !!config && JSON.stringify(config) !== JSON.stringify(state?.published);
  useEffect(() => {
    if (!unsaved) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsaved]);
  const save = async (action: "save" | "publish") => {
    if (!config) return;
    setBusy(true);
    setError("");
    try {
      const data = await sdk.client.fetch<PageState>("/admin/landing-page", {
        method: "POST",
        body: { action, config },
      });
      setState(data);
      setConfig(data.draft);
      toast.success(
        action === "publish"
          ? "Landing page published. Changes appear after the next storefront cache refresh."
          : "Draft saved. The live page is unchanged."
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not save the landing page."
      );
    } finally {
      setBusy(false);
    }
  };
  if (!config)
    return (
      <Container>
        <Heading>Landing Page</Heading>
        <p role={error ? "alert" : undefined} className="mt-4 text-sm">
          {error || "Loading your landing page…"}
        </p>
      </Container>
    );
  const selectSection = (id: string) => {
    setSelectedBannerId(null);
    setSelectedId(id);
  };
  const banner = config.banners.find((item) => item.id === selectedBannerId);
  const updateBanner = (patch: Partial<LandingBanner>) =>
    setConfig((previous) =>
      previous
        ? {
            ...previous,
            banners: previous.banners.map((item) =>
              item.id === selectedBannerId ? { ...item, ...patch } : item
            ),
          }
        : previous
    );
  const section = config.sections.find((item) => item.id === selectedId);
  const updateSection = (patch: Partial<LandingSection>) =>
    setConfig((previous) =>
      previous
        ? {
            ...previous,
            sections: previous.sections.map((item) =>
              item.id === selectedId ? { ...item, ...patch } : item
            ),
          }
        : previous
    );
  const addSection = (type: LandingSection["type"]) => {
    const next = makeSection(type);
    setConfig({ ...config, sections: [...config.sections, next] });
    selectSection(next.id);
  };
  return (
    <div className="space-y-6">
      <Toaster />
      <Container className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Heading level="h1">Landing Page</Heading>
          <p className="mt-1 text-sm text-ui-fg-subtle">
            Build a storefront worth exploring.
          </p>
          <p className="mt-2 text-xs text-ui-fg-muted">
            {unsaved
              ? "Unsaved changes"
              : unpublished
              ? "Draft saved · not published"
              : "Up to date"}
            {state?.published_at
              ? ` · Last published ${new Date(
                  state.published_at
                ).toLocaleString()}`
              : " · Using starter layout"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            disabled={busy || bannerUploading || !unsaved}
            onClick={() => void save("save")}
          >
            Save draft
          </Button>
          <Button
            disabled={
              busy || bannerUploading || (!unpublished && !!state?.published_at)
            }
            isLoading={busy}
            onClick={() => void save("publish")}
          >
            Publish changes
          </Button>
        </div>
      </Container>
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-ui-border-error bg-ui-bg-subtle p-4 text-sm text-ui-fg-error"
        >
          {error}
        </div>
      )}
      <fieldset
        disabled={busy || bannerUploading}
        className="grid min-w-0 gap-6 xl:grid-cols-[280px_minmax(0,1fr)_300px]"
      >
        <div className="space-y-4">
          <Container className="space-y-4">
            <Heading level="h2">Page settings</Heading>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={config.hero_enabled}
                onChange={(event) =>
                  setConfig({ ...config, hero_enabled: event.target.checked })
                }
              />
              Show banner carousel
            </label>
            <Field label="Explore link text">
              <Input
                value={config.explore_label}
                onChange={(event) =>
                  setConfig({ ...config, explore_label: event.target.value })
                }
                maxLength={60}
              />
            </Field>
            <Field label="Explore link destination">
              <Input
                value={config.explore_href}
                onChange={(event) =>
                  setConfig({ ...config, explore_href: event.target.value })
                }
              />
            </Field>
          </Container>
          <Container className="space-y-3">
            <Heading level="h2">Banners</Heading>
            <p className="text-xs text-ui-fg-subtle">
              Drag the handles to reorder up to eight banners.
            </p>
            <LandingSortableList
              items={config.banners}
              label="Banners order"
              getLabel={(item) => item.headline || "Untitled banner"}
              disabled={busy || bannerUploading}
              onReorder={(items) =>
                setConfig((previous) =>
                  previous ? { ...previous, banners: items } : previous
                )
              }
            >
              {(item, index) => (
                <div
                  key={item.id}
                  className={`rounded-lg border p-3 ${
                    selectedBannerId === item.id
                      ? "border-ui-border-interactive bg-ui-bg-subtle"
                      : "border-ui-border-base"
                  }`}
                >
                  <button
                    type="button"
                    className="min-h-11 w-full pr-10 text-left"
                    onClick={() => setSelectedBannerId(item.id)}
                  >
                    <span className="text-xs text-ui-fg-subtle">
                      {index + 1}. Banner{!item.enabled ? " · Hidden" : ""}
                    </span>
                    <p className="mt-1 truncate text-sm font-medium">
                      {item.headline || "Untitled banner"}
                    </p>
                  </button>
                  <div className="mt-2 flex gap-1">
                    <Button
                      size="small"
                      variant="transparent"
                      aria-label={`Move banner ${index + 1} up`}
                      disabled={index === 0}
                      onClick={() =>
                        setConfig({
                          ...config,
                          banners: move(config.banners, index, -1),
                        })
                      }
                    >
                      ↑
                    </Button>
                    <Button
                      size="small"
                      variant="transparent"
                      aria-label={`Move banner ${index + 1} down`}
                      disabled={index === config.banners.length - 1}
                      onClick={() =>
                        setConfig({
                          ...config,
                          banners: move(config.banners, index, 1),
                        })
                      }
                    >
                      ↓
                    </Button>
                    <Button
                      size="small"
                      variant="transparent"
                      aria-label={`Remove banner ${index + 1}`}
                      onClick={() => {
                        const remaining = config.banners.filter(
                          (value) => value.id !== item.id
                        );
                        setConfig({ ...config, banners: remaining });
                        if (selectedBannerId === item.id)
                          setSelectedBannerId(remaining[0]?.id ?? null);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )}
            </LandingSortableList>
            {!config.banners.length && (
              <p className="text-xs text-ui-fg-subtle">
                No banners. Add one to show the carousel.
              </p>
            )}
            <Button
              variant="secondary"
              className="w-full"
              disabled={config.banners.length >= 8}
              onClick={() => {
                const next = makeBanner();
                setConfig({ ...config, banners: [...config.banners, next] });
                setSelectedBannerId(next.id);
              }}
            >
              + Add banner
            </Button>
          </Container>
          <Container className="space-y-3">
            <Heading level="h2">Sections</Heading>
            <p className="text-xs text-ui-fg-subtle">
              Choose a section to edit. Drag its handle to change the order.
            </p>
            <LandingSortableList
              items={config.sections}
              label="Sections order"
              getLabel={(item) => item.title || "Untitled section"}
              disabled={busy || bannerUploading}
              onReorder={(items) =>
                setConfig((previous) =>
                  previous ? { ...previous, sections: items } : previous
                )
              }
            >
              {(item, index) => (
                <div
                  key={item.id}
                  className={`rounded-lg border p-2 ${
                    item.id === selectedId && !selectedBannerId
                      ? "border-ui-border-interactive bg-ui-bg-highlight"
                      : "border-ui-border-base"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => selectSection(item.id)}
                    className="min-h-11 w-full pr-10 text-left"
                  >
                    <span className="text-xs text-ui-fg-subtle">
                      {index + 1}.{" "}
                      {item.type === "products" ? "Product tray" : "Link tray"}
                      {!item.enabled ? " · Hidden" : ""}
                    </span>
                    <p className="mt-1 truncate text-sm font-medium">
                      {item.title || "Untitled section"}
                    </p>
                  </button>
                  <div className="mt-2 flex gap-1">
                    <Button
                      size="small"
                      variant="transparent"
                      aria-label={`Move ${item.title} up`}
                      disabled={index === 0}
                      onClick={() =>
                        setConfig({
                          ...config,
                          sections: move(config.sections, index, -1),
                        })
                      }
                    >
                      ↑
                    </Button>
                    <Button
                      size="small"
                      variant="transparent"
                      aria-label={`Move ${item.title} down`}
                      disabled={index === config.sections.length - 1}
                      onClick={() =>
                        setConfig({
                          ...config,
                          sections: move(config.sections, index, 1),
                        })
                      }
                    >
                      ↓
                    </Button>
                    <Button
                      size="small"
                      variant="transparent"
                      onClick={() => {
                        const remaining = config.sections.filter(
                          (value) => value.id !== item.id
                        );
                        setConfig({ ...config, sections: remaining });
                        if (selectedId === item.id)
                          setSelectedId(remaining[0]?.id ?? null);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )}
            </LandingSortableList>
            <Button
              variant="secondary"
              className="w-full"
              disabled={config.sections.length >= 12}
              onClick={() => addSection("products")}
            >
              + Product tray
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              disabled={config.sections.length >= 12}
              onClick={() => addSection("links")}
            >
              + Link tray
            </Button>
          </Container>
        </div>
        <Container className="min-w-0 space-y-5">
          {banner ? (
            <BannerEditor
              key={banner.id}
              banner={banner}
              update={updateBanner}
              onUploading={setBannerUploading}
            />
          ) : section ? (
            <>
              <div className="flex items-center justify-between">
                <Heading level="h2">
                  {section.type === "products" ? "Product tray" : "Link tray"}
                </Heading>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={section.enabled}
                    onChange={(event) =>
                      updateSection({ enabled: event.target.checked })
                    }
                  />
                  Visible
                </label>
              </div>
              <Field
                label="Eyebrow"
                hint="Optional small label above the heading."
              >
                <Input
                  value={section.eyebrow}
                  maxLength={60}
                  onChange={(event) =>
                    updateSection({ eyebrow: event.target.value })
                  }
                  placeholder="JUST IN"
                />
              </Field>
              <Field label="Heading">
                <Input
                  value={section.title}
                  maxLength={100}
                  onChange={(event) =>
                    updateSection({ title: event.target.value })
                  }
                />
              </Field>
              <Field label="Subtitle">
                <Textarea
                  value={section.subtitle}
                  maxLength={200}
                  onChange={(event) =>
                    updateSection({ subtitle: event.target.value })
                  }
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Section link text">
                  <Input
                    value={section.link_label}
                    onChange={(event) =>
                      updateSection({ link_label: event.target.value })
                    }
                    placeholder="Shop all"
                    maxLength={40}
                  />
                </Field>
                <Field label="Section link destination">
                  <Input
                    value={section.link_href}
                    onChange={(event) =>
                      updateSection({ link_href: event.target.value })
                    }
                    placeholder="/store"
                  />
                </Field>
              </div>
              {section.type === "products" ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Product source">
                      <select
                        className={selectClass}
                        value={section.source}
                        onChange={(event) =>
                          updateSection({
                            source: event.target
                              .value as LandingSection["source"],
                          })
                        }
                      >
                        <option value="latest">Latest arrivals</option>
                        <option value="collection">A collection</option>
                        <option value="selected">Handpicked products</option>
                      </select>
                    </Field>
                    <Field label="Maximum products">
                      <select
                        className={selectClass}
                        value={section.product_limit}
                        onChange={(event) =>
                          updateSection({
                            product_limit: Number(event.target.value),
                          })
                        }
                      >
                        {Array.from({ length: 12 }, (_, index) => (
                          <option key={index + 1} value={index + 1}>
                            {index + 1}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  {section.source === "collection" && (
                    <Field label="Collection">
                      <select
                        className={selectClass}
                        value={section.collection_id}
                        onChange={(event) =>
                          updateSection({ collection_id: event.target.value })
                        }
                      >
                        <option value="">Choose a collection</option>
                        {collections.map((collection) => (
                          <option key={collection.id} value={collection.id}>
                            {collection.title}
                          </option>
                        ))}
                      </select>
                    </Field>
                  )}
                  {section.source === "selected" && (
                    <ProductPicker
                      key={section.id}
                      section={section}
                      onChange={updateSection}
                    />
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  {section.cards.map((card, index) => (
                    <details
                      key={card.id}
                      className="rounded-lg border border-ui-border-base p-4"
                      open={section.cards.length === 1 || undefined}
                    >
                      <summary className="cursor-pointer text-sm font-medium">
                        {index + 1}. {card.title || "Untitled card"}
                      </summary>
                      <div className="mt-4">
                        <CardEditor
                          card={card}
                          update={(patch) =>
                            updateSection({
                              cards: section.cards.map((item) =>
                                item.id === card.id
                                  ? { ...item, ...patch }
                                  : item
                              ),
                            })
                          }
                        />
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button
                          size="small"
                          variant="secondary"
                          disabled={index === 0}
                          onClick={() =>
                            updateSection({
                              cards: move(section.cards, index, -1),
                            })
                          }
                        >
                          Move left
                        </Button>
                        <Button
                          size="small"
                          variant="secondary"
                          disabled={index === section.cards.length - 1}
                          onClick={() =>
                            updateSection({
                              cards: move(section.cards, index, 1),
                            })
                          }
                        >
                          Move right
                        </Button>
                        <Button
                          size="small"
                          variant="transparent"
                          onClick={() =>
                            updateSection({
                              cards: section.cards.filter(
                                (item) => item.id !== card.id
                              ),
                            })
                          }
                        >
                          Remove card
                        </Button>
                      </div>
                    </details>
                  ))}
                  <Button
                    variant="secondary"
                    disabled={section.cards.length >= 8}
                    onClick={() =>
                      updateSection({ cards: [...section.cards, makeCard()] })
                    }
                  >
                    + Add link card
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="py-16 text-center text-sm text-ui-fg-subtle">
              Add a section to start building your page.
            </div>
          )}
        </Container>
        <Container className="h-fit space-y-4 xl:sticky xl:top-6">
          <Heading level="h2">Layout preview</Heading>
          <p className="text-xs text-ui-fg-subtle">
            Your draft, in display order. Product trays populate from the live
            catalog.
          </p>
          <div className="overflow-hidden rounded-xl border border-ui-border-base bg-[#f5f5f7] text-[#1d1d1f]">
            {config.hero_enabled &&
              config.banners
                .filter((item) => item.enabled)
                .map((item, index) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setSelectedBannerId(item.id)}
                    className="block w-full border-b border-black/5 p-4 text-left"
                    style={{ background: item.background }}
                  >
                    <p className="text-[9px] uppercase tracking-wider text-[#6e6e73]">
                      Banner {index + 1} · {item.eyebrow}
                    </p>
                    <p className="mt-2 whitespace-pre-line break-words text-sm font-semibold">
                      {item.headline}
                    </p>
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt=""
                        className="mt-2 h-20 w-full object-contain"
                      />
                    )}
                    <p className="mt-2 text-[10px] text-[#6e6e73]">
                      {item.action} ↗
                    </p>
                  </button>
                ))}
            <div className="bg-white p-4 text-center text-xs text-blue-600">
              {config.explore_label} ↗
            </div>
            {config.sections
              .filter((item) => item.enabled)
              .map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => selectSection(item.id)}
                  className="block w-full p-4 text-left hover:bg-black/5"
                >
                  <p className="text-[8px] tracking-widest text-gray-500">
                    {item.eyebrow}
                  </p>
                  <p className="mt-1 text-sm font-semibold">{item.title}</p>
                  <div className="mt-3 flex gap-2 overflow-hidden">
                    {Array.from(
                      {
                        length: Math.min(
                          3,
                          item.type === "links"
                            ? item.cards.length
                            : item.product_limit
                        ),
                      },
                      (_, index) => (
                        <div
                          key={index}
                          className="flex h-20 w-16 shrink-0 items-end rounded-lg p-2 text-[8px]"
                          style={{
                            background:
                              item.type === "links"
                                ? tones[item.cards[index].tone]
                                : "white",
                          }}
                        >
                          {item.type === "links"
                            ? item.cards[index].title
                            : "Product"}
                        </div>
                      )
                    )}
                  </div>
                </button>
              ))}
          </div>
          <p className="text-xs text-ui-fg-subtle">
            Save a draft anytime. Publish when you’re ready. Live updates appear
            after the next cache refresh (30-second revalidation).
          </p>
        </Container>
      </fieldset>
    </div>
  );
};

export const config = defineRouteConfig({ label: "Landing Page" });
export default LandingPageEditor;
