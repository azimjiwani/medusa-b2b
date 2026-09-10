# Storefront mobile requirement

Mobile usability is required for every storefront change, including loading, empty, error, and authenticated states. Do not approve a page based only on a desktop preview.

## Acceptance checks

- Check 320px, 390px, and 768px widths, plus desktop; include a short 568px phone viewport for dialogs.
- No document-level horizontal scrolling, clipped text, overlapping controls, or inaccessible actions. Horizontal product trays must scroll within their own container.
- Forms stack on narrow phones. Inputs use at least 16px text on mobile to avoid iOS focus zoom.
- Primary touch controls have 44px targets. Product gallery thumbnails are real, named buttons.
- Product, account, and checkout content must shrink within grid columns. Long names, SKUs, addresses, and emails must wrap.
- Dialog content and actions remain reachable by scrolling. Quantity controls preserve stock limits, and wholesale pricing stays restricted.
- Check filters, search, pagination, image selection, cart editing, addresses, checkout, and account navigation when changing their shared components.

## Local verification, September 10, 2026

Browser document-width checks passed at 320/390/768px for home, store, search results, category, collection (empty state), product details, empty cart, privacy policy, terms of sale, and password-reset invalid-link state. Login and registration were visually checked at 320px. Product details and the search overlay were visually checked on phones, including the 320x568 overlay.

The browser was signed out. Populated cart, approved-customer variant ordering, checkout/payment, account dashboards, orders, and quotes were reviewed in code rather than exercised with a live signed-in customer. Unit coverage verifies image selection, quantity limits, price visibility, filtering, and pagination data; it does not replace signed-in browser verification or physical-device keyboard testing.

Run storefront automated checks with `yarn test`. The repository has existing TypeScript errors; compare diagnostics against the baseline and introduce none.
