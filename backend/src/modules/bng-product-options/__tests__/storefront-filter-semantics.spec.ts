import { moduleIntegrationTestRunner } from "@medusajs/test-utils"
import { Modules } from "@medusajs/framework/utils"

jest.setTimeout(60 * 1000)

moduleIntegrationTestRunner({
  moduleName: Modules.PRODUCT,
  resolve: `${process.cwd()}/node_modules/@medusajs/product`,
  testSuite: ({ service }) => {
    it("uses OR within an option and AND between options", async () => {
      const brand = await service.createProductOptions({
        title: "Brand",
        values: ["Apple", "Samsung"],
        is_exclusive: false,
      })
      const color = await service.createProductOptions({
        title: "Color",
        values: ["Black", "Blue"],
        is_exclusive: false,
      })
      const valueId = (option: typeof brand, value: string) =>
        option.values.find((candidate) => candidate.value === value)!.id

      const createProduct = async (
        title: string,
        brandValue: string,
        colorValue: string
      ) => {
        const product = await service.createProducts({
          title,
          status: "published",
          variants: [{ title, sku: title.toLowerCase().replaceAll(" ", "-") }],
        })
        await service.addProductOptionToProduct({
          product_id: product.id,
          product_option_id: brand.id,
          product_option_value_ids: [valueId(brand, brandValue)],
        })
        await service.addProductOptionToProduct({
          product_id: product.id,
          product_option_id: color.id,
          product_option_value_ids: [valueId(color, colorValue)],
        })
        await service.updateProductVariants(product.variants[0].id, {
          options: { Brand: brandValue, Color: colorValue },
        })
        return product
      }

      const appleBlack = await createProduct("Apple Black", "Apple", "Black")
      const appleBlue = await createProduct("Apple Blue", "Apple", "Blue")
      const samsungBlack = await createProduct(
        "Samsung Black",
        "Samsung",
        "Black"
      )

      const products = await service.listProducts({
        option_value_id: [
          valueId(brand, "Apple"),
          valueId(brand, "Samsung"),
          valueId(color, "Black"),
        ],
      })

      expect(products.map(({ id }) => id).sort()).toEqual(
        [appleBlack.id, samsungBlack.id].sort()
      )
      expect(products.map(({ id }) => id)).not.toContain(appleBlue.id)
    })
  },
})
