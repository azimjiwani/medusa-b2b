import { convertToLocale } from "@/lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { clx, Text } from "@medusajs/ui"

type LineItemPriceProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  style?: "default" | "tight"
  className?: string
  currencyCode: string
}

const LineItemPrice = ({
  item,
  style = "default",
  className,
  currencyCode,
}: LineItemPriceProps) => {
  const itemPrice = (item.unit_price ?? 0) * item.quantity

  return (
    <Text
      className={clx(
        "flex flex-col gap-x-2 text-ui-fg-subtle items-end",
        className
      )}
    >
      <span className="flex flex-col text-left">
        <span className="text-base-regular" data-testid="product-price">
          {convertToLocale({
            amount: itemPrice,
            currency_code: currencyCode ?? "eur",
          })}
        </span>
      </span>
    </Text>
  )
}

export default LineItemPrice
