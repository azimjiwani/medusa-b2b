# Safe Medusa Upgrade Plan

## Objective

Upgrade the Medusa backend from `2.10.1` to a release that supports reusable global Product Options and storefront filtering by option values, while preserving all currently shipped B2B behavior.

The minimum acceptable target is a patched `2.17.x` release newer than `2.17.0`. Medusa explicitly warns against `2.17.0` because of a worker regression. Before implementation starts, resolve and record one exact target version after reviewing the official release notes from `2.10.1` through that target. Prefer the current stable release if the additional `2.18`/`2.19` migration work is small; otherwise use the latest safe `2.17.x` patch and document why.

This upgrade and the Product Options feature must be separate changes:

1. Upgrade Medusa and prove that existing behavior is unchanged.
2. Add the eight global options, inventory synchronization, backfill, and storefront filters in a follow-up change.

That separation is a release gate. Do not mix option ingestion or UI changes into the framework-upgrade diff.

## Pre-implementation gate — recorded September 3, 2026

### Approved exact target

Upgrade to **Medusa `2.17.2`**, approved on September 3, 2026.

Why:

- `2.17.2` is the latest patched `2.17.x` release and contains the global Product Options capability required by this project.
- `2.17.0` is excluded by Medusa's documented Redis worker startup regression; `2.17.1` fixes that regression.
- `2.18.0` changes the default database relation-loading strategy and generated internal-service delete contracts. It is still the only `2.18.x` release, and an open upstream issue reports order-total queries failing on that version. This application has extensive custom order, quote, fulfillment, payment, and invoice query paths.
- `2.19.0` adds a Vite 7 and React Router 7 Admin migration plus stricter Node requirements. It is still the only `2.19.x` release, and an open upstream issue reports unbounded cache invalidation work in server processes. Those changes and risks are not small enough to justify expanding this upgrade.

Official release notes were reviewed for every published stable release from `2.10.2` through `2.17.2`. Patch releases without an application-specific breaking change remain in scope for their fixes and migrations. The applicable minor-release work is:

| Boundary | Repository applicability |
| --- | --- |
| `2.11` | High: direct `pg` usage exists in six services/routes/scripts; direct MikroORM imports exist in custom migrations and integration setup. Run and inspect Medusa's dependency-import codemod. Test every raw-SQL path. The storefront currently treats null inventory as a quantity of `100` in two cart components, which must be corrected and covered before the version bump. |
| `2.12` | Medium: no custom code directly reads the renamed Shipping Option Type relation, but seed and checkout/fulfillment paths create and consume shipping options. Cover those contracts and the required order-adjustment data migration. |
| `2.13` | High: fourteen backend/Admin files import Zod directly. Move them to the framework export. No direct custom `manager.find` call was found, but direct SQL remains in scope. Inspect custom-module snapshots before and after migrations because `2.15.2` fixed a snapshot-corruption regression introduced after the MikroORM update. |
| `2.14` | High: migrate the fourteen custom validators/forms to Zod 4 and compile all custom HTTP-type consumers. Pin React-compatible UI/Icon packages instead of retaining storefront `latest` ranges. |
| `2.15` | Medium: seeded product weights are already numeric; inspect production-shaped product and variant dimensions before and after the float migration. Use `2.15.5` fixes transitively through the target. |
| `2.16` | Medium: no custom verification route, verification event, `require_verification`, or four-argument SDK registration usage was found. The storefront's three-argument `auth.register` call is already compatible. Remove the backend's `supersecret` fallbacks, require environment-provided JWT/cookie secrets, and regression-test auth. |
| `2.17` | High: run and verify Product Option and auth-verification migrations. Five custom Admin widgets use `.before`/`.after` injection zones whose ordering changes in `2.17.2`; verify and configure their placement through the Admin Layout Composer. Never install `2.17.0`. |

Primary target references:

