import { Button, Input } from "@medusajs/ui";
import { useEffect, useState } from "react";
import { sdk } from "../lib/client";
import { LandingSortableList } from "./landing-sortable-list";

type ProductChoice = {
  id: string;
  title: string;
  thumbnail?: string | null;
  variants?: { sku?: string | null }[] | null;
};
function move<T>(items: T[], index: number, direction: number): T[] {
  const result = [...items];
  const destination = index + direction;
  if (destination < 0 || destination >= items.length) return result;
  [result[index], result[destination]] = [result[destination], result[index]];
  return result;
}

export function ProductPicker({
  productIds,
  onChange,
  maxProducts = 12,
  sortable = false,
  disabled = false,
  categoryId,
}: {
  productIds: string[];
  onChange: (ids: string[]) => void;
  maxProducts?: number;
  sortable?: boolean;
  disabled?: boolean;
  categoryId?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductChoice[]>([]);
  const [selected, setSelected] = useState<Record<string, ProductChoice>>({});
  const [selectedError, setSelectedError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    const timer = setTimeout(async () => {
      try {
        const { products } = await sdk.admin.product.list({
          q: query.trim() || undefined,
          limit: 12,
          fields: "id,title,thumbnail,variants.sku",
          status: ["published"],
          ...(categoryId ? { category_id: [categoryId] } : {}),
        });
        if (active) {
          setResults(products);
          setError("");
        }
      } catch {
        if (active) {
          setResults([]);
          setError("Could not search products. Try again.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, retry, categoryId]);
  useEffect(() => {
    let active = true;
    setSelectedError("");
    if (productIds.length) {
      const batches: string[][] = [];
      for (let offset = 0; offset < productIds.length; offset += 100) {
        batches.push(productIds.slice(offset, offset + 100));
      }
      Promise.all(
        batches.map((ids) =>
          sdk.admin.product.list({
            id: ids,
            limit: Math.min(maxProducts, 100),
            fields: "id,title,thumbnail",
          }),
        ),
      )
        .then((pages) => {
          const products = pages.flatMap((page) => page.products);
          if (active)
            setSelected(
              Object.fromEntries(
                products.map((product) => [product.id, product]),
              ),
            );
        })
        .catch(() => {
          if (active)
            setSelectedError("Some selected products could not be loaded.");
        });
    }
    return () => {
      active = false;
    };
  }, [productIds, maxProducts]);
  const renderSelected = (productId: string, index: number) => (
    <div
      key={productId}
      className={`flex flex-wrap items-center gap-2 rounded-lg bg-ui-bg-subtle p-2 text-sm ${sortable ? "pr-14" : ""}`}
    >
      <span className="min-w-0 flex-1 break-words">
        {sortable && (
          <span className="mr-2 text-ui-fg-subtle">{index + 1}.</span>
        )}
        {selected[productId]?.title || productId}
      </span>
      <Button
        size="small"
        variant="secondary"
        aria-label={`Move product ${index + 1} up`}
        disabled={index === 0}
        onClick={() => onChange(move(productIds, index, -1))}
      >
        ↑
      </Button>
      <Button
        size="small"
        variant="secondary"
        aria-label={`Move product ${index + 1} down`}
        disabled={index === productIds.length - 1}
        onClick={() => onChange(move(productIds, index, 1))}
      >
        ↓
      </Button>
      <Button
        size="small"
        variant="transparent"
        onClick={() =>
          onChange(productIds.filter((value) => value !== productId))
        }
      >
        Remove
      </Button>
    </div>
  );
  return (
    <div className="space-y-3">
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium">Find products</span>
        <span className="text-xs text-ui-fg-subtle">
          Search by product name or SKU. Partial SKUs work too.
        </span>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search product names or SKUs…"
        />
      </label>
      {error && (
        <div className="space-y-2">
          <p role="alert" className="text-sm text-ui-fg-error">
            {error}
          </p>
          <Button
            variant="secondary"
            size="small"
            disabled={loading}
            onClick={() => setRetry((value) => value + 1)}
          >
            Retry search
          </Button>
        </div>
      )}
      <div className="max-h-48 overflow-auto rounded-lg border border-ui-border-base">
        {loading && <p className="p-3 text-sm text-ui-fg-subtle">Searching…</p>}
        {!loading && !error && !results.length && (
          <p className="p-3 text-sm text-ui-fg-subtle">No matching products.</p>
        )}
        {results.map((product) => {
          const skus = [
            ...new Set(
              product.variants?.flatMap((variant) =>
                variant.sku ? [variant.sku] : [],
              ) ?? [],
            ),
          ];
          const matchingSkus = query.trim()
            ? skus.filter((sku) =>
                sku.toLowerCase().includes(query.trim().toLowerCase()),
              )
            : [];
          const displayedSkus = matchingSkus.length ? matchingSkus : skus;
          return (
            <button
              type="button"
              key={product.id}
              disabled={
                productIds.includes(product.id) ||
                productIds.length >= maxProducts
              }
              onClick={() => {
                setSelected((previous) => ({
                  ...previous,
                  [product.id]: product,
                }));
                onChange([...productIds, product.id]);
              }}
              className="flex w-full items-center gap-3 border-b border-ui-border-base px-3 py-2 text-left text-sm last:border-0 hover:bg-ui-bg-subtle disabled:opacity-40"
            >
              {product.thumbnail && (
                <img
                  src={product.thumbnail}
                  alt=""
                  className="h-9 w-9 rounded object-contain"
                />
              )}
              <span className="min-w-0 flex-1 break-words">
                <span className="block">{product.title}</span>
                {displayedSkus.length > 0 && (
                  <span className="mt-1 block text-xs text-ui-fg-subtle">
                    SKU: {displayedSkus.slice(0, 3).join(", ")}
                    {displayedSkus.length > 3
                      ? ` +${displayedSkus.length - 3} more`
                      : ""}
                  </span>
                )}
              </span>
              <span>{productIds.includes(product.id) ? "Added" : "+ Add"}</span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-ui-fg-subtle">
        Selected products appear in this order. Unpublished or unavailable
        products are hidden on the storefront.
      </p>
      {selectedError && (
        <p role="alert" className="text-sm text-ui-fg-error">
          {selectedError}
        </p>
      )}
      {sortable ? (
        <LandingSortableList
          items={productIds.map((id) => ({ id }))}
          label="Featured product order"
          getLabel={({ id }) => selected[id]?.title || id}
          disabled={disabled}
          onReorder={(items) => onChange(items.map((item) => item.id))}
        >
          {({ id }, index) => renderSelected(id, index)}
        </LandingSortableList>
      ) : (
        productIds.map((id, index) => renderSelected(id, index))
      )}
    </div>
  );
}
