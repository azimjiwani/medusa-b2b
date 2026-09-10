import { HttpTypes } from "@medusajs/types"
import ImageGallery from "@/modules/products/components/image-gallery"
import ProductActions from "@/modules/products/components/product-actions"
import ProductTabs from "@/modules/products/components/product-tabs"
import RelatedProducts from "@/modules/products/components/related-products"
import ProductInfo from "@/modules/products/templates/product-info"
import SkeletonRelatedProducts from "@/modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import React, { Suspense } from "react"
import ProductActionsWrapper from "./product-actions-wrapper"
import ProductFacts from "../components/product-facts"
import { B2BCustomer } from "@/types"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  customer: B2BCustomer | null
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  customer,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  const minimalCustomer = customer
    ? {
        isLoggedIn: true,
        isApproved: !!customer.metadata?.approved,
      }
    : { isLoggedIn: false, isApproved: false }

  return (
    <div className="bg-[#f5f5f7] pb-8">
      <nav
        aria-label="Breadcrumb"
        className="mx-auto flex max-w-[1344px] flex-wrap items-center gap-2 px-5 py-5 text-xs text-[#86868b] small:px-8 small:py-6"
      >
        <LocalizedClientLink
          href="/store"
          className="inline-flex min-h-11 items-center gap-2 font-medium text-[#515154] hover:text-[#0066cc]"
        >
          <span aria-hidden="true">←</span> All products
        </LocalizedClientLink>
        <span aria-hidden="true" className="mx-1">
          /
        </span>
        <span aria-current="page" className="break-all">
          {product.handle}
        </span>
      </nav>
      <div
        className="mx-auto grid max-w-[1344px] grid-cols-1 small:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] items-start gap-5 px-5 small:px-8 small:gap-7"
        data-testid="product-container"
      >
        <ImageGallery product={product} />
        <div className="flex min-w-0 flex-col rounded-[28px] bg-white w-full gap-7 p-6 small:p-9 shadow-[0_4px_20px_rgba(0,0,0,0.025)]">
          <ProductInfo product={product} />
          <Suspense
            fallback={
              <ProductActions
                product={product}
                region={region}
                customer={customer}
              />
            }
          >
            <ProductActionsWrapper
              id={product.id}
              region={region}
              customer={customer}
            />
          </Suspense>
          <ProductFacts product={product} customer={customer} />
        </div>
      </div>
      <div className="mx-auto mt-7 max-w-[1344px] px-5 small:px-8">
        <ProductTabs product={product} />
      </div>
      <div
        className="mx-auto mt-7 max-w-[1344px] px-5 small:px-8"
        data-testid="related-products-container"
      >
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts
            product={product}
            countryCode={countryCode}
            customer={minimalCustomer}
          />
        </Suspense>
      </div>
    </div>
  )
}

export default ProductTemplate
