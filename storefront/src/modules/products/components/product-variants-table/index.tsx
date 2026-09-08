import { addToCartEventBus } from "@/lib/data/cart-event-bus"
import { getProductPrice } from "@/lib/util/get-product-price"
import { HttpTypes, StoreProduct, StoreProductVariant } from "@medusajs/types"
import { clx, Table, Text } from "@medusajs/ui"
import Button from "@/modules/common/components/button"
import ShoppingBag from "@/modules/common/icons/shopping-bag"
import { useState } from "react"
import BulkTableQuantity from "../bulk-table-quantity"
import { B2BCustomer } from "@/types"
import { getAvailableInventory } from "@/lib/util/inventory"

const ProductVariantsTable = ({
  product,
  region,
  customer,
}: {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  customer: B2BCustomer | null
}) => {
  const [isAdding, setIsAdding] = useState(false)
  const [lineItemsMap, setLineItemsMap] = useState<
    Map<
      string,
      StoreProductVariant & {
        product: StoreProduct
        quantity: number
      }
    >
  >(new Map())

  const totalQuantity = Array.from(lineItemsMap.values()).reduce(
    (acc, curr) => acc + curr.quantity,
    0
  )

  const handleQuantityChange = (variantId: string, quantity: number) => {
    setLineItemsMap((prev) => {
      const newLineItems = new Map(prev)

      if (!prev.get(variantId)) {
        newLineItems.set(variantId, {
          ...product.variants?.find((v) => v.id === variantId)!,
          product,
          quantity,
        })
      } else {
        newLineItems.set(variantId, {
          ...prev.get(variantId)!,
          quantity,
        })
      }

      return newLineItems
    })
  }

  const handleAddToCart = async () => {
    setIsAdding(true)

    const lineItems = Array.from(lineItemsMap.entries()).map(
      ([variantId, { quantity, ...variant }]) => ({
        productVariant: {
          ...variant,
        },
        quantity,
      })
    )

    addToCartEventBus.emitCartAdd({
      lineItems,
      regionId: region.id,
    })

    setIsAdding(false)
  }

  const isLoggedIn = !!customer
  const isApproved = !!customer?.metadata?.approved

  if (!isLoggedIn || !isApproved) {
    return (
      <div className="flex flex-col gap-6">
        <Text className="text-neutral-600 text-sm">
          {!isLoggedIn
            ? "Please log in to view pricing"
            : "Contact us for pricing"}
        </Text>
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="min-w-0 p-px">
        <Table className="table-fixed w-full rounded-xl overflow-hidden shadow-borders-base border-none">
          <Table.Header className="border-t-0">
            <Table.Row className="bg-neutral-100 border-none hover:!bg-neutral-100">
              <Table.HeaderCell className="whitespace-normal break-words px-2 medium:px-4">
                SKU
              </Table.HeaderCell>
              {product.options?.map((option) => {
                if (option.title === "Default option") {
                  return null
                }
                return (
                  <Table.HeaderCell
                    key={option.id}
                    className="whitespace-normal break-words px-2 border-x medium:px-4"
                  >
                    {option.title}
                  </Table.HeaderCell>
                )
              })}
              <Table.HeaderCell className="whitespace-normal break-words px-2 border-x medium:px-4">
                Price
              </Table.HeaderCell>
              <Table.HeaderCell className="whitespace-normal break-words px-2 medium:px-4">
                Quantity
              </Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body className="border-none">
            {product.variants?.map((variant, index) => {
              const { variantPrice } = getProductPrice({
                product,
                variantId: variant.id,
              })

              return (
                <Table.Row
                  key={variant.id}
                  className={clx({
                    "border-b-0": index === product.variants?.length! - 1,
                  })}
                >
                  <Table.Cell className="whitespace-normal break-words px-2 medium:px-4">
                    {variant.sku}
                  </Table.Cell>
                  {variant.options?.map((option, index) => {
                    if (option.value === "Default option value") {
                      return null
                    }
                    return (
                      <Table.Cell
                        key={option.id}
                        className="whitespace-normal break-words px-2 border-x medium:px-4"
                      >
                        {option.value}
                      </Table.Cell>
                    )
                  })}
                  <Table.Cell className="whitespace-normal break-words px-2 border-x medium:px-4">
                    {variantPrice?.calculated_price}
                  </Table.Cell>
                  <Table.Cell className="pl-1 !pr-1">
                    <BulkTableQuantity
                      variantId={variant.id}
                      maxQuantity={getAvailableInventory(variant)}
                      onChange={handleQuantityChange}
                    />
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table>
      </div>
      <Button
        onClick={handleAddToCart}
        variant="primary"
        className="w-full h-10"
        isLoading={isAdding}
        disabled={totalQuantity === 0}
        data-testid="add-product-button"
      >
        <ShoppingBag
          className="text-white"
          fill={totalQuantity === 0 ? "none" : "#fff"}
        />
        {totalQuantity === 0 ? "Select quantity above" : "Add to cart"}
      </Button>
    </div>
  )
}

export default ProductVariantsTable
