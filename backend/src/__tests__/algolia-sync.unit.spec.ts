import handleProductDelete from "../subscribers/delete-product-from-algolia"
import { getAlgoliaProductListArgs } from "../workflows/algolia-product-query"

describe("Algolia product synchronization", () => {
  it("passes product IDs as filters and relations as list configuration", () => {
    expect(getAlgoliaProductListArgs(["prod_test"])).toEqual({
      filters: { id: ["prod_test"] },
      config: {
        relations: ["variants", "categories", "tags", "images"],
      },
    })
  })

  it("deletes the corresponding Algolia object after a product deletion", async () => {
    const deleteProducts = jest.fn().mockResolvedValue(undefined)
    const container = {
      resolve: jest.fn().mockReturnValue({ deleteProducts }),
    }

    await handleProductDelete({
      event: { data: { id: "prod_test" } },
      container,
    } as any)

    expect(deleteProducts).toHaveBeenCalledWith(["prod_test"])
  })
})
