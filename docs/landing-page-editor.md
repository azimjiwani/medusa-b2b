# Landing page editor

Open **Landing Page** in the Medusa admin sidebar.

- Toggle the banner carousel and edit the Explore link.
- Add up to eight banners. Edit each banner’s eyebrow, multiline headline, description, button text, destination, and background color.
- Upload a PNG, JPEG, WebP, or AVIF image (up to 5 MB), or enter an image URL. Add an image description for accessibility. Without an image, the banner uses the selected built-in illustration.
- Reorder banners by dragging the six-dot handle (mouse or touch), or use the arrows, hide them with the Visible checkbox, or remove them. A single banner displays without carousel controls; removing every banner hides the carousel.
- Add up to 12 sections, choosing product trays or link trays.
- Edit each section’s heading, subtitle, optional eyebrow, and optional destination link.
- Populate product trays with latest arrivals, a collection, or up to 12 handpicked products. Find handpicked products by name or full/partial SKU; results show their variant SKUs. Selected products can be reordered.
- Add up to eight destination cards per link tray. Each supports a title, description, site path, uploaded image or image URL, illustration, and background color.
- Reorder sections by dragging the six-dot handle or with the arrow buttons or hide them with the Visible checkbox.
- **Save draft** preserves edits without changing the live page. **Publish changes** makes the current configuration public. Public configuration revalidates after 30 seconds.

Drag handles also support the keyboard: focus a handle, press Space to pick up, use the up/down arrow keys, and press Space to drop. Escape cancels. Reordering updates the draft in the editor; save or publish to persist it.

Destinations use country-independent site paths such as `/store`, `/store?category=phones`, `/collections/accessories`, or `/account`. The storefront adds the visitor’s current country code.

The default layout contains latest arrivals and a destination-card tray. Empty product selections, unavailable collections, and product sources with no published products do not render a tray. A source failure does not prevent other sections from rendering.

## Storage and endpoints

Configuration is stored under `store.metadata.bnt_landing_page`, with separate `draft`, `published`, `saved_at`, and `published_at` properties. No database migration or external CMS service is required. Saving preserves other store metadata. Existing configurations without a `banners` field receive the three current starter banners automatically, preserving their sections. An explicitly empty banner list stays empty.

- `GET /admin/landing-page` returns the draft and published state; standard Medusa admin authentication applies.
- `POST /admin/landing-page` takes `{ action: "save" | "publish", config }`. Publishing validates the complete layout. Drafts can contain unfinished product selections and banner copy. Visible banners require a headline, button text, and destination before publishing.
- `GET /store/landing-page` returns only the published configuration, enabled banners (when the carousel is enabled), and enabled sections. It uses Medusa’s normal publishable-key protection.

Product data is fetched through the existing store API with region and customer pricing context. Each tray fetches at most 12 full products and keeps the existing 60-second revalidation. Prices remain hidden from guests and unapproved accounts. CMS layout data contains no product prices.

The admin preview shows layout and order, not live customer-specific prices. Two administrators should avoid editing the layout simultaneously: saving currently replaces the whole draft and the last save wins.

Deploy both backend and storefront for the editor to be available. The storefront keeps its original homepage fallback if the configuration endpoint cannot be reached.
