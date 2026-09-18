import {
  BNG_PRODUCT_OPTION_FIELDS,
  BngProductOptionValidationError,
  applyBngProductOptions,
  planBngProductOptions,
  type ProductOptionSnapshot,
} from "../workflows/inventory/bng-product-options"

const provisionedOptions = (
  ...overrides: ProductOptionSnapshot[]
): ProductOptionSnapshot[] =>
  BNG_PRODUCT_OPTION_FIELDS.map(([field, title]) =>
    overrides.find((option) => option.title.trim() === title) ?? {
      id: `opt_${field}`,
      title,
      is_exclusive: false,
      values: [],
    }
  )

const sourceProduct = (overrides: Record<string, unknown> = {}) => ({
  upcCode: " 00123 ",
  productName: " Product ",
  quantity: "5",
  price: 100,
  price_WholesaleLevel1: 90,
  price_WholesaleLevel2: 80,
  price_WholesaleLevel3: 70,
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
  title: "Product",
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

// A product BNG previously assigned Device="iPhone 17 Pro Max", whose feed row
// now says Device="iPhone 18 Pro Max/17 Pro Max".
const deviceRenameProduct = (managedValueId = "optval_17pm") =>
  currentProduct({
    metadata: {
      bng_product_options: {
        device: {
          option_id: "opt_device",
          value_id: managedValueId,
          value:
            managedValueId === "optval_17pm"
              ? "iPhone 17 Pro Max"
              : "iPhone 18 Pro Max/17 Pro Max",
          association_managed: true,
        },
      },
    },
    options: [
      {
        id: "opt_device",
        title: "Device",
        values: [{ id: "optval_17pm", value: "iPhone 17 Pro Max" }],
      },
    ],
    variants: [
      {
        id: "variant_1",
        sku: "00123",
        options: [
          {
            id: "optval_17pm",
            value: "iPhone 17 Pro Max",
            option_id: "opt_device",
            option: { id: "opt_device", title: "Device" },
          },
        ],
      },
    ],
  })

const deviceRenameSource = () =>
  sourceProduct({
    brand: "",
    material: "",
    memory: "",
    watts: "",
    device: "iPhone 18 Pro Max/17 Pro Max",
  })

const deviceOption = (
  ...values: Array<{ id: string; value: string }>
): ProductOptionSnapshot => ({
  id: "opt_device",
  title: "Device",
  is_exclusive: false,
  values: [{ id: "optval_17pm", value: "iPhone 17 Pro Max" }, ...values],
})

describe("planBngProductOptions", () => {
  it("normalizes source values and proposes values for provisioned global options", () => {
    const plan = planBngProductOptions(
      [sourceProduct()],
      [currentProduct()],
      provisionedOptions(),
      planningOptions
    )

    expect(plan.normalizedProducts).toEqual([
      expect.objectContaining({
        sku: "00123",
        title: "Product",
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
    expect(plan.optionDefinitionsToCreate).toEqual([])
    expect(plan.optionValuesToCreate.map(({ title, value }) => [title, value])).toEqual([
      ["Brand", "Apple"],
      ["Material", "Aluminum"],
      ["Memory", "8 GB"],
      ["Watts", "65 W"],
    ])
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

  it("fails the complete plan for a blank B2B product name or invalid numeric field", () => {
    expect(() =>
      planBngProductOptions(
        [sourceProduct({ productName: "  " })],
        [],
        [],
        planningOptions
      )
    ).toThrow(/blank B2B product name.*00123/i)

    expect(() =>
      planBngProductOptions(
        [sourceProduct({ quantity: "not-a-number" })],
        [],
        [],
        planningOptions
      )
    ).toThrow(/invalid quantity.*00123/i)

    expect(() =>
      planBngProductOptions(
        [sourceProduct({ price_WholesaleLevel2: "" })],
        [],
        [],
        planningOptions
      )
    ).toThrow(/invalid price_WholesaleLevel2.*00123/i)
  })

  it("plans trimmed title drift while preserving source casing and wording", () => {
    const plan = planBngProductOptions(
      [
        sourceProduct({
          productName: "  Bng iPhone Pro  ",
          brand: "",
          material: "",
          memory: "",
          watts: "",
        }),
      ],
      [currentProduct({ title: "BNG IPHONE PRO" })],
      provisionedOptions(),
      planningOptions
    )

    expect(plan.productChanges).toEqual([
      expect.objectContaining({
        sku: "00123",
        productId: "prod_1",
        titleChange: {
          currentTitle: "BNG IPHONE PRO",
          desiredTitle: "Bng iPhone Pro",
        },
        optionsChanged: false,
      }),
    ])
  })

  it("ignores whitespace-only title differences and is idempotent", () => {
    const plan = planBngProductOptions(
      [
        sourceProduct({
          productName: " Product ",
          brand: "",
          material: "",
          memory: "",
          watts: "",
        }),
      ],
      [currentProduct({ title: "  Product  " })],
      provisionedOptions(),
      planningOptions
    )

    expect(plan.productChanges).toEqual([])
    expect(plan.summary.productsUnchanged).toBe(1)
  })

  it("deduplicates identical normalized UPC rows and rejects conflicting rows", () => {
    const duplicate = sourceProduct({ upcCode: "00123", brand: "Apple" })
    const plan = planBngProductOptions(
      [sourceProduct(), duplicate],
      [currentProduct()],
      provisionedOptions(),
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
        provisionedOptions(
          {
            id: "opt_brand",
            title: "Brand",
            is_exclusive: false,
            values: [{ id: "optval_apple", value: "Apple" }],
          }
        ),
        { ...planningOptions, maxRemovals: 0 }
      )
    ).toThrow(/1 managed removals exceeds the limit of 0/i)

    expect(() =>
      planBngProductOptions(
        [sourceProduct()],
        [currentProduct({ variants: [{ id: "variant_2", sku: "different" }] })],
        provisionedOptions(),
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
      provisionedOptions(
        {
          id: "opt_brand",
          title: " Brand ",
          is_exclusive: false,
          values: [{ id: "optval_apple", value: " Apple " }],
        }
      ),
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
      provisionedOptions(
        {
          id: "opt_brand",
          title: "Brand",
          is_exclusive: false,
          values: [{ id: "optval_apple", value: "Apple" }],
        }
      ),
      planningOptions
    )

    expect(plan.optionDefinitionsToCreate).not.toContainEqual(
      expect.objectContaining({ title: "Brand" })
    )
    expect(plan.optionDefinitionsToCreate).toHaveLength(0)
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
      provisionedOptions(
        {
          id: "opt_brand",
          title: "Brand",
          is_exclusive: false,
          values: [{ id: "optval_apple", value: "Apple" }],
        }
      ),
      planningOptions
    )
    expect(unchanged.productChanges).toHaveLength(0)
    expect(unchanged.summary.productsUnchanged).toBe(1)

    const clear = planBngProductOptions(
      [sourceProduct({ brand: "", material: "", memory: "", watts: "" })],
      [reconciled],
      provisionedOptions(
        {
          id: "opt_brand",
          title: "Brand",
          is_exclusive: false,
          values: [{ id: "optval_apple", value: "Apple" }],
        }
      ),
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
    const globalOptions = provisionedOptions(
      {
        id: "opt_brand",
        title: "Brand",
        is_exclusive: false,
        values: [{ id: "optval_apple", value: "Apple" }],
      }
    )

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
      provisionedOptions(
        {
          id: "opt_brand",
          title: "Brand",
          is_exclusive: false,
          values: [
            { id: "optval_apple", value: "Apple" },
            { id: "optval_manual", value: "Manual value" },
          ],
        }
      ),
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
  it("plans a managed value rename as add-then-remove around the variant move", () => {
    const plan = planBngProductOptions(
      [deviceRenameSource()],
      [deviceRenameProduct()],
      provisionedOptions(deviceOption()),
      planningOptions
    )

    expect(plan.rejections).toEqual([])
    expect(plan.optionValuesToCreate).toEqual([
      expect.objectContaining({
        optionId: "opt_device",
        value: "iPhone 18 Pro Max/17 Pro Max",
      }),
    ])
    expect(plan.productChanges[0]).toEqual(
      expect.objectContaining({
        optionsChanged: true,
        desiredAssignments: [
          expect.objectContaining({
            field: "device",
            associationExists: true,
            associationUpdateRequired: true,
            staleValueIds: ["optval_17pm"],
          }),
        ],
      })
    )
  })

  it("repairs a rename whose metadata was written but whose product state was not", () => {
    // A previous run created the value and wrote managed metadata, then failed
    // before the association and variant were updated.
    const plan = planBngProductOptions(
      [deviceRenameSource()],
      [deviceRenameProduct("optval_combined")],
      provisionedOptions(
        deviceOption({
          id: "optval_combined",
          value: "iPhone 18 Pro Max/17 Pro Max",
        })
      ),
      planningOptions
    )

    expect(plan.rejections).toEqual([])
    expect(plan.optionValuesToCreate).toEqual([])
    expect(plan.summary.productsUnchanged).toBe(0)
    expect(plan.productChanges[0]).toEqual(
      expect.objectContaining({
        optionsChanged: true,
        desiredAssignments: [
          expect.objectContaining({
            field: "device",
            valueId: "optval_combined",
            associationUpdateRequired: true,
            staleValueIds: ["optval_17pm"],
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
      provisionedOptions(),
      planningOptions
    )
    const mutations = {
      updateProductTitle: jest.fn(),
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
    expect(summary.optionDefinitionsCreated).toBe(0)
    expect(summary.proposed).toEqual(
      expect.objectContaining({
        optionDefinitions: [],
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

  it("adds values, associates, and assigns options while merging product metadata", async () => {
    const plan = planBngProductOptions(
      [sourceProduct({ material: "", memory: "", watts: "" })],
      [currentProduct()],
      provisionedOptions(),
      planningOptions
    )
    const mutations = {
      updateProductTitle: jest.fn().mockResolvedValue(undefined),
      addOptionValues: jest.fn().mockResolvedValue(undefined),
      addProductOption: jest.fn().mockResolvedValue(undefined),
      updateProductOptionValues: jest.fn().mockResolvedValue(undefined),
      replaceProductOptionsAndVariant: jest.fn().mockResolvedValue(undefined),
      updateVariantOptions: jest.fn().mockResolvedValue(undefined),
      updateProductMetadata: jest.fn().mockResolvedValue(undefined),
      getOptions: jest.fn().mockResolvedValue(provisionedOptions(
        {
          id: "opt_brand",
          title: "Brand",
          is_exclusive: false,
          values: [{ id: "optval_apple", value: "Apple" }],
        }
      )),
    }

    const summary = await applyBngProductOptions(plan, mutations, {
      dryRun: false,
    })

    expect(mutations.addOptionValues).toHaveBeenCalledWith("opt_brand", ["Apple"])
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
        optionDefinitionsCreated: 0,
        optionValuesCreated: 1,
        productAssociationsUpdated: 1,
        variantAssignmentsUpdated: 1,
        failures: [],
      })
    )
    expect(mutations.updateProductMetadata.mock.invocationCallOrder[0]).toBeLessThan(
      mutations.addProductOption.mock.invocationCallOrder[0]
    )
  })

  it("adds the new value, moves the variant, then unassigns the stale value", async () => {
    const plan = planBngProductOptions(
      [deviceRenameSource()],
      [deviceRenameProduct()],
      provisionedOptions(deviceOption()),
      planningOptions
    )
    const associationValues = new Set(["optval_17pm"])
    const variantValues = new Set(["optval_17pm"])
    const mutations = {
      updateProductTitle: jest.fn().mockResolvedValue(undefined),
      addOptionValues: jest.fn().mockResolvedValue(undefined),
      addProductOption: jest.fn().mockResolvedValue(undefined),
      // Mirror Medusa: a value still used by a variant cannot be unassigned,
      // and a variant cannot take a value the product association lacks.
      updateProductOptionValues: jest.fn(
        async (_productId: string, _optionId: string, add: string[], remove: string[]) => {
          for (const id of remove) {
            if (variantValues.has(id)) {
              throw new Error(
                "Cannot unassign option values from product because the following variant(s) are using it"
              )
            }
            associationValues.delete(id)
          }
          for (const id of add) {
            associationValues.add(id)
          }
        }
      ),
      replaceProductOptionsAndVariant: jest.fn().mockResolvedValue(undefined),
      updateVariantOptions: jest.fn(
        async (_variantId: string, options: Record<string, string>) => {
          if (options.Device !== "iPhone 18 Pro Max/17 Pro Max") {
            throw new Error(`Unexpected variant options ${JSON.stringify(options)}`)
          }
          if (!associationValues.has("optval_combined")) {
            throw new Error(
              "Option value iPhone 18 Pro Max/17 Pro Max does not exist for option Device"
            )
          }
          variantValues.clear()
          variantValues.add("optval_combined")
        }
      ),
      updateProductMetadata: jest.fn().mockResolvedValue(undefined),
      getOptions: jest.fn().mockResolvedValue(
        provisionedOptions(
          deviceOption({
            id: "optval_combined",
            value: "iPhone 18 Pro Max/17 Pro Max",
          })
        )
      ),
    }

    const summary = await applyBngProductOptions(plan, mutations, {
      dryRun: false,
    })

    expect(summary.failures).toEqual([])
    expect(mutations.addOptionValues).toHaveBeenCalledWith("opt_device", [
      "iPhone 18 Pro Max/17 Pro Max",
    ])
    expect(mutations.updateProductOptionValues.mock.calls).toEqual([
      ["prod_1", "opt_device", ["optval_combined"], []],
      ["prod_1", "opt_device", [], ["optval_17pm"]],
    ])
    expect(mutations.updateVariantOptions).toHaveBeenCalledWith("variant_1", {
      Device: "iPhone 18 Pro Max/17 Pro Max",
    })
    const [addCall, removeCall] =
      mutations.updateProductOptionValues.mock.invocationCallOrder
    const [variantCall] = mutations.updateVariantOptions.mock.invocationCallOrder
    expect(addCall).toBeLessThan(variantCall)
    expect(variantCall).toBeLessThan(removeCall)
    expect(associationValues).toEqual(new Set(["optval_combined"]))
    expect(mutations.updateProductMetadata).toHaveBeenLastCalledWith("prod_1", {
      bng_product_options: {
        device: {
          option_id: "opt_device",
          value_id: "optval_combined",
          value: "iPhone 18 Pro Max/17 Pro Max",
          association_managed: true,
        },
      },
    })
    expect(summary).toEqual(
      expect.objectContaining({
        optionValuesCreated: 1,
        productAssociationsUpdated: 2,
        variantAssignmentsUpdated: 1,
      })
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
      provisionedOptions(
        {
          id: "opt_brand",
          title: "Brand",
          is_exclusive: false,
          values: [{ id: "optval_apple", value: "Apple" }],
        }
      ),
      planningOptions
    )
    const mutations = {
      updateProductTitle: jest.fn(),
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

  it("keeps title dry-runs read-only and applies only the title field", async () => {
    const source = sourceProduct({
      productName: " Bng Product ",
      brand: "",
      material: "",
      memory: "",
      watts: "",
    })
    const plan = planBngProductOptions(
      [source],
      [currentProduct({ title: "Old Product" })],
      provisionedOptions(),
      planningOptions
    )
    const mutations = {
      updateProductTitle: jest.fn().mockResolvedValue(undefined),
      addOptionValues: jest.fn(),
      addProductOption: jest.fn(),
      updateProductOptionValues: jest.fn(),
      replaceProductOptionsAndVariant: jest.fn(),
      updateVariantOptions: jest.fn(),
      updateProductMetadata: jest.fn(),
      getOptions: jest.fn(),
    }

    const dryRun = await applyBngProductOptions(plan, mutations, { dryRun: true })
    expect(dryRun.productTitlesUpdated).toBe(1)
    expect(dryRun.proposed.productTitles).toEqual([
      {
        sku: "00123",
        productId: "prod_1",
        currentTitle: "Old Product",
        desiredTitle: "Bng Product",
      },
    ])
    expect(Object.values(mutations).every((fn) => fn.mock.calls.length === 0)).toBe(
      true
    )

    const applied = await applyBngProductOptions(plan, mutations, { dryRun: false })
    expect(mutations.updateProductTitle).toHaveBeenCalledWith(
      "prod_1",
      "Bng Product"
    )
    expect(mutations.updateProductTitle).toHaveBeenCalledTimes(1)
    expect(mutations.updateProductMetadata).not.toHaveBeenCalled()
    expect(mutations.addProductOption).not.toHaveBeenCalled()
    expect(mutations.updateProductOptionValues).not.toHaveBeenCalled()
    expect(mutations.replaceProductOptionsAndVariant).not.toHaveBeenCalled()
    expect(mutations.updateVariantOptions).not.toHaveBeenCalled()
    expect(applied.productTitlesUpdated).toBe(1)
    expect(applied.variantAssignmentsUpdated).toBe(0)

    const secondPlan = planBngProductOptions(
      [source],
      [currentProduct({ title: "Bng Product" })],
      provisionedOptions(),
      planningOptions
    )
    expect(secondPlan.productChanges).toEqual([])
  })
})
