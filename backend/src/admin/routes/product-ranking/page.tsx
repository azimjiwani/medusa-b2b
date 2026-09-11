import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Button, Container, Heading, Toaster, toast } from "@medusajs/ui";
import { useEffect, useState } from "react";
import { sdk } from "../../lib/client";
import { ProductPicker } from "../../components/product-picker";
import type { ProductRankingConfig } from "../../../utils/product-ranking-config";

type PageState = {
  draft: ProductRankingConfig;
  published: ProductRankingConfig;
  saved_at: string | null;
  published_at: string | null;
};
type Category = { id: string; name: string };

async function loadCategories() {
  const categories: Category[] = [];
  let offset = 0;
  let count = 0;
  do {
    const page = await sdk.admin.productCategory.list({
      limit: 100,
      offset,
      fields: "id,name",
    });
    categories.push(...page.product_categories);
    count = page.count;
    if (!page.product_categories.length) break;
    offset += page.product_categories.length;
  } while (offset < count);
  return categories.sort((a, b) => a.name.localeCompare(b.name));
}

export default function ProductRankingPage() {
  const [state, setState] = useState<PageState | null>(null);
  const [draft, setDraft] = useState<ProductRankingConfig | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setError("");
    Promise.all([
      sdk.client.fetch<PageState>("/admin/product-ranking"),
      loadCategories(),
    ])
      .then(([data, items]) => {
        if (!active) return;
        setState(data);
        setDraft(data.draft);
        setCategories(items);
      })
      .catch(() => {
        if (active) setError("Could not load product rankings. Try again.");
      });
    return () => {
      active = false;
    };
  }, [retry]);

  async function save(action: "save" | "publish") {
    if (!draft || busy) return;
    setBusy(true);
    setError("");
    try {
      const data = await sdk.client.fetch<PageState>("/admin/product-ranking", {
        method: "POST",
        body: { action, config: draft },
      });
      setState(data);
      setDraft(data.draft);
      toast.success(
        action === "publish"
          ? "Rankings published. Storefront changes appear within 30 seconds."
          : "Draft saved. Published rankings are unchanged.",
      );
    } catch {
      setError(
        "Could not save product rankings. Your edits are still here; try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!draft || !state)
    return (
      <Container className="space-y-4">
        <Heading>Product Ranking</Heading>
        <p role={error ? "alert" : "status"}>
          {error || "Loading product rankings…"}
        </p>
        {error && (
          <Button
            variant="secondary"
            onClick={() => setRetry((value) => value + 1)}
          >
            Retry
          </Button>
        )}
      </Container>
    );

  const productIds = categoryId
    ? (draft.categories.find((item) => item.category_id === categoryId)
        ?.product_ids ?? [])
    : draft.product_ids;
  const dirty = JSON.stringify(draft) !== JSON.stringify(state.draft);
  const updateProducts = (product_ids: string[]) =>
    setDraft((current) => {
      if (!current) return current;
      if (!categoryId) return { ...current, product_ids };
      return {
        ...current,
        categories: [
          ...current.categories.filter(
            (item) => item.category_id !== categoryId,
          ),
          { category_id: categoryId, product_ids },
        ],
      };
    });
  // Keep old category rankings editable if their categories have been deleted.
  const missingCategories = draft.categories.filter(
    (item) => !categories.some((category) => category.id === item.category_id),
  );

  return (
    <div className="space-y-6">
      <Toaster />
      <Container className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Heading level="h1">Product Ranking</Heading>
            <p className="max-w-2xl text-sm text-ui-fg-subtle">
              Choose which products lead when customers sort by Featured. Ranked
              products appear in your order, followed by all other matching
              products, newest first.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => save("save")}
            >
              Save draft
            </Button>
            <Button disabled={busy} onClick={() => save("publish")}>
              {busy ? "Saving…" : "Publish changes"}
            </Button>
          </div>
        </div>
        <p className="text-xs text-ui-fg-subtle">
          {dirty
            ? "Unsaved changes. "
            : state.saved_at
              ? "Draft saved. "
              : "No saved draft yet. "}
          {state.published_at
            ? `Last published ${new Date(state.published_at).toLocaleString()}.`
            : "No rankings published yet."}{" "}
          Saving or publishing includes every category ranking.
        </p>
        {error && (
          <p role="alert" className="text-sm text-ui-fg-error">
            {error}
          </p>
        )}
      </Container>
      <Container className="space-y-5">
        <fieldset disabled={busy} className="min-w-0 space-y-5">
          <label className="flex max-w-xl flex-col gap-2 text-sm">
            <span className="font-medium">Ranking for</span>
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="h-11 rounded-md border border-ui-border-base bg-ui-bg-field px-3 text-ui-fg-base"
            >
              <option value="">All products / multiple categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
              {missingCategories.map((item) => (
                <option key={item.category_id} value={item.category_id}>
                  Unavailable category ({item.category_id})
                </option>
              ))}
            </select>
          </label>
          <p className="text-sm text-ui-fg-subtle">
            {categoryId
              ? "This order applies when this category is selected, including its brand, device, and search filters. Only matching products appear."
              : "This order applies to the all-products view and to views with multiple categories selected, including brand, device, and search filters."}{" "}
            An empty ranking uses Latest Arrivals.
          </p>
          <div className="flex items-center justify-between gap-3">
            <Heading level="h2">Featured order ({productIds.length})</Heading>
          </div>
          <p className="text-sm text-ui-fg-subtle">
            Add up to 500 products. Drag the handles or use the arrows to change
            their order.
          </p>
          <ProductPicker
            key={categoryId || "all"}
            productIds={productIds}
            onChange={updateProducts}
            maxProducts={500}
            sortable
            disabled={busy}
            categoryId={categoryId || undefined}
          />
        </fieldset>
      </Container>
    </div>
  );
}

export const config = defineRouteConfig({ label: "Product Ranking" });