- [Medusa 2.17.0 release notes](https://github.com/medusajs/medusa/releases/tag/v2.17.0)
- [Medusa 2.17.1 worker-regression fix](https://github.com/medusajs/medusa/releases/tag/v2.17.1)
- [Medusa 2.17.2 release notes](https://github.com/medusajs/medusa/releases/tag/v2.17.2)
- [Medusa 2.18.0 release notes](https://github.com/medusajs/medusa/releases/tag/v2.18.0)
- [Medusa 2.19.0 release notes](https://github.com/medusajs/medusa/releases/tag/v2.19.0)
- [Open 2.18.0 order-total query issue](https://github.com/medusajs/medusa/issues/16240)
- [Open 2.19.0 cache-invalidation issue](https://github.com/medusajs/medusa/issues/16474)

### Compatibility table

Pin these versions before regenerating the two application lockfiles:

| Component | Current resolved | Upgrade target |
| --- | --- | --- |
| Backend Medusa packages | `2.10.1` | `2.17.2` |
| Admin SDK | `2.10.1` | `2.17.2` |
| JS SDK and HTTP types | backend/storefront `2.10.1` | `2.17.2` |
| Medusa UI | backend `4.0.6`; storefront `4.0.21` | `4.1.19`, matching the `2.17.2` Admin dashboard |
| Medusa Icons | `2.10.1` | `2.17.2` |
| React / React DOM | resolved `18.3.1` | retain `18.3.1` |
| Next.js | `15.3.8` | retain `15.3.8` during the framework upgrade |
| Zod | backend `3.25.76`; storefront `3.22.4` | backend `4.2.0`; evaluate storefront separately and do not upgrade it as an accidental transitive change |
| Node | repository expects Node 20; local shell was `24.2.0` | pin a supported Node 20 LTS release for local/CI/deploy parity |
| Package manager | manifests specify Yarn `4.4.0`; bare root `yarn` is `1.22.22` locally | use `corepack yarn` from each application directory |

The storefront also resolves legacy `@medusajs/medusa@1.17.2`, `medusa-react@9.0.18`, MikroORM 5, and Medusa v1 utility packages. Remove them only after proving their callers are absent or replacing them in a separately reviewable dependency-cleanup commit.

### Verified safe local startup

Do not start the backend with the checked-in local `.env` values. They include non-local or unverified database, Redis, Algolia, BNG, S3, and storefront-base settings.

The verified topology is:

1. Use a dedicated disposable PostgreSQL database and Redis database/namespace.
2. Override every Algolia, BNG, S3, SendGrid, and payment setting with an isolated test resource or inert local value.
3. From `backend`, use `corepack yarn install --immutable`, then run `corepack yarn medusa db:migrate` and `corepack yarn seed` against the disposable database.
4. Start the interactive backend/Admin with `MEDUSA_WORKER_MODE=server corepack yarn dev`. This API-only mode is mandatory for ordinary local UI work.
5. Obtain the publishable key created by the seed from Admin, set it as `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`, and start `storefront` with `corepack yarn dev`.
6. Verify backend health and Admin at `http://localhost:9000/health` and `http://localhost:9000/app`; verify the storefront at `http://localhost:8000` using a cookie-capable browser.

Important: ordinary shared-worker backend startup registered the `*/30` inventory cron and, at the next boundary, fetched the uncontrolled BNG feed and rewrote hundreds of records in the disposable database even with a dummy API key. No live database was mutated, but this proves dummy credentials are not a safety control. Do not start shared/worker mode until the BNG URL is injectable and points to a fixed local fixture. Product events emitted by the seed also reach the Algolia subscriber, so its target must be an isolated test index or an inert stub.

### Known-good baseline and quarantined failures

Baseline commit: `bd794d27de25a5fc989305faae3c0a3cd26ace84` on `codex/sync-wholesale-inventory`. The only working-tree item at capture time was this untracked `docs/` directory. Create the upgrade branch/worktree from that commit after target approval; do not implement the upgrade on the inventory feature branch itself.

| Check | Baseline result |
| --- | --- |
| Focused inventory unit test | Pass: 1 suite, 4 tests |
| Backend build, including Admin | Pass |
| Backend/Admin local smoke | Pass: health and Admin returned HTTP 200 in API-only mode |
| Storefront lint | Pass with no warnings or errors |
| Storefront production build | Pass when the disposable backend is running; 47 static pages generated. The build intentionally skips TypeScript validation in `next.config.js`. |
| Storefront browser smoke | Pass: cookie-capable navigation resolved to `/dk` and returned HTTP 200 |
| Standalone storefront TypeScript check | Baseline failure: existing cart/custom-response typing errors, a missing `changePassword` export, unresolved `types/*` aliases, unknown API responses, order/fulfillment type mismatches, and product-filter type errors. Quarantine with the exact error list before the dependency change; do not count these as upgrade regressions. |
| Storefront development log | Baseline warning: `src/app/[countryCode]/(main)/page.tsx` accesses `params.countryCode` synchronously under Next.js 15. |

The backend build also emits the existing AWS SDK v2 maintenance warning. The storefront emits an outdated Browserslist data warning. Record both as baseline noise unless separately fixed.

## Implementation result — September 3, 2026

The approved `2.17.2` upgrade was implemented on `codex/medusa-2-17-2-upgrade`, based on `bd794d27de25a5fc989305faae3c0a3cd26ace84`. This change contains the framework upgrade and compatibility repairs only; it does not add the planned global-option ingestion or storefront filters.

### Dependency and compatibility work

- Pinned backend Medusa packages, the Admin SDK, the JS SDK, HTTP types, icons, and UI preset to `2.17.2`; pinned Medusa UI to `4.1.19` and retained React `18.3.1`.
- Removed unused Medusa v1 storefront packages and obsolete direct backend database dependencies. Raw PostgreSQL and MikroORM imports now use the framework exports.
- Moved backend validators to the framework Zod export and upgraded the backend to Zod 4.
- Added `.nvmrc` with Node `20.19.5`; the repository remains on Yarn `4.4.0` and Next.js `15.3.8`.
- Removed fallback JWT and cookie secrets. Both values must now be supplied by the environment.
- Replaced the incompatible file-route catch-all folders with explicit named-wildcard middleware and path-containment validation.
- Made live BNG inventory synchronization fail closed outside production unless the URL is a local fixture or an explicit live-sync override is supplied.
- Made inventory-sync Medusa references configurable, normalized externally supplied SKUs into valid product handles, updated existing price rows by ID, and surfaced partial workflow failures through both API routes and the scheduled job.
- Corrected null-inventory behavior: unmanaged/backorderable variants remain purchasable, while an inventory-managed variant with no quantity is rendered and enforced as out of stock.
- Updated seed data and the upgrade migration to repair legacy double-encoded `enabled_in_store` shipping rules, assign the system tax provider to null-provider tax regions, and attach seeded products to their shipping profile.
- Updated Next.js async page parameters and corrected cart item product links and upgraded SDK call signatures encountered during checkout testing.

### Migration rehearsal

A PostgreSQL 14 database seeded on Medusa `2.10.1` was dumped, restored into a new disposable database, and migrated to `2.17.2`. A second migration run reported the database up to date. Before/after business-record counts were unchanged:

| Record | Count after migration |
| --- | ---: |
| Products | 8 |
| Variants | 16 |
| Product options | 10 |
| Product option values | 20 |
| Regions | 1 |
| Shipping options | 2 |

The migrated Product Option table contains the new boolean `is_exclusive` column. Both shipping-option rules were normalized, and all seven existing tax regions were assigned to `tp_system`.

### Local validation evidence

| Check | Result |
| --- | --- |
| Immutable dependency installs | Pass for backend and storefront with Yarn `4.4.0`; remaining peer warnings are transitive/upstream warnings. |
| Focused backend unit tests | Pass: 4 suites, 13 tests, covering product availability, BNG URL safety, inventory-sync handles/references/price updates, and upload path handling. |
| Backend and Admin production build | Pass. |
| Storefront lint | Pass with no warnings or errors. |
| Storefront production build | Pass: 103 static pages generated against the disposable upgraded backend. |
| Backend/Admin browser smoke | Pass: login, product list, customer custom widget, and the new Product Options screen. A reusable global option and value were created in the UI and verified in PostgreSQL. |
| Storefront browser smoke | Pass: approved-customer login, catalog and product detail, add to cart, address, two delivery options, E-Transfer, and order confirmation. |
| Order read-back | Pass: order `#1` persisted for the synthetic customer with Speaker Black quantity 1, €79 item total, Express Shipping €10, and €89 order total. |
| Managed zero-stock behavior | Pass: an inventory-managed variant with no inventory was rendered with disabled quantity controls and could not be added. |
| Inventory-sync rehearsal | Pass against a fixed 10-item BNG fixture and a clean clone of the migrated database. The first run updated/created inventory for 8 B2B products, deleted 1 retail-only product, created `FIXTURE-NEW-001`, and wrote the default plus three customer-group CAD prices. Database read-back confirmed quantities, links, one price per tier, and the lowercase `fixture-new-001` handle. An immediate second run reported zero inventory, deletion, and price changes. |
| Compiled worker startup | Pass with `MEDUSA_WORKER_MODE=worker`: PostgreSQL and all three Redis-backed modules connected, subscribers and scheduled jobs loaded, and the Medusa `2.17.2` worker reached ready state. |
| Standalone storefront TypeScript | The pre-existing quarantined errors remain. No new errors remain in the inventory compatibility files, shipping component, checkout form, or upgraded line-item SDK call. Next's configured production build continues to skip standalone type validation. |

All browser and database mutations above used synthetic actors and disposable local PostgreSQL/Redis resources. UI testing ran with `MEDUSA_WORKER_MODE=server`; the compiled worker was booted separately. No live BNG, Algolia, S3, email, or payment system was used.

## Safety principles

- Perform all work on an isolated upgrade branch or worktree with a clean starting state.
- Never point local testing at the production database, production Algolia index, production S3 prefix, live payment credentials, or real email recipients.
- Use a sanitized, production-shaped database snapshot where possible so migrations encounter realistic data and relationships.
- Take a restorable database dump immediately before running upgrade migrations.
- Pin every Medusa package to an exact, compatible version. Do not leave `latest` ranges in either application.
- Treat a successful build as necessary but insufficient. Validate database integrity, API contracts, background processing, Admin customizations, and every reachable user flow.
- Record every test with actor, setup, expected result, actual result, and evidence. A browser screenshot alone is not enough for mutations; confirm the resulting database/API state.
- Do not deploy until local validation and a production-shaped preview/staging rehearsal both pass.

## Known upgrade-sensitive areas

The implementation must explicitly review these release boundaries:

| Release boundary | Project-specific concern | Required action |
| --- | --- | --- |
| `2.11` | Medusa bundled MikroORM, `pg`, Awilix, and related dependencies under `@medusajs/framework`. This repository directly imports `pg` and `@mikro-orm/*` in custom routes, services, tests, scripts, and migrations. | Run Medusa's import codemod, inspect every changed import, remove obsolete direct dependencies, and exercise all direct-SQL paths. |
| `2.11` | Store product `inventory_quantity` can be `null` rather than `0`. | Verify product cards, product facts, cart quantity limits, and Admin quote inventory rendering. Preserve explicit out-of-stock semantics. |
| `2.12` | Shipping Option to Shipping Option Type changed from one-to-one to many-to-one. | Review custom fulfillment-shipping code and test shipping-option selection plus merchant fulfillment. |
| `2.13` | Zod became a framework-provided dependency. | Standardize backend imports according to the target release. |
| `2.14` | Medusa moved to Zod 4 and changed HTTP types. This repository has many custom validators and API middleware schemas. | Migrate Zod usage deliberately and add negative/positive contract tests for each custom route family. |
| `2.14` | Medusa Icons moved toward React 19 support. The storefront currently uses React 18 and unpinned `latest` Medusa UI packages. | Pin compatible UI/Icon versions; do not accidentally upgrade React as a side effect. Build and manually inspect Admin and storefront components. |
| `2.15` | Product and variant `width`, `length`, `height`, and `weight` became floats. | Inspect existing values before migration, run the migration on a database copy, and compare values afterward. |
| `2.16` | Auth verification routes and SDK behavior changed. | Test registration, login, logout, password reset, password change, sessions, and unauthorized redirects. Review custom `emailpass` usage even if verification is not enabled. |
| `2.16` | MikroORM behavior became stricter for invalid relations; Medusa build/develop may run lint. | Search custom manager/query calls for invalid relation names and make lint failures explicit instead of disabling lint silently. |
| `2.17+` | Global Product Options change the Product Option model and require database migrations. | Verify migration integrity and the new Product → Options Admin screen before implementing the option feature. Never use `2.17.0`. |

Also clean up the existing dependency mismatch:

- The backend pins Medusa packages to `2.10.1`.
- The storefront manifest mixes `latest` SDK/types/UI packages with legacy `@medusajs/medusa@1.17.2`, `medusa-react`, and older compatibility resolutions.
- The current storefront lock resolves the v2 JS SDK/types to a version older than the backend.

Create an explicit compatibility table for backend Medusa, JS SDK, HTTP types, Admin SDK, Medusa UI, Icons, React, Next.js, and Node before editing package files.

## Phase 1: Capture a known-good baseline

### 1.1 Repository and toolchain baseline

Record:

- Git commit and clean/dirty status.
- Node and Yarn versions for root, backend, and storefront.
- Exact resolved versions of every `@medusajs/*` package.
- PostgreSQL and Redis versions.
- The currently enabled Medusa modules and providers.
- Current build warnings and known failures, so they are not misattributed to the upgrade.

Run the existing focused unit test, backend build/typecheck, and storefront build before changing dependencies. If the baseline is already failing, document and resolve or explicitly quarantine each failure before proceeding.

### 1.2 Safe local service topology

Use dedicated local/test resources:

- A disposable PostgreSQL database restored from sanitized production-shaped data or seeded locally.
- A local Redis instance with an upgrade-specific key namespace/database.
- A test-only Algolia index.
- A test S3 bucket or isolated test prefix.
- An email sink such as Mailpit/MailHog, or a stub transport that records messages without delivery.
- A fixture server for the BNG inventory response. Do not run inventory synchronization against an uncontrolled live response because the workflow creates, updates, and deletes local catalog records based on that response.
- E-transfer/manual payment for the configured local checkout. If Stripe or PayPal are part of the deployed production configuration, repeat their flows using provider sandboxes only.

Verify that all local environment URLs and credentials point at these resources before starting either application. Print only resource identifiers and hosts in the evidence log; never print secrets.

### 1.3 Test actors and fixtures

Create deterministic fixtures for:

1. Anonymous visitor.
2. Newly registered/unapproved customer.
3. Approved standalone customer.
4. Approved company administrator.
5. Approved company employee below their spending limit.
6. Approved company employee above their spending limit.
7. Company with admin approval disabled.
8. Company with admin approval enabled.
9. Merchant Admin user.
10. Product with one variant and stock.
11. Product with multiple variants and option values.
12. Out-of-stock product and a low-stock product.
13. Product in a category, subcategory, and collection.
14. Existing cart, completed order, fulfillment, invoice, quote, and approval records for read compatibility.

Use synthetic addresses, phone numbers, and inboxes. Save fixture IDs in the test evidence document, not in the upgrade code.

### 1.4 Baseline data and API snapshots

Before migration, capture counts and representative payloads for:

- Products, variants, options, option values, categories, collections, tags, inventory items, and inventory levels.
- Customers, auth identities, companies, employees, customer groups, approval settings, carts, approvals, quotes, orders, payments, fulfillments, and invoices.
- Product list/detail responses including calculated prices and inventory.
- Customer/session response.
- Cart creation, cart retrieval, shipping options, payment methods, and order detail responses.
- Custom Admin and Store routes used by companies, approvals, quotes, payments, analytics, fulfillment, invoices, uploads, cache version, and search.

Normalize timestamps and volatile IDs where necessary so post-upgrade contract comparisons are meaningful.

## Phase 2: Add regression coverage before upgrading

The repository currently has very little automated coverage. Add focused tests for the upgrade-sensitive boundaries before changing dependencies.

### 2.1 Backend HTTP contract tests

Add positive, authorization, validation-error, and not-found coverage for:

- Customer registration/session retrieval and custom customer response fields.
- Password reset request and password change.
- Company retrieval/update, employee CRUD, customer-group association, and approval settings.
- Cart creation/update, bulk line items, company attachment, spending-limit enforcement, and cart approval creation.
- Approval list/update with company-admin and merchant-admin authorization.
- Quote create/read/update/message/send/accept/reject/preview flows.
- Free-shipping price calculation.
- Payment listing, partial capture, and payment reminder routes.
- Fulfillment tracking and invoice retrieval.
- Product search and Algolia result-to-product hydration.
- Upload authorization and path handling.
- Cache-version reads/updates.
- Manual inventory-sync authorization and summary contract, using a fixed BNG fixture.

### 2.2 Module and workflow tests

Add focused tests for:

- Company/employee links and customer-group membership.
- Approval aggregation and state transitions.
- Spending-limit and credit-limit calculations.
- Quote lifecycle and order creation from an accepted quote.
- Checkout validation hooks.
- Inventory synchronization create/update/delete behavior, B2B availability filtering, prices, inventory links, and idempotency.
- Algolia record preparation and subscriber behavior.
- Fulfillment shipping and invoice generation.

Do not run an exhaustive repository suite locally. Keep routine validation under ten minutes by selecting affected tests; rely on CI for the complete suite once the upgrade PR is published.

### 2.3 Frontend contract tests

Add or update focused tests for:

- Store product-list query construction and response hydration.
- Null inventory behavior.
- Authentication server actions and unauthorized redirects.
- Cart and checkout server actions.
- Account/company/approval response parsing.
- Search ID ordering and product hydration.

## Phase 3: Perform the dependency and code migration

### 3.1 Resolve the target

Before editing:

1. Read every official Medusa release note from `2.10.1` to the proposed target.
2. Write a short applicability decision for every documented breaking change.
3. Resolve the exact latest patch for the target line.
4. Confirm Node, PostgreSQL, Redis, React, Next.js, and package-manager compatibility.
5. Obtain approval for the exact target and migration plan.

### 3.2 Align dependencies

- Update all backend `@medusajs/*` runtime and test packages to the exact same Medusa version, except independently versioned design-system packages.
- Remove dependencies Medusa now bundles and replace their imports with framework exports.
- Pin storefront Medusa SDK/types packages to versions compatible with the backend.
- Remove obsolete v1 packages and resolutions only after proving they are unused or replacing their callers.
- Pin UI/Icon packages rather than retaining `latest`.
- Regenerate backend and storefront lockfiles independently with Yarn 4.
- Review the lockfile diff for unexpected React, Next.js, database-driver, payment-provider, or AWS SDK changes.

### 3.3 Apply breaking code changes in reviewable groups

Keep separate commits for:

1. Dependency/import restructuring.
2. Zod 4 and HTTP type changes.
3. Product/inventory/shipping/auth behavior changes.
4. Admin customization compatibility.
5. Database/link/data migrations.

After each group, run the narrowest relevant typecheck/build and focused tests. This makes regressions bisectable.

### 3.4 Migrate a disposable database first

1. Restore the pre-upgrade snapshot into a new disposable database.
2. Run Medusa migrations and link synchronization there.
3. Save the complete migration output.
4. Run post-migration integrity queries and compare them with the baseline counts.
5. Confirm representative company, cart, approval, quote, order, payment, fulfillment, inventory, and product-option relationships still resolve.
6. Run migrations a second time and require a clean/idempotent result.
7. Practice rollback by restoring the dump into another disposable database and starting the old application against it.

Do not treat Medusa's module rollback commands as the only recovery mechanism. The database dump is the authoritative rollback path.

## Phase 4: Automated local validation

Run, in order:

1. Focused backend unit/module/HTTP tests added above.
2. Backend formatting and lint checks relevant to changed files.
3. Backend build/typecheck.
4. Focused storefront tests for changed contracts.
5. Storefront formatting and lint checks relevant to changed files.
6. Storefront production build/typecheck.
7. Migration integrity checks against the production-shaped local copy.

Fix upgrade-caused failures before manual testing. Do not disable new lint rules merely to obtain a green build; either fix violations or document and narrowly configure rules that are incompatible with intentional project patterns.

## Phase 5: Manual real-user browser testing

Codex will perform this testing through the browser, interacting with the site as a user rather than calling APIs directly. API/database checks are used afterward only to confirm mutations.

### 5.1 Test protocol

- Start the upgraded backend/Admin on port `9000` and storefront on port `8000` using the isolated services.
- Use fresh browser profiles or clear cookies/local storage between actors.
- Test desktop and mobile viewport behavior for every storefront group below.
- For every flow, watch the browser console and network panel. A visually successful page with a failed background request is a failure.
- Verify loading, empty, success, validation-error, authorization-error, and retry states where each exists.
- Capture screenshots for critical screens and exact request/response evidence for failures.
- After every create/update/delete action, reload the page and verify persistence. For cross-system mutations, also verify the corresponding Admin view or API read-back.
- Repeat the full critical path after a backend restart to catch session, Redis, and workflow persistence issues.

### 5.2 Public storefront flows

As an anonymous visitor:

- Open the home page; verify hero carousel controls, collection rails, navigation, account/cart/search entry points, and responsive layout.
- Browse the Store page; exercise sorting, pagination, category selection, category clearing, and combinations of URL query parameters.
- Browse top-level categories, nested categories, and collections; verify breadcrumbs and empty-result behavior.
- Search from the navigation modal and dedicated search page; test exact SKU/title, partial text, no results, keyboard navigation, and result links.
- Open single-variant and multi-variant products; verify images, details, price visibility rules, option presentation, inventory state, related products, and breadcrumbs.
- Attempt to add in-stock, low-stock, and out-of-stock variants.
- Open an invalid product/category/collection route and verify the not-found experience.
- Open Terms of Sale and Privacy Policy.
- Verify country-code routing and that direct unlocalized links are normalized correctly.
- Verify an anonymous user is directed to authenticate before checkout and cannot access protected account pages.

### 5.3 Registration and authentication flows

Using fresh users:

- Toggle between Log in, Register, and Forgot Password views.
- Submit registration with missing terms, missing required fields, malformed email, weak/invalid password if constrained, duplicate email, and valid data.
- Verify the resulting login/session and approval state after valid registration.
- Log out, confirm protected pages redirect, then log back in with correct and incorrect credentials.
- Request a password reset for existing and unknown addresses without leaking account existence.
- Follow a captured local reset-email link, test invalid/expired/missing tokens, set a new password, and verify old credentials fail while new credentials work.
- Change password from the authenticated account and repeat the old/new credential check.
- Verify session continuity across refresh, a backend restart, and a second browser tab.

### 5.4 Customer account flows

As an approved customer:

- Open Account Overview and verify profile, credit information, recently purchased items, and empty states.
- Edit profile fields, save, reload, and verify persistence.
- Add, edit, and delete addresses; exercise required fields, country/province behavior, cancellation, and default-address behavior if exposed.
- Browse and paginate order history.
- Open order details and verify items, totals, addresses, payment mode, fulfillment/tracking status, and invoice download when present.
- Verify malformed or unauthorized order IDs do not disclose another customer's data.
- Log out from desktop and mobile account navigation.

### 5.5 Company and role-based flows

As a company administrator:

- Open Company and verify company identity, employees, customer group, and approval settings.
- Edit the admin-approval setting, save, reload, and confirm it changes checkout behavior.
- Exercise employee management that is currently implemented, including create/update/delete and admin-role changes where exposed.
- Verify spending limits and roles are reflected for the affected employee after a new login.
- Verify the invitation control still reports its current explicit `Not implemented` behavior; do not mistake it for a working flow.

As a regular company employee:

- Confirm admin-only controls are hidden and blocked if called directly.
- Verify a cart below the spending limit can proceed according to company approval settings.
- Verify a cart above the spending limit displays the blocking message and cannot proceed.

As an unapproved customer:

- Verify pricing/checkout restrictions and messaging are unchanged.
- Confirm direct navigation to protected checkout/account actions does not bypass approval.

### 5.6 Product, cart, and checkout flows

As an approved customer:

- Add an item from a product card if supported and from the product detail page.
- On a multi-variant product, select option combinations and bulk quantities; confirm the correct variant/SKU and price enter the cart.
- Add multiple products, update quantities, test maximum inventory, add/edit/remove line-item notes if exposed, remove one line, and empty the cart.
- Verify cart drawer and full cart remain synchronized across navigation and refresh.
- Confirm free-shipping progress and totals recalculate as quantities change.
- Confirm the currently commented-out promotion, CSV export, and Request Quote controls remain absent. Their APIs are tested separately, but they are not shipped storefront flows.
- Start checkout and complete contact details, shipping address, billing-address same/different paths, delivery method, and back/edit navigation between steps.
- Test missing/invalid fields and verify errors preserve entered data.
- Confirm shipping price, taxes, discounts, and grand total agree between cart, checkout, order confirmation, Admin, and invoice.
- Place an order using the currently exposed e-transfer path and verify only one order is created even if the button is clicked twice or the response is slow.
- Verify order confirmation, cart reset, order-history appearance, payment mode, and follow-up email captured by the local mail sink.
- If deployed production configuration enables Stripe or PayPal, repeat successful, declined/cancelled, and retry flows using sandbox credentials.

### 5.7 Approval flows

The storefront navigation currently hides approval pages, but the routes and checkout approval behavior exist. Test both reachable checkout behavior and direct-route compatibility:

- With company admin approval enabled, submit a complete cart for approval and verify checkout cannot complete while pending.
- As the company administrator, open the direct Approvals route, approve one cart and reject another, and verify both state transitions persist.
- As the requesting employee, resume an approved cart and place the order; verify a rejected cart cannot proceed.
- Exercise any configured sales-manager/merchant approval path in Admin.
- Verify unauthorized users cannot read or mutate approvals belonging to other companies.
- Confirm the hidden Approvals navigation item remains hidden unless intentionally re-enabled in a separate feature change.

### 5.8 Quote flows

Request Quote and Quotes navigation are currently commented out in the storefront. They are not active public UI, but the direct pages and APIs must remain compatible:

- Open direct customer quote list/detail routes with seeded data and verify rendering and authorization.
- Create a quote through the test/API fixture, then use the browser UI for messages, preview, accept, and reject wherever controls are reachable.
- As merchant Admin, open Quotes, inspect details, exchange messages, manage items/quantities/prices, send, reject, and verify accepted-quote order behavior.
- Confirm hidden storefront navigation and cart quote controls remain hidden after the upgrade.

### 5.9 Medusa Admin flows

As merchant Admin:

- Log in, log out, refresh a session, and verify unauthorized access redirects correctly.
- Browse core Products, Orders, Customers, Inventory, Promotions, Regions, Sales Channels, Stock Locations, Shipping, and Publishable API Keys pages used by this deployment.
- Create a temporary product, add variants/options, prices, inventory, category/collection, publish it, view it in the storefront, edit it, and delete it.
- Open Product → Options. Create a temporary global option with values, attach it to two products, verify reuse and Store API retrieval, detach it, and delete it. This proves the capability motivating the upgrade without implementing the real eight options yet.
- Review an existing order and exercise custom payment-mode, partial-capture, print, fulfillment-shipping, invoice, and credit-limit widgets using synthetic data.
- Open Companies; create/edit a synthetic company, manage customer-group association, manage employees, change approval settings, and remove the synthetic records.
- Open Approvals; filter/search, approve, and reject synthetic requests.
- Open Quotes; manage a synthetic quote through its supported merchant states.
- Open Payments; inspect outstanding balances/credit usage, perform a test partial capture where safe, and send a reminder to the local mail sink.
- Open fulfillment screens; select items, create fulfillment, update shipping/tracking, and verify customer order details.
- Open Customer Analytics, Product Analytics, and Growth; exercise searches, selectors, date ranges, charts, empty states, and authorization.
- Open Cache Version; read and update the test cache version, then verify storefront cache behavior.
- Trigger inventory sync only against the fixed BNG fixture. Verify create, update, delete, price, inventory, Algolia, and second-run idempotency behavior.
- Exercise upload controls using harmless supported and unsupported files against the isolated S3 location.

### 5.10 Resilience and negative-path checks

- Stop Redis temporarily and verify failures are bounded and observable; restore it and confirm recovery.
- Make Algolia unavailable and confirm normal catalog browsing still behaves as designed while search fails gracefully.
- Return malformed, unauthorized, empty, and timeout responses from the BNG fixture; verify no destructive catalog mutation occurs on a failed fetch.
- Simulate an email transport failure and confirm user-facing actions do not falsely claim delivery where delivery is required.
- Refresh or navigate backward during checkout and mutation flows; verify no duplicate order, approval, quote, payment capture, or fulfillment is created.
- Test two browser sessions editing the same synthetic company/cart/quote where concurrent behavior matters.
- Review backend, worker, Admin, and storefront logs for unhandled errors, deprecations, rejected promises, and repeated retries.

## Phase 6: Post-migration data verification

After manual testing, compare the upgraded database with the baseline:

- No unexplained losses in products, variants, inventory, customer/company links, carts, approvals, quotes, orders, payments, fulfillments, or invoices.
- Existing product option and variant combinations still resolve.
- Monetary totals and historical order snapshots are unchanged.
- Auth identities still map to the same customers/users.
- Company employees and customer groups retain membership and roles.
- Search records correspond to published products and do not contain duplicates.
- Background jobs and Redis-backed workflows complete exactly once.
- The new global-option schema exists and can be used without modifying existing catalog semantics.

Remove all synthetic records and confirm that only expected migration changes remain.

## Phase 7: Review and delivery gates

Before opening the upgrade PR:

- All focused automated validation passes locally.
- Backend and storefront production builds pass.
- Database migration succeeds twice on a restored production-shaped copy.
- The complete manual browser matrix has passed on desktop and mobile.
- There are no unexplained console errors, failing network calls, migration warnings, or data-count discrepancies.
- The rollback rehearsal has succeeded.
- The diff contains no Product Options ingestion/filter feature work.

The PR must include:

- Exact before/after dependency versions.
- Applicable breaking changes and the corresponding code changes.
- Migration and rollback instructions.
- Automated test results.
- A link to the completed manual test evidence matrix.
- Known inactive features confirmed unchanged.
- Any pre-existing failures clearly separated from upgrade regressions.

After publishing, inspect CI and fix failures caused by the upgrade. Do not merge on a partial or merely pending CI snapshot.

## Phase 8: Preview/staging rehearsal

Even after local success, deploy the upgrade branch to an isolated preview or staging environment backed by a fresh production-like database copy and non-production integrations.

Repeat at minimum:

- Login/session/password flows.
- Catalog list/detail/search and inventory rendering.
- Product variant selection and cart mutations.
- Full e-transfer checkout and order confirmation.
- Company admin and spending-limit behavior.
- Approval and quote compatibility.
- Merchant order/payment/fulfillment/invoice path.
- Admin Product → Options global-option smoke test.
- Inventory sync against the controlled fixture or a non-destructive recorded response.
- Migration count/integrity checks and log review.

Only merge after the preview deployment, database migration, application startup, and smoke suite are all confirmed. A green build without a successful migrated runtime is not sufficient.

## Rollback plan

If a blocker appears before production:

1. Stop the upgraded local/preview services.
2. Preserve logs and the failing database for diagnosis.
3. Restore the pre-upgrade database dump into a new database.
4. deploy/start the last known-good code and lockfiles against the restored database.
5. Point traffic only after the old application completes its critical smoke tests.
6. Reset or remove test-only Algolia, S3, Redis, email, and payment artifacts.

For production rollout, prepare the same code-and-database recovery sequence before deployment. Do not assume redeploying old code is sufficient after migrations have run.

## Completion criteria

The upgrade is complete only when:

- The exact target Medusa version is pinned consistently.
- Migrations are repeatable and recovery has been rehearsed.
- Existing B2B behavior passes automated and manual verification.
- Every shipped storefront flow and relevant Admin flow has been exercised as a real user.
- Hidden or explicitly unimplemented flows remain intentionally inactive and do not crash direct routes.
- Production-shaped preview validation is green.
- CI is green or any unrelated failure is documented and accepted separately.
- The system is ready for a separate global Product Options implementation.

## Primary references

- [Updating Medusa](https://docs.medusajs.com/learn/update)
- [Medusa 2.11 release notes](https://github.com/medusajs/medusa/releases/tag/v2.11.0)
- [Medusa 2.14 release notes](https://github.com/medusajs/medusa/releases/tag/v2.14.0)
- [Medusa 2.16 release notes](https://github.com/medusajs/medusa/releases/tag/v2.16.0)
- [Medusa 2.17 release notes](https://github.com/medusajs/medusa/releases/tag/v2.17.0)
- [Managing global Product Options](https://docs.medusajs.com/user-guide/products/options)
- [Using Product Options in a storefront](https://docs.medusajs.com/resources/storefront-development/products/options)
