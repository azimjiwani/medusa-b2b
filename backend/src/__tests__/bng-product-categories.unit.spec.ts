import {
  planBngProductCategories,
  resolveBngProductCategories,
} from "../workflows/inventory/bng-product-categories";
import { reconcileBngProductCategories } from "../workflows/inventory/bng-product-category-sync";

const categories = [
  { id: "parent", name: "Phones & Communications" },
  { id: "cases", name: "Cell Phone Cases" },
];
const source = [
  {
    upcCode: "sku",
    productAvailabilityType: "Both",
    productCategory: " Phones & Communications ",
    productSubCategory: "CELL  PHONE CASES",
  },
] as any;
const product = {
  id: "product",
  variants: [{ sku: "sku" }],
  categories: [{ id: "manual" }],
};

describe("BNG category assignments", () => {
  it("adds both source levels, preserves manual memberships, and is idempotent", () => {
    const bySku = resolveBngProductCategories(source, categories);
    const plan = planBngProductCategories([product], bySku);
    expect(plan[0]).toMatchObject({
      before: ["manual"],
      added: ["parent", "cases"],
      categoryIds: ["manual", "parent", "cases"],
    });
    expect(
      planBngProductCategories(
        [{ ...product, categories: plan[0].categoryIds.map((id) => ({ id })) }],
        bySku
      )
    ).toEqual([]);
  });
  it("ignores retail rows and products absent from the wholesale feed", () => {
    const bySku = resolveBngProductCategories(
      [
        ...source,
        { ...source[0], upcCode: "retail", productAvailabilityType: "Retail" },
      ],
      categories
    );
    expect(bySku.has("retail")).toBe(false);
    expect(
      planBngProductCategories(
        [{ ...product, variants: [{ sku: "retail" }] }],
        bySku
      )
    ).toEqual([]);
  });
  it("rejects incomplete, duplicate or empty source before changes", () => {
    for (const rows of [
      [{ ...source[0], productSubCategory: "" }],
      [{ ...source[0], productSubCategory: "Unknown type" }],
      [source[0], source[0]],
      [],
    ]) {
      expect(() =>
        resolveBngProductCategories(rows as any, categories)
      ).toThrow();
    }
  });
  it("rejects ambiguous category names", () => {
    expect(() =>
      resolveBngProductCategories(source, [
        ...categories,
        { id: "duplicate", name: "cell phone cases" },
      ])
    ).toThrow("ambiguous");
  });
  it("uses category metadata aliases without duplicate memberships", () => {
    const bySku = resolveBngProductCategories(source, [
      { id: "parent", name: "Phones & Communications" },
      {
        id: "cases",
        name: "Phone Cases",
        metadata: { original_value: "CELL PHONE CASES" },
      },
    ]);
    expect(bySku.get("sku")).toEqual(["parent", "cases"]);
  });
  it("dry-runs without writing, then applies using fresh memberships", async () => {
    const service = {
      listProductCategories: jest.fn().mockResolvedValue(categories),
      listProducts: jest.fn().mockResolvedValue([product]),
      retrieveProduct: jest
        .fn()
        .mockResolvedValue({
          ...product,
          categories: [{ id: "manual" }, { id: "new-manual" }],
        }),
      updateProducts: jest.fn().mockResolvedValue({}),
    };
    const container = { resolve: () => service } as any;
    const dryRun = await reconcileBngProductCategories(container, source);
    expect(dryRun).toMatchObject({
      productsToUpdate: 1,
      linksToAdd: 2,
      updated: 0,
    });
    expect(service.updateProducts).not.toHaveBeenCalled();
    const applied = await reconcileBngProductCategories(container, source, {
      dryRun: false,
    });
    expect(applied.updated).toBe(1);
    expect(service.updateProducts).toHaveBeenCalledWith("product", {
      category_ids: ["manual", "new-manual", "parent", "cases"],
    });
  });
  it("loads every page of products", async () => {
    const firstPage = Array.from({ length: 100 }, (_, i) => ({
      id: `p${i}`,
      variants: [],
    }));
    const service = {
      listProductCategories: jest.fn().mockResolvedValue(categories),
      listProducts: jest
        .fn()
        .mockResolvedValueOnce(firstPage)
        .mockResolvedValueOnce([product]),
    };
    const report = await reconcileBngProductCategories(
      { resolve: () => service } as any,
      source
    );
    expect(report).toMatchObject({ catalogProducts: 101, productsToUpdate: 1 });
  });
});
