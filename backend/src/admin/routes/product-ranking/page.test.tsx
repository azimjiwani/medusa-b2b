import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ProductRankingPage from "./page";
import { createRequire } from "node:module";
import path from "node:path";
const require = createRequire(path.resolve("package.json"));
const { AdminGetProductsParams } = require(
  path.join(
    path.dirname(require.resolve("@medusajs/medusa")),
    "api/admin/products/validators.js",
  ),
);

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  list: vi.fn(),
  categories: vi.fn(),
  toast: vi.fn(),
}));
vi.mock("../../lib/client", () => ({
  sdk: {
    client: { fetch: mocks.fetch },
    admin: {
      product: { list: mocks.list },
      productCategory: { list: mocks.categories },
    },
  },
}));
vi.mock("@medusajs/admin-sdk", () => ({
  defineRouteConfig: (value: unknown) => value,
}));
vi.mock("@medusajs/ui", () => ({
  Input: (props: any) => <input {...props} />,
  Button: ({ variant, size, ...props }: any) => <button {...props} />,
  Container: (props: any) => <div {...props} />,
  Heading: ({ level, ...props }: any) => <h2 {...props} />,
  Toaster: () => null,
  toast: { success: mocks.toast },
}));

const ids = Array.from({ length: 15 }, (_, i) => `prod_${i}`);
const products = ids.map((id, i) => ({
  id,
  title: `Ranked product ${i}`,
  variants: [{ sku: `SKU-${i}` }],
}));
const initial = () => ({
  draft: {
    product_ids: ids,
    categories: [
      { category_id: "pcat_cases", product_ids: ["prod_1", "prod_0"] },
    ],
  },
  published: { product_ids: [], categories: [] },
  saved_at: null,
  published_at: null,
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.fetch.mockImplementation(async (_path, request) =>
    request?.method === "POST"
      ? {
          ...initial(),
          draft: request.body.config,
          saved_at: "2026-09-10T00:00:00Z",
        }
      : initial(),
  );
  mocks.categories.mockResolvedValue({
    product_categories: [{ id: "pcat_cases", name: "Cell Phone Cases" }],
    count: 1,
  });
  mocks.list.mockImplementation(async (query) => {
    AdminGetProductsParams.parse(query);
    return {
      products: query.id
        ? products.filter((product) => query.id.includes(product.id))
        : products.slice(0, 2),
    };
  });
});
afterEach(cleanup);

describe("product ranking editor", () => {
  it("loads all 15 selections and preserves independent orders while switching and saving", async () => {
    render(<ProductRankingPage />);
    const order = await screen.findByRole("group", {
      name: "Featured product order",
    });
    await within(order).findByText("Ranked product 14");
    expect(mocks.list).toHaveBeenCalledWith(
      expect.objectContaining({ id: ids, limit: 100 }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Move product 15 up" }));
    const expected = [...ids];
    [expected[13], expected[14]] = [expected[14], expected[13]];
    fireEvent.change(screen.getByRole("combobox", { name: "Ranking for" }), {
      target: { value: "pcat_cases" },
    });
    await waitFor(() =>
      expect(mocks.list).toHaveBeenCalledWith(
        expect.objectContaining({ category_id: ["pcat_cases"] }),
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Move product 2 up" }));
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    await waitFor(() =>
      expect(mocks.fetch).toHaveBeenCalledWith("/admin/product-ranking", {
        method: "POST",
        body: {
          action: "save",
          config: {
            product_ids: expected,
            categories: [
              { category_id: "pcat_cases", product_ids: ["prod_0", "prod_1"] },
            ],
          },
        },
      }),
    );
    await waitFor(() =>
      expect(
        screen
          .getByRole("button", { name: "Publish changes" })
          .hasAttribute("disabled"),
      ).toBe(false),
    );
    fireEvent.click(screen.getByRole("button", { name: "Publish changes" }));
    await waitFor(() =>
      expect(mocks.fetch).toHaveBeenLastCalledWith(
        "/admin/product-ranking",
        expect.objectContaining({
          body: expect.objectContaining({ action: "publish" }),
        }),
      ),
    );
  });

  it("retains unsaved changes after a failed save and allows retry", async () => {
    render(<ProductRankingPage />);
    await screen.findByRole("group", { name: "Featured product order" });
    fireEvent.click(screen.getByRole("button", { name: "Move product 2 up" }));
    mocks.fetch.mockRejectedValueOnce(new Error("offline"));
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Your edits are still here",
    );
    expect(screen.getByText(/Your edits are still here/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    await waitFor(() =>
      expect(mocks.fetch).toHaveBeenLastCalledWith(
        "/admin/product-ranking",
        expect.objectContaining({
          body: expect.objectContaining({
            config: expect.objectContaining({
              product_ids: ["prod_1", "prod_0", ...ids.slice(2)],
            }),
          }),
        }),
      ),
    );
  });
});
