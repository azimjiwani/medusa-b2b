import {
  BngProductOptionValidationError,
  applyBngProductOptions,
  planBngProductOptions,
} from "../workflows/inventory/bng-product-options"

const sourceProduct = (overrides: Record<string, unknown> = {}) => ({
  upcCode: " 00123 ",
  productAvailabilityType: "Both",
  brand: " Apple ",
  color: " ",
  device: undefined,
  capacity: null,
  length: "",
  material: " Aluminum ",
  memory: " 8 GB ",
  watts: "65 W",
  ...overrides,
})

const currentProduct = (overrides: Record<string, unknown> = {}) => ({
  id: "prod_1",
  metadata: { keep: "manual" },
  options: [],
  variants: [{ id: "variant_1", sku: "00123", options: [] }],
  ...overrides,
})

const planningOptions = {
  minB2bProducts: 1,
  maxRemovals: 10,
  maxRemovalFraction: 1,
  maxProductRemovals: 10,
  maxProductRemovalFraction: 1,
}

describe("planBngProductOptions", () => {
  it("normalizes source values and proposes reusable global options only for populated attributes", () => {
    const plan = planBngProductOptions(
      [sourceProduct()],
      [currentProduct()],
      [],
      planningOptions
    )

    expect(plan.normalizedProducts).toEqual([
      expect.objectContaining({
        sku: "00123",
        attributes: {
          brand: "Apple",
          color: null,
          device: null,
          capacity: null,
          length: null,
          material: "Aluminum",
          memory: "8 GB",
          watts: "65 W",
        },
      }),
    ])
    expect(plan.optionDefinitionsToCreate.map(({ title }) => title)).toEqual([
      "Brand",
      "Color",
      "Device",
      "Capacity",
      "Length",
      "Material",
      "Memory",
      "Watts",
    ])
    expect(plan.optionDefinitionsToCreate[0]).toEqual({
      field: "brand",
      title: "Brand",
      values: ["Apple"],
    })
  })

  it("fails the complete plan for a blank B2B UPC", () => {
    expect(() =>
      planBngProductOptions(
        [sourceProduct({ upcCode: "  " })],
        [],
        [],
        planningOptions
      )
    ).toThrow(BngProductOptionValidationError)
  })

  it("deduplicates identical normalized UPC rows and rejects conflicting rows", () => {
    const duplicate = sourceProduct({ upcCode: "00123", brand: "Apple" })
    const plan = planBngProductOptions(
      [sourceProduct(), duplicate],
      [currentProduct()],
      [],
      planningOptions
    )

    expect(plan.summary.duplicatesDeduplicated).toBe(1)
    expect(() =>
      planBngProductOptions(
        [sourceProduct(), sourceProduct({ brand: "Samsung" })],
        [currentProduct()],
        [],
        planningOptions
      )
    ).toThrow(/conflicting BNG rows.*00123/i)
  })

  it("rejects suspicious source and managed-removal counts", () => {
    expect(() =>
      planBngProductOptions([], [], [], {
        ...planningOptions,
        minB2bProducts: 2,
      })
    ).toThrow(/expected at least 2 B2B products/i)

    expect(() =>
      planBngProductOptions(
        [sourceProduct({ brand: "" })],
        [
          currentProduct({
            metadata: {
              bng_product_options: {
                brand: {
                  option_id: "opt_brand",
                  value_id: "optval_apple",
                  value: "Apple",
                },
              },
            },
            options: [
              {
                id: "opt_brand",
                title: "Brand",
                values: [{ id: "optval_apple", value: "Apple" }],
              },
            ],
            variants: [
              {
                id: "variant_1",
                sku: "00123",
                options: [
                  {
                    id: "optval_apple",
                    value: "Apple",
                    option_id: "opt_brand",
                    option: { id: "opt_brand", title: "Brand" },
                  },
                ],
              },
            ],
          }),
        ],
        [
          {
            id: "opt_brand",
            title: "Brand",
            is_exclusive: false,
            values: [{ id: "optval_apple", value: "Apple" }],
          },
        ],
        { ...planningOptions, maxRemovals: 0 }
      )
    ).toThrow(/1 managed removals exceeds the limit of 0/i)

    expect(() =>
      planBngProductOptions(
        [sourceProduct()],
        [currentProduct({ variants: [{ id: "variant_2", sku: "different" }] })],
        [],
        { ...planningOptions, maxProductRemovals: 0 }
      )
    ).toThrow(/1 product removals exceeds the limit of 0/i)
  })

  it("reuses global definitions and values and preserves unmanaged option state", () => {
    const plan = planBngProductOptions(
      [sourceProduct()],
      [
        currentProduct({
          options: [
            {
              id: "opt_condition",
              title: "Condition",
              values: [{ id: "optval_new", value: "New" }],
            },
          ],
          variants: [
            {
              id: "variant_1",
              sku: "00123",
              options: [
                {
                  id: "optval_new",
                  value: "New",
                  option_id: "opt_condition",
                  option: { id: "opt_condition", title: "Condition" },
                },
              ],
            },
          ],
        }),
      ],
      [
        {
          id: "opt_brand",
          title: " Brand ",
          is_exclusive: false,
          values: [{ id: "optval_apple", value: " Apple " }],
        },
      ],
      planningOptions
    )

    expect(plan.optionDefinitionsToCreate).not.toContainEqual(
      expect.objectContaining({ title: "Brand" })
    )
    expect(plan.optionValuesToCreate).not.toContainEqual(
      expect.objectContaining({ optionId: "opt_brand", value: "Apple" })
    )
    expect(plan.productChanges[0]).toEqual(
      expect.objectContaining({
        productId: "prod_1",
        variantId: "variant_1",
        desiredAssignments: expect.arrayContaining([
          expect.objectContaining({
            field: "brand",
            value: "Apple",
            variantTitle: " Brand ",
            variantValue: " Apple ",
          }),
        ]),
        preservedVariantOptions: { Condition: "New" },
      })
    )
  })

  it("adds a missing normalized value to an existing reusable option", () => {
    const plan = planBngProductOptions(
      [sourceProduct({ brand: " Samsung ", material: "", memory: "", watts: "" })],
      [currentProduct()],
      [
        {
          id: "opt_brand",
          title: "Brand",
          is_exclusive: false,
          values: [{ id: "optval_apple", value: "Apple" }],
        },
      ],
      planningOptions
    )

    expect(plan.optionDefinitionsToCreate).not.toContainEqual(
      expect.objectContaining({ title: "Brand" })
    )
    expect(plan.optionDefinitionsToCreate).toHaveLength(7)
    expect(plan.optionValuesToCreate).toEqual([
      {
        field: "brand",
        title: "Brand",
        optionId: "opt_brand",
        value: "Samsung",
      },
    ])
  })

  it("clears only tracked BNG state and becomes idempotent after reconciliation", () => {
    const managedMetadata = {
      keep: "manual",
      bng_product_options: {
        brand: {
          option_id: "opt_brand",
          value_id: "optval_apple",
          value: "Apple",
          association_managed: true,
        },
      },
    }
    const reconciled = currentProduct({
      metadata: managedMetadata,
      options: [
        {
          id: "opt_brand",
          title: "Brand",
          values: [{ id: "optval_apple", value: "Apple" }],
        },
        {
          id: "opt_condition",
          title: "Condition",
          values: [{ id: "optval_new", value: "New" }],
        },
        {
          id: "opt_manual_color",
          title: "Color",
          values: [{ id: "optval_blue", value: "Blue" }],
        },
      ],
      variants: [
        {
          id: "variant_1",
          sku: "00123",
          options: [
            {
              id: "optval_apple",
              value: "Apple",
              option_id: "opt_brand",
              option: { id: "opt_brand", title: "Brand" },
            },
            {
              id: "optval_new",
              value: "New",
              option_id: "opt_condition",
              option: { id: "opt_condition", title: "Condition" },
            },
            {
              id: "optval_blue",
              value: "Blue",
              option_id: "opt_manual_color",
              option: { id: "opt_manual_color", title: "Color" },
            },
          ],
        },
      ],
    })

    const unchanged = planBngProductOptions(
      [sourceProduct({ material: "", memory: "", watts: "" })],
      [reconciled],
      [
        {
          id: "opt_brand",
          title: "Brand",
          is_exclusive: false,
          values: [{ id: "optval_apple", value: "Apple" }],
        },
      ],
      planningOptions
    )
    expect(unchanged.productChanges).toHaveLength(0)
    expect(unchanged.summary.productsUnchanged).toBe(1)

    const clear = planBngProductOptions(
      [sourceProduct({ brand: "", material: "", memory: "", watts: "" })],
      [reconciled],
      [
        {
          id: "opt_brand",
          title: "Brand",
          is_exclusive: false,
          values: [{ id: "optval_apple", value: "Apple" }],
        },
      ],
      planningOptions
    )
    expect(clear.productChanges[0]).toEqual(
      expect.objectContaining({
        removals: [
          expect.objectContaining({
            field: "brand",
            optionId: "opt_brand",
            valueId: "optval_apple",
          }),
        ],
        preservedVariantOptions: { Condition: "New", Color: "Blue" },
        nextManagedState: {},
      })
    )
  })

  it("does not adopt an already-manual matching assignment as BNG-owned", () => {
    const manual = currentProduct({
      options: [
        {
          id: "opt_brand",
          title: "Brand",
          values: [{ id: "optval_apple", value: "Apple" }],
        },
      ],
      variants: [
        {
          id: "variant_1",
          sku: "00123",
          options: [
            {
              id: "optval_apple",
              value: "Apple",
              option_id: "opt_brand",
              option: { id: "opt_brand", title: "Brand" },
            },
          ],
        },
      ],
    })
    const globalOptions = [
      {
        id: "opt_brand",
        title: "Brand",
        is_exclusive: false,
        values: [{ id: "optval_apple", value: "Apple" }],
      },
    ]

    const populated = planBngProductOptions(
      [sourceProduct({ material: "", memory: "", watts: "" })],
      [manual],
      globalOptions,
      planningOptions
    )
    expect(populated.productChanges).toHaveLength(0)

    const blank = planBngProductOptions(
      [sourceProduct({ brand: "", material: "", memory: "", watts: "" })],
      [manual],
      globalOptions,
      planningOptions
    )
    expect(blank.productChanges).toHaveLength(0)
    expect(blank.summary.managedRemovals).toBe(0)
  })

  it("removes only the managed value while retaining shared manual option state", () => {
    const plan = planBngProductOptions(
      [sourceProduct({ brand: "", material: "", memory: "", watts: "" })],
      [
        currentProduct({
          metadata: {
            bng_product_options: {
              brand: {
                option_id: "opt_brand",
                value_id: "optval_apple",
                value: "Apple",
                association_managed: false,
              },
            },
          },
          options: [
            {
              id: "opt_brand",
              title: "Brand",
              values: [
                { id: "optval_apple", value: "Apple" },
                { id: "optval_manual", value: "Manual value" },
              ],
            },
          ],
          variants: [
            {
              id: "variant_1",
              sku: "00123",
              options: [
                {
                  id: "optval_apple",
                  value: "Apple",
                  option_id: "opt_brand",
                  option: { id: "opt_brand", title: "Brand" },
                },
              ],
            },
          ],
        }),
      ],
      [
        {
          id: "opt_brand",
          title: "Brand",
          is_exclusive: false,
          values: [
            { id: "optval_apple", value: "Apple" },
            { id: "optval_manual", value: "Manual value" },
          ],
        },
      ],
      planningOptions
    )

    expect(plan.rejections).toEqual([])
    expect(plan.productChanges[0]).toEqual(
      expect.objectContaining({
        retainedOptionIds: ["opt_brand"],
        removals: [
          expect.objectContaining({
            valueId: "optval_apple",
            removeAssociation: false,
            removeVariantAssignment: true,
          }),
        ],
      })
    )
  })
})

