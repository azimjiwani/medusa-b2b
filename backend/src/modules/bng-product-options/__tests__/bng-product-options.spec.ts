import { moduleIntegrationTestRunner } from "@medusajs/test-utils"
import { Modules } from "@medusajs/framework/utils"
import { reconcileBngProductOptions } from "../../../workflows/inventory/bng-product-option-sync"

jest.setTimeout(60 * 1000)

moduleIntegrationTestRunner({
  moduleName: Modules.PRODUCT,
  resolve: `${process.cwd()}/node_modules/@medusajs/product`,
  testSuite: ({ service }) => {
    const container = { resolve: () => service } as any
    const source = (brand: string) => [
      {
        upcCode: "00123",
        productAvailabilityType: "Both",
        brand,
      },
    ]
    const planningOptions = {
      minB2bProducts: 1,
      maxRemovals: 10,
      maxRemovalFraction: 1,
      maxProductRemovals: 10,
      maxProductRemovalFraction: 1,
    }

    it("reuses global state, preserves unmanaged options, clears, and reruns idempotently", async () => {
      const product = await service.createProducts({
        title: "Phone",
        status: "published",
        variants: [
          {
            title: "Phone",
            sku: "00123",
          },
        ],
      })
      const condition = await service.createProductOptions({
        title: "Condition",
        values: ["New"],
        is_exclusive: false,
      })
      await service.addProductOptionToProduct({
        product_id: product.id,
        product_option_id: condition.id,
        product_option_value_ids: [condition.values[0].id],
      })
      await service.updateProductVariants(product.variants[0].id, {
        options: { Condition: "New" },
      })

      const first = await reconcileBngProductOptions(container, source("Apple"), {
        dryRun: false,
        planningOptions,
      })
      expect(first.failures).toEqual([])
      expect(first.optionDefinitionsCreated).toBe(8)
      expect(first.productAssociationsUpdated).toBe(1)

      const afterFirst = await service.retrieveProduct(product.id, {
        relations: ["options.values", "variants.options.option"],
      })
      expect(afterFirst.options.map(({ title }) => title).sort()).toEqual([
        "Brand",
        "Condition",
      ])
      expect(
        afterFirst.variants[0].options.map(({ value }) => value).sort()
      ).toEqual(["Apple", "New"])
      expect(afterFirst.metadata).toEqual(
        expect.objectContaining({
          bng_product_options: {
            brand: expect.objectContaining({ value: "Apple" }),
          },
        })
      )

      const second = await reconcileBngProductOptions(container, source("Apple"), {
        dryRun: false,
        planningOptions,
      })
      expect(second).toEqual(
        expect.objectContaining({
          optionDefinitionsCreated: 0,
          optionValuesCreated: 0,
          productAssociationsUpdated: 0,
          variantAssignmentsUpdated: 0,
          removals: 0,
          productsUnchanged: 1,
          failures: [],
        })
      )

      const cleared = await reconcileBngProductOptions(container, source(""), {
        dryRun: false,
        planningOptions,
      })
      expect(cleared.failures).toEqual([])
      expect(cleared.removals).toBe(1)

      const afterClear = await service.retrieveProduct(product.id, {
        relations: ["options.values", "variants.options.option"],
      })
      expect(afterClear.options.map(({ title }) => title)).toEqual(["Condition"])
      expect(afterClear.variants[0].options.map(({ value }) => value)).toEqual([
        "New",
      ])

      const brand = afterFirst.options.find(({ title }) => title === "Brand")!
      const sharedBrand = await service.updateProductOptions(brand.id, {
        values: ["Apple", "Manual value"],
      })
      const sharedProduct = await service.createProducts({
        title: "Shared brand phone",
        status: "published",
        variants: [
          {
            title: "Shared brand phone",
            sku: "00456",
          },
        ],
      })
      await service.addProductOptionToProduct({
        product_id: sharedProduct.id,
        product_option_id: sharedBrand.id,
        product_option_value_ids: sharedBrand.values.map(({ id }) => id),
      })

      const assignedShared = await reconcileBngProductOptions(
        container,
        [
          {
            upcCode: "00456",
            productAvailabilityType: "Both",
            brand: "Apple",
          },
        ],
        { dryRun: false, planningOptions }
      )
      expect(assignedShared.failures).toEqual([])

      const clearedShared = await reconcileBngProductOptions(
        container,
        [
          {
            upcCode: "00456",
            productAvailabilityType: "Both",
            brand: "",
          },
        ],
        { dryRun: false, planningOptions }
      )
      expect(clearedShared.failures).toEqual([])

      const afterSharedClear = await service.retrieveProduct(sharedProduct.id, {
        relations: ["options.values", "variants.options.option"],
      })
      expect(afterSharedClear.options).toEqual([
        expect.objectContaining({
          title: "Brand",
          values: [expect.objectContaining({ value: "Manual value" })],
        }),
      ])
      expect(afterSharedClear.variants[0].options).toEqual([])
    })

    it("uses exact persisted strings when reusing normalized definitions and values", async () => {
      await service.createProductOptions({
        title: " Brand ",
        values: [" Apple "],
        is_exclusive: false,
      })
      const product = await service.createProducts({
        title: "Whitespace brand phone",
        status: "published",
        variants: [
          {
            title: "Whitespace brand phone",
            sku: "00789",
          },
        ],
      })

      const summary = await reconcileBngProductOptions(
        container,
        [
          {
            upcCode: "00789",
            productAvailabilityType: "Both",
            brand: "Apple",
          },
        ],
        { dryRun: false, planningOptions }
      )
      expect(summary.failures).toEqual([])
      expect(summary.optionDefinitionsCreated).toBe(7)

      const reconciled = await service.retrieveProduct(product.id, {
        relations: ["options.values", "variants.options.option"],
      })
      expect(reconciled.options).toEqual([
        expect.objectContaining({ title: " Brand " }),
      ])
      expect(reconciled.variants[0].options).toEqual([
        expect.objectContaining({ value: " Apple " }),
      ])
    })
  },
})
