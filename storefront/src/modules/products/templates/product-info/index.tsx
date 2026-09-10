import { HttpTypes } from "@medusajs/types"

const ProductInfo = ({ product }: { product: HttpTypes.StoreProduct }) => (
  <div id="product-info" className="min-w-0 w-full">
    <h1
      className="break-words text-[26px] font-semibold leading-[1.16] tracking-[-0.035em] text-[#1d1d1f] small:text-[34px]"
      data-testid="product-title"
    >
      {product.title}
    </h1>
    {product.subtitle && (
      <p
        className="mt-4 text-base leading-relaxed text-[#6e6e73]"
        data-testid="product-description"
      >
        {product.subtitle}
      </p>
    )}
    <p className="mt-5 break-all text-xs text-[#86868b]">
        SKU:{" "}
      <span className="ml-1 font-medium text-[#515154]">{product.handle}</span>
    </p>
  </div>
)

export default ProductInfo