describe("applyBngProductOptions", () => {
  it("returns the dry-run summary without invoking a mutation", async () => {
    const plan = planBngProductOptions(
      [sourceProduct({ material: "", memory: "", watts: "" })],
      [currentProduct()],
      [],
      planningOptions
    )
    const mutations = {
      createOption: jest.fn(),
      addOptionValues: jest.fn(),
      addProductOption: jest.fn(),
      updateProductOptionValues: jest.fn(),
      replaceProductOptionsAndVariant: jest.fn(),
      updateVariantOptions: jest.fn(),
      updateProductMetadata: jest.fn(),
      getOptions: jest.fn(),
    }

    const summary = await applyBngProductOptions(plan, mutations, {
      dryRun: true,
    })

    expect(summary.dryRun).toBe(true)
    expect(summary.optionDefinitionsCreated).toBe(8)
    expect(summary.proposed).toEqual(
      expect.objectContaining({
        optionDefinitions: expect.arrayContaining([
          expect.objectContaining({ title: "Brand" }),
        ]),
        productAssociations: [
          expect.objectContaining({ sku: "00123", title: "Brand", value: "Apple" }),
        ],
        variantAssignments: [
          expect.objectContaining({
            sku: "00123",
            options: { Brand: "Apple" },
          }),
        ],
      })
    )
    expect(Object.values(mutations).every((fn) => fn.mock.calls.length === 0)).toBe(
      true
    )
  })

  it("creates, associates, and assigns options while merging product metadata", async () => {
    const plan = planBngProductOptions(
      [sourceProduct({ material: "", memory: "", watts: "" })],
      [currentProduct()],
      [],
      planningOptions
    )
    const mutations = {
      createOption: jest.fn().mockResolvedValue(undefined),
      addOptionValues: jest.fn().mockResolvedValue(undefined),
      addProductOption: jest.fn().mockResolvedValue(undefined),
      updateProductOptionValues: jest.fn().mockResolvedValue(undefined),
      replaceProductOptionsAndVariant: jest.fn().mockResolvedValue(undefined),
      updateVariantOptions: jest.fn().mockResolvedValue(undefined),
      updateProductMetadata: jest.fn().mockResolvedValue(undefined),
      getOptions: jest.fn().mockResolvedValue([
        {
          id: "opt_brand",
          title: "Brand",
          is_exclusive: false,
          values: [{ id: "optval_apple", value: "Apple" }],
        },
      ]),
    }

    const summary = await applyBngProductOptions(plan, mutations, {
      dryRun: false,
    })

    expect(mutations.createOption).toHaveBeenCalledWith({
      title: "Brand",
      values: ["Apple"],
      is_exclusive: false,
      metadata: { bng_managed: true, bng_field: "brand" },
    })
    expect(mutations.addProductOption).toHaveBeenCalledWith(
      "prod_1",
      "opt_brand",
      ["optval_apple"]
    )
    expect(mutations.updateVariantOptions).toHaveBeenCalledWith("variant_1", {
      Brand: "Apple",
    })
    expect(mutations.updateProductMetadata).toHaveBeenCalledWith("prod_1", {
      keep: "manual",
      bng_product_options: {
        brand: {
          option_id: "opt_brand",
          value_id: "optval_apple",
          value: "Apple",
          association_managed: true,
        },
      },
    })
    expect(summary).toEqual(
      expect.objectContaining({
        dryRun: false,
        optionDefinitionsCreated: 8,
        productAssociationsUpdated: 1,
        variantAssignmentsUpdated: 1,
        failures: [],
      })
    )
    expect(mutations.updateProductMetadata.mock.invocationCallOrder[0]).toBeLessThan(
      mutations.addProductOption.mock.invocationCallOrder[0]
    )
  })

  it("reports only actual association mutations in dry-run mode", async () => {
    const plan = planBngProductOptions(
      [sourceProduct({ material: "", memory: "", watts: "" })],
      [
        currentProduct({
          metadata: {
            bng_product_options: {
              brand: {
                option_id: "opt_brand",
                value_id: "optval_apple",
                value: "Apple",
                association_managed: true,
              },
            },
          },
          options: [
            {
              id: "opt_brand",
              title: "Brand",
              values: [{ id: "optval_apple", value: "Apple" }],
            },
          ],
          variants: [{ id: "variant_1", sku: "00123", options: [] }],
        }),
      ],
      [
        {
          id: "opt_brand",
          title: "Brand",
          is_exclusive: false,
          values: [{ id: "optval_apple", value: "Apple" }],
        },
      ],
      planningOptions
    )
    const mutations = {
      createOption: jest.fn(),
      addOptionValues: jest.fn(),
      addProductOption: jest.fn(),
      updateProductOptionValues: jest.fn(),
      replaceProductOptionsAndVariant: jest.fn(),
      updateVariantOptions: jest.fn(),
      updateProductMetadata: jest.fn(),
      getOptions: jest.fn(),
    }

    const summary = await applyBngProductOptions(plan, mutations, {
      dryRun: true,
    })

    expect(summary.productAssociationsUpdated).toBe(0)
    expect(summary.proposed.productAssociations).toEqual([])
    expect(summary.proposed.variantAssignments).toHaveLength(1)
  })
})
