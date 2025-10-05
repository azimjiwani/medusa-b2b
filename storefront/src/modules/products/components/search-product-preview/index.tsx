"use client"

import { SearchProduct } from "@/lib/search/itemsjs-search"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import ColorImage from "@/modules/products/components/color-image"
import { MinimalCustomerInfo } from "@/types"

interface SearchProductPreviewProps {
  product: SearchProduct
  customer: MinimalCustomerInfo | null
  region?: { currency_code: string } | null
}

export default function SearchProductPreview({
  product,
  customer,
  region
}: SearchProductPreviewProps) {
  const isApproved = customer?.isApproved || false
  const isLoggedIn = customer?.isLoggedIn || false
  
  return (
    <LocalizedClientLink
      href={`/products/${product.handle}`}
      className="group block h-full"
      data-testid="product-link"
    >
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden h-full flex flex-col relative transform transition-all duration-300 ease-in-out group-hover:scale-105 group-hover:shadow-xl group-hover:z-50">
        {/* Product Image */}
        <div className="aspect-square relative overflow-hidden bg-gray-50 rounded-t-lg flex-shrink-0">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.title}
              className="object-cover w-full h-full transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <span>No Image</span>
            </div>
          )}
          
          {/* Outlet badge */}
          {product.outlet && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
              OUTLET
            </div>
          )}

          {/* Sizes overlay - appears on hover, positioned on the right side vertically */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {product.sizes.slice(0, 6).map((size, index) => (
                <span
                  key={index}
                  className="text-xs bg-white/90 backdrop-blur-sm text-gray-800 px-1.5 py-0.5 rounded shadow-sm border border-gray-200 font-medium"
                >
                  {size}
                </span>
              ))}
              {product.sizes.length > 6 && (
                <span className="text-xs bg-white/90 backdrop-blur-sm text-gray-600 px-1.5 py-0.5 rounded shadow-sm border border-gray-200">
                  +{product.sizes.length - 6}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Product Info - Expands on hover */}
        <div className="p-3 flex-1 flex flex-col min-h-0 transition-all duration-300 group-hover:min-h-fit">
          {/* Always visible content */}
          <div className="flex-shrink-0">
            {/* Title */}
            <h3 className="font-medium text-sm line-clamp-2 text-gray-900 mb-2 leading-tight">
              {product.title}
            </h3>
            
            {/* Categories - Always visible */}
            {product.tags && product.tags.length > 0 && (
              <div className="mb-2">
                <div className="flex flex-wrap gap-1">
                  {product.tags.slice(0, 2).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {product.tags.length > 2 && (
                    <span className="text-xs text-gray-500">
                      +{product.tags.length - 2}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Colors - Always visible */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-2">
                <div className="flex flex-wrap gap-1.5">
                  {product.colors.slice(0, 6).map((color, index) => (
                    <ColorImage
                      key={index}
                      colors={[color]}
                      size={18}
                      shape="Circle"
                      showText={false}
                      className="border-2 border-gray-300 hover:border-gray-400 transition-colors"
                      alt={color}
                    />
                  ))}
                  {product.colors.length > 6 && (
                    <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-xs text-gray-600 font-medium">+</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Bottom spacing with enhanced call-to-action */}
          <div className="mt-auto pt-1 flex-shrink-0">
            <div className="text-xs transition-all duration-300 group-hover:text-sm group-hover:font-medium group-hover:text-blue-600">
              {isApproved ? "Click for details" : "Login required"}
            </div>
          </div>
        </div>
      </div>
    </LocalizedClientLink>
  )
}