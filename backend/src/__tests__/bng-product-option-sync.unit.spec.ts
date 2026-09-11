import {
  prepareBngProductOptionSync,
  provisionBngProductOptionDefinitions,
  reconcileBngProductOptions,
} from "../workflows/inventory/bng-product-option-sync"
import { BNG_PRODUCT_OPTION_FIELDS } from "../workflows/inventory/bng-product-options"

const planningOptions = {
  minB2bProducts: 1,
  maxRemovals: 10,
  maxRemovalFraction: 1,
  maxProductRemovals: 10,
  maxProductRemovalFraction: 1,
}

const preProvisionedOptions = BNG_PRODUCT_OPTION_FIELDS.map(([field, title]) => ({
  id: `opt_${field}`,
  title,
  is_exclusive: false,
  metadata: { bng_managed: true, bng_field: field },
  values: [],
}))

const validSourceProduct = (overrides: Record<string, unknown> = {}) => ({
  upcCode: "00123",
  productName: "Product",
  quantity: "5",
  price: 100,
  price_WholesaleLevel1: 90,
  price_WholesaleLevel2: 80,
  price_WholesaleLevel3: 70,
  productAvailabilityType: "Both",
  brand: "Apple",
  ...overrides,
})

const createProductService = (
  options: unknown[] = preProvisionedOptions,
  products: unknown[] = []
) => ({
  listProducts: jest.fn().mockResolvedValue(products),
  listProductOptions: jest.fn().mockResolvedValue(options),
  createProductOptions: jest.fn().mockResolvedValue(undefined),
  retrieveProductOption: jest.fn(),
  updateProductOptions: jest.fn(),
  addProductOptionToProduct: jest.fn(),
  updateProductOptionValuesOnProduct: jest.fn(),
  updateProductVariants: jest.fn(),
  updateProducts: jest.fn(),
})

const createContainer = (productService: ReturnType<typeof createProductService>) =>
  ({
    resolve: jest.fn().mockReturnValue(productService),
  }) as any

