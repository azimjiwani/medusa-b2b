# Product ranking

Open **Product Ranking** in the Medusa admin sidebar.

1. Choose **All products / multiple categories** or a specific category.
2. Search by product name or SKU and add products. Category searches show published products in that category.
3. Drag the handles or use the up/down buttons to set the order. Remove a product to return it to normal Latest Arrivals ordering. Each ranking supports up to 500 products.
4. **Save draft** preserves all edited rankings without changing the storefront. **Publish changes** publishes the complete draft, including all category rankings. Published changes reach the storefront after its 30-second ranking cache refresh.

**Featured** is the default storefront sort. Customers can still choose Latest Arrivals, name, or price sorting.

- No selected category: use the overall ranking.
- Exactly one selected category: use that category's ranking.
- Multiple selected categories: use the overall ranking.
- A category without a ranking uses Latest Arrivals; it does not inherit the overall ranking.
- Brand, device, collection, and search filters still apply. Only matching published/available products appear, with ranked matches first. All remaining matches follow newest-first `created_at` ordering, with product ID breaking timestamp ties.
- Rankings apply before pagination, so products are neither duplicated nor lost at the transition from featured products to latest arrivals.
- An empty ranking behaves like Latest Arrivals. Existing homepage product trays retain their own configured ordering.

The editor has the same draft/publish pattern as Landing Page. Its product picker and drag controls are shared with that editor. Concurrent editors should coordinate: saving replaces the complete ranking draft and the last save wins.

## Storage and API

Configuration lives in `store.metadata.bnt_product_ranking`, containing separate `draft`, `published`, `saved_at`, and `published_at` properties. Saves preserve other store metadata, including the landing page configuration. No migration is required.

Each configuration contains an ordered `product_ids` array for the overall ranking and a `categories` array of `{ category_id, product_ids }`. Duplicate products within a ranking and duplicate category entries are rejected. A product can appear in multiple different rankings.

- `GET /admin/product-ranking`: draft and published state, protected by normal Medusa admin authentication.
- `POST /admin/product-ranking`: `{ action: "save" | "publish", config }`.
- `GET /store/product-ranking`: published configuration only, protected by the standard publishable API key. No draft or unrelated metadata is exposed.

Featured catalog sorting fetches the matching product ID/date index in batches of 100, applies the ranking, then loads full details only for the requested page. Search applies the same published ranking inside the backend catalog-search endpoint before pagination, keeping search candidate IDs out of storefront URLs. All queries preserve filters and customer/region context. Empty ranking configuration uses native Latest Arrivals pagination. The existing 60-second product cache still governs catalog availability and details; search responses are not cached by the storefront.

Deploy backend and storefront changes together. Implementing or testing the editor does not publish a ranking; an administrator selects products and publishes when ready.
