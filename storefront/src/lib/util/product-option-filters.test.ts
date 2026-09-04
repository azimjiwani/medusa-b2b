import { describe, expect, it } from "vitest"

import {
  BNG_PRODUCT_OPTION_TITLES,
  clearProductOptionFilterParams,
  parseProductOptionFilters,
  sanitizeProductOptionFilters,
  updateProductOptionFilterParams,
} from "./product-option-filters"

describe("product option filter URLs", () => {
  it("uses the deliberate BNG option order", () => {
    expect(BNG_PRODUCT_OPTION_TITLES).toEqual([
      "Brand",
      "Device",
      "Capacity",
      "Memory",
      "Color",
      "Length",
      "Material",
      "Watts",
    ])
  })

  it("parses repeated ID pairs and ignores malformed or duplicate values", () => {
    expect(
      parseProductOptionFilters([
        "opt_brand:optval_apple",
        "opt_color:optval_black",
        "opt_brand:optval_apple",
        "missing-value:",
        "malformed",
      ])
    ).toEqual({
      opt_brand: ["optval_apple"],
      opt_color: ["optval_black"],
    })
  })

  it("preserves navigation state, removes empty filters, and resets pagination", () => {
    const current = new URLSearchParams(
      "q=phone&category=cases&sortBy=price_asc&page=4&option=opt_brand%3Aoptval_apple"
    )

    const added = updateProductOptionFilterParams(
      current,
      "opt_color",
      "optval_black",
      true
    )

    expect(added.get("q")).toBe("phone")
    expect(added.get("category")).toBe("cases")
    expect(added.get("sortBy")).toBe("price_asc")
    expect(added.has("page")).toBe(false)
    expect(added.getAll("option")).toEqual([
      "opt_brand:optval_apple",
      "opt_color:optval_black",
    ])

    const removed = updateProductOptionFilterParams(
      added,
      "opt_brand",
      "optval_apple",
      false
    )
    expect(removed.getAll("option")).toEqual(["opt_color:optval_black"])

    const cleared = clearProductOptionFilterParams(added)
    expect(cleared.has("option")).toBe(false)
    expect(cleared.get("q")).toBe("phone")
  })
})

describe("product option allow-listing", () => {
  it("ignores unrelated options and values that Medusa did not expose", () => {
    expect(
      sanitizeProductOptionFilters(
        {
          opt_brand: ["optval_apple", "optval_unknown"],
          opt_condition: ["optval_new"],
        },
        [
          {
            id: "opt_brand",
            title: "Brand",
            values: [{ id: "optval_apple", value: "Apple" }],
          },
        ]
      )
    ).toEqual({ opt_brand: ["optval_apple"] })
  })
})