describe("BNG product option Medusa boundary", () => {
  it("provisions all eight definitions explicitly and idempotently", async () => {
    const emptyService = createProductService([])
    const created = await provisionBngProductOptionDefinitions(
      createContainer(emptyService)
    )

    expect(created.created).toEqual(
      BNG_PRODUCT_OPTION_FIELDS.map(([, title]) => title)
    )
    expect(emptyService.createProductOptions).toHaveBeenCalledTimes(8)
    expect(emptyService.createProductOptions).toHaveBeenCalledWith({
      title: "Brand",
      values: [],
      is_exclusive: false,
      metadata: { bng_managed: true, bng_field: "brand" },
    })

    const existingService = createProductService()
    const reused = await provisionBngProductOptionDefinitions(
      createContainer(existingService)
    )
    expect(reused).toEqual({
      dryRun: false,
      created: [],
      metadataUpdated: [],
      reused: BNG_PRODUCT_OPTION_FIELDS.map(([, title]) => title),
    })
    expect(existingService.createProductOptions).not.toHaveBeenCalled()
    expect(existingService.updateProductOptions).not.toHaveBeenCalled()
  })

  it("keeps provisioning dry-run read-only", async () => {
    const productService = createProductService([])
    const summary = await provisionBngProductOptionDefinitions(
      createContainer(productService),
      { dryRun: true }
    )

    expect(summary).toEqual({
      dryRun: true,
      created: BNG_PRODUCT_OPTION_FIELDS.map(([, title]) => title),
      metadataUpdated: [],
      reused: [],
    })
    expect(productService.createProductOptions).not.toHaveBeenCalled()
    expect(productService.updateProductOptions).not.toHaveBeenCalled()
  })

  it("fails reconciliation when definitions have not been provisioned", async () => {
    const productService = createProductService([])
    const summary = await reconcileBngProductOptions(
      createContainer(productService),
      [validSourceProduct()],
      { dryRun: false, planningOptions }
    )

    expect(summary.failures).toEqual([
      expect.objectContaining({
        reason: expect.stringMatching(/missing pre-provisioned.*Brand/i),
      }),
    ])
    expect(productService.createProductOptions).not.toHaveBeenCalled()
    expect(productService.updateProductOptions).not.toHaveBeenCalled()
  })

  it("validates every definition before provisioning writes", async () => {
    const productService = createProductService([
      ...preProvisionedOptions.filter(({ title }) => title !== "Brand"),
      {
        id: "opt_brand_1",
        title: "Brand",
        is_exclusive: false,
        values: [],
      },
      {
        id: "opt_brand_2",
        title: " Brand ",
        is_exclusive: false,
        values: [],
      },
    ])

    await expect(
      provisionBngProductOptionDefinitions(createContainer(productService))
    ).rejects.toThrow(/multiple reusable global options.*Brand/i)
    expect(productService.createProductOptions).not.toHaveBeenCalled()
    expect(productService.updateProductOptions).not.toHaveBeenCalled()
  })

  it("rejects invalid source before any catalog mutation", async () => {
    const productService = createProductService()

    await expect(
      prepareBngProductOptionSync(
        createContainer(productService),
        [validSourceProduct({ upcCode: " " })],
        planningOptions
      )
    ).rejects.toThrow(/blank B2B UPC/i)

    expect(productService.listProducts).toHaveBeenCalled()
    expect(productService.listProductOptions).toHaveBeenCalled()
    for (const [name, method] of Object.entries(productService)) {
      if (name.startsWith("list")) {
        continue
      }
      expect(method).not.toHaveBeenCalled()
    }
  })

  it("keeps dry-run read-only while returning proposed values and rejections", async () => {
    const productService = createProductService()
    const summary = await reconcileBngProductOptions(
      createContainer(productService),
      [
        validSourceProduct(),
      ],
      { dryRun: true, planningOptions }
    )

    expect(summary).toEqual(
      expect.objectContaining({
        dryRun: true,
        optionDefinitionsCreated: 0,
        rejections: [expect.objectContaining({ sku: "00123" })],
        failures: [],
      })
    )
    expect(productService.createProductOptions).not.toHaveBeenCalled()
    expect(productService.updateProducts).not.toHaveBeenCalled()
    expect(productService.updateProductVariants).not.toHaveBeenCalled()
  })

  it("sends an exact title-only Medusa product patch", async () => {
    const productService = createProductService(preProvisionedOptions, [
      {
        id: "prod_1",
        title: "Old Product",
        metadata: { keep: "manual" },
        options: [],
        variants: [{ id: "variant_1", sku: "00123", options: [] }],
      },
    ])
    const summary = await reconcileBngProductOptions(
      createContainer(productService),
      [
        validSourceProduct({
          productName: "  Bng Product  ",
          brand: "",
          color: "",
          device: "",
          capacity: "",
          length: "",
          material: "",
          memory: "",
          watts: "",
        }),
      ],
      { dryRun: false, planningOptions }
    )

    expect(summary.productTitlesUpdated).toBe(1)
    expect(productService.updateProducts).toHaveBeenCalledTimes(1)
    expect(productService.updateProducts).toHaveBeenCalledWith("prod_1", {
      title: "Bng Product",
    })
    expect(productService.updateProductVariants).not.toHaveBeenCalled()
    expect(productService.updateProductOptionValuesOnProduct).not.toHaveBeenCalled()
  })

  it("returns validation failures as a structured dry-run summary", async () => {
    const productService = createProductService()
    const summary = await reconcileBngProductOptions(
      createContainer(productService),
      [validSourceProduct({ upcCode: " " })],
      { dryRun: true, planningOptions }
    )

    expect(summary).toEqual(
      expect.objectContaining({
        dryRun: true,
        sourceRows: 1,
        b2bRows: 1,
        failures: [
          expect.objectContaining({
            operation: "validate-source",
            reason: expect.stringMatching(/blank B2B UPC/i),
          }),
        ],
        proposed: {
          optionDefinitions: [],
          optionValues: [],
          productTitles: [],
          productAssociations: [],
          variantAssignments: [],
          removals: [],
        },
      })
    )
    expect(productService.createProductOptions).not.toHaveBeenCalled()
  })
})
