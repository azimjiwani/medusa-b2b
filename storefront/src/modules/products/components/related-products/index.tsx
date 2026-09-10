import { listProducts } from "@/lib/data/products"
import { getRegion } from "@/lib/data/regions"
import { HttpTypes } from "@medusajs/types"
import { Heading } from "@medusajs/ui"
import Product from "../product-preview"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
  customer: any
}

export default async function RelatedProducts({
  product,
  countryCode,
  customer,
}: RelatedProductsProps) {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  // edit this function to define your related products logic
  const queryParams: HttpTypes.StoreProductParams & {
    tags?: string[]
  } = {}
  if (region?.id) {
    queryParams.region_id = region.id
  }
  if (product.collection_id) {
    queryParams.collection_id = [product.collection_id]
  }
  if (product.tags) {
    queryParams.tag_id = product.tags
      .map((t) => t.id)
      .filter(Boolean) as string[]
  }
  queryParams.is_giftcard = false

  const products = await listProducts({
    queryParams,
    countryCode,
  }).then(({ response }) => {
    return response.products.filter(
      (responseProduct) => responseProduct.id !== product.id
    )
  })

  if (!products.length) {
    return null
  }

  return (
    <div className="flex flex-col gap-y-7 py-8 small:py-12">
      <Heading
        level="h2"
        className="text-[28px] small:text-[36px] leading-tight tracking-[-0.035em] text-[#1d1d1f] font-semibold"
      >
        More to explore.
      </Heading>
      <ul className="grid w-full grid-cols-1 min-[640px]:grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-5">
        {products.map((product) => (
          <li key={product.id}>
            <Product region={region} product={product} customer={customer} />
          </li>
        ))}
      </ul>
    </div>
  )
}
