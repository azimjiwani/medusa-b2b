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
      <div className="product-card-hover bg-white border border-gray-200 rounded-lg overflow-visible h-full flex flex-col relative transform transition-all duration-300 ease-in-out group-hover:scale-105 group-hover:shadow-xl group-hover:z-50">
        {/* Product Image */}
        <div className="aspect-square relative overflow-hidden bg-gray-50 rounded-t-lg">
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
        </div>

        {/* Product Info - Fixed height with only title visible by default */}
        <div className="p-3 flex-1 flex flex-col relative overflow-visible">
          {/* Always visible title - Fixed height */}
          <div className="h-14 mb-2">
            <h3 className="font-medium text-sm line-clamp-2 text-gray-900 leading-tight">
              {product.title}
            </h3>
          </div>
          
          {/* Details that appear on hover */}
          <div className="product-card-details bg-white border border-gray-200 rounded-lg shadow-lg p-3">
            
            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-gray-500 mb-1 font-medium">Categories:</div>
                <div className="flex flex-wrap gap-1">
                  {product.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {product.tags.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{product.tags.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-gray-500 mb-2 font-medium">Colors:</div>
                <div className="flex flex-wrap gap-1.5">
                  {product.colors.slice(0, 8).map((color, index) => (
                    <ColorImage
                      key={index}
                      colors={[color]}
                      size={20}
                      shape="Circle"
                      showText={false}
                      className="border-2 border-gray-300 hover:border-gray-400 transition-colors"
                      alt={color}
                    />
                  ))}
                  {product.colors.length > 8 && (
                    <span className="text-xs text-gray-500 px-2 py-1 flex items-center">
                      +{product.colors.length - 8}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-gray-500 mb-1 font-medium">Sizes:</div>
                <div className="flex flex-wrap gap-1">
                  {product.sizes.slice(0, 6).map((size, index) => (
                    <span
                      key={index}
                      className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-200"
                    >
                      {size}
                    </span>
                  ))}
                  {product.sizes.length > 6 && (
                    <span className="text-xs text-gray-500 px-1.5 py-0.5">
                      +{product.sizes.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Price placeholder */}
            <div className="text-sm font-medium mt-2 pt-2 border-t border-gray-100">
              {isApproved ? (
                <span className="text-blue-600 hover:text-blue-700">View pricing →</span>
              ) : (
                <span className="text-gray-500">Login for pricing</span>
              )}
            </div>
          </div>

          {/* Minimal pricing info always visible */}
          <div className="mt-auto pt-2">
            <div className="text-xs text-gray-400">
              {isApproved ? "Hover for details" : "Login required"}
            </div>
          </div>
        </div>
      </div>
    </LocalizedClientLink>
  )
}