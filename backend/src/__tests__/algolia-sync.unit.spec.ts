import handleProductDelete from "../subscribers/delete-product-from-algolia"
import { getAlgoliaProductListArgs } from "../workflows/algolia-product-query"
import { chunk, findStaleObjectIds } from "../scripts/sync-algolia"

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

describe("Algolia full re-index script helpers", () => {
  it("splits product IDs into batches", () => {
    expect(chunk(["a", "b", "c", "d", "e"], 2)).toEqual([
      ["a", "b"],
      ["c", "d"],
      ["e"],
    ])
    expect(chunk([], 2)).toEqual([])
  })

  it("finds indexed records whose product no longer exists", () => {
    expect(
      findStaleObjectIds(["prod_a", "prod_gone", "prod_b"], ["prod_a", "prod_b"])
    ).toEqual(["prod_gone"])
  })
})
