import {
  prepareBngProductOptionSync,
  reconcileBngProductOptions,
} from "../workflows/inventory/bng-product-option-sync"

const planningOptions = {
  minB2bProducts: 1,
  maxRemovals: 10,
  maxRemovalFraction: 1,
  maxProductRemovals: 10,
  maxProductRemovalFraction: 1,
}

const createProductService = () => ({
  listProducts: jest.fn().mockResolvedValue([]),
  listProductOptions: jest.fn().mockResolvedValue([]),
  createProductOptions: jest.fn(),
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

  it("keeps dry-run read-only while returning proposed definitions and rejections", async () => {
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
        optionDefinitionsCreated: 8,
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
