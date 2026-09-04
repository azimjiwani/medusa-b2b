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

const createProductService = (
  options: unknown[] = preProvisionedOptions
) => ({
  listProducts: jest.fn().mockResolvedValue([]),
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
      [{ upcCode: "00123", productAvailabilityType: "Both", brand: "Apple" }],
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
        [{ upcCode: " ", productAvailabilityType: "Both" }],
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
        {
          upcCode: "00123",
          productAvailabilityType: "Both",
          brand: "Apple",
        },
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

  it("returns validation failures as a structured dry-run summary", async () => {
    const productService = createProductService()
    const summary = await reconcileBngProductOptions(
      createContainer(productService),
      [{ upcCode: " ", productAvailabilityType: "Both" }],
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
          productAssociations: [],
          variantAssignments: [],
          removals: [],
        },
      })
    )
    expect(productService.createProductOptions).not.toHaveBeenCalled()
  })
})
