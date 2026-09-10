import { createRequire } from "node:module";
import path from "node:path";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_LANDING_PAGE } from "../../../utils/landing-page-config";
import { ProductPicker } from "./page";

const { list } = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock("../../lib/client", () => ({ sdk: { admin: { product: { list } } } }));
vi.mock("@medusajs/admin-sdk", () => ({
  defineRouteConfig: (config: unknown) => config,
}));
vi.mock("@medusajs/ui", () => ({
  Input: (props: any) => <input {...props} />,
  Button: ({ variant, size, isLoading, ...props }: any) => (
    <button {...props} />
  ),
}));

// Validate against the installed API contract, not the SDK's looser types.
const require = createRequire(path.resolve("package.json"));
const { AdminGetProductsParams } = require(path.join(
  path.dirname(require.resolve("@medusajs/medusa")),
  "api/admin/products/validators.js"
));
const product = {
  id: "prod_handpicked",
  title: "Wholesale phone",
  thumbnail: null,
  variants: [{ sku: "PHONE-123" }, { sku: "PHONE-456" }, { sku: "PHONE-456" }],
};
const section = {
  ...DEFAULT_LANDING_PAGE.sections[0],
  source: "selected" as const,
  product_ids: [],
};

beforeEach(() => {
  list.mockReset();
  list.mockImplementation(async (query) => {
    AdminGetProductsParams.parse(query);
    return { products: [product] };
  });
});
afterEach(cleanup);

describe("handpicked product search", () => {
  it("uses a valid published-products query and lets the editor select results", async () => {
    const onChange = vi.fn();
    render(<ProductPicker section={section} onChange={onChange} />);
    const result = await screen.findByRole("button", {
      name: /Wholesale phone/,
    });
    expect(list).toHaveBeenCalledWith({
      q: undefined,
      limit: 12,
      fields: "id,title,thumbnail,variants.sku",
      status: ["published"],
    });
    fireEvent.click(result);
    expect(onChange).toHaveBeenCalledWith({ product_ids: [product.id] });
    fireEvent.change(
      screen.getByPlaceholderText("Search product names or SKUs…"),
      {
        target: { value: "phone" },
      }
    );
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({ q: "phone", status: ["published"] })
      )
    );
  });

  it.each(["PHONE-456", "456", "phone-456"])(
    "searches by SKU %s and shows the matching SKU once",
    async (sku) => {
      render(<ProductPicker section={section} onChange={vi.fn()} />);
      fireEvent.change(
        screen.getByPlaceholderText("Search product names or SKUs…"),
        {
          target: { value: `  ${sku}  ` },
        }
      );
      await screen.findByText("SKU: PHONE-456");
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({ q: sku, status: ["published"] })
      );
      expect(
        screen.getAllByRole("button", { name: /Wholesale phone/ })
      ).toHaveLength(1);
    }
  );

  it("offers retry after a failed request without claiming there are no matches", async () => {
    list.mockRejectedValueOnce(new Error("Network failure"));
    render(<ProductPicker section={section} onChange={vi.fn()} />);
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Could not search products"
    );
    expect(screen.queryByText("No matching products.")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Retry search" }));
    await screen.findByRole("button", { name: /Wholesale phone/ });
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows the empty state only after a successful search with no results", async () => {
    list.mockResolvedValue({ products: [] });
    render(<ProductPicker section={section} onChange={vi.fn()} />);
    expect(screen.queryByText("No matching products.")).toBeNull();
    await screen.findByText("No matching products.");
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
