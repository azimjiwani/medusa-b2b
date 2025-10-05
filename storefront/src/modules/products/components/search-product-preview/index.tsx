"use client"

import { SearchProduct } from "@/lib/search/itemsjs-search"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
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
      className="group"
      data-testid="product-link"
    >
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
        {/* Product Image */}
        <div className="aspect-square relative overflow-hidden bg-gray-50">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.title}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
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

        {/* Product Info */}
        <div className="p-3">
          <h3 className="font-medium text-sm line-clamp-2 text-gray-900 mb-2">
            {product.title}
          </h3>
          
          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
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
                  +{product.tags.length - 2} more
                </span>
              )}
            </div>
          )}

          {/* Colors */}
          {product.colors && product.colors.length > 0 && (
            <div className="mb-2">
              <div className="text-xs text-gray-500 mb-1">Colors:</div>
              <div className="flex flex-wrap gap-1">
                {product.colors.slice(0, 3).map((color, index) => (
                  <span
                    key={index}
                    className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded"
                  >
                    {color}
                  </span>
                ))}
                {product.colors.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{product.colors.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Sizes */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="mb-2">
              <div className="text-xs text-gray-500 mb-1">Sizes:</div>
              <div className="flex flex-wrap gap-1">
                {product.sizes.slice(0, 4).map((size, index) => (
                  <span
                    key={index}
                    className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded"
                  >
                    {size}
                  </span>
                ))}
                {product.sizes.length > 4 && (
                  <span className="text-xs text-gray-500">
                    +{product.sizes.length - 4}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Price placeholder - since we don't have price in search index */}
          <div className="text-sm text-gray-500 mt-2">
            {isApproved ? (
              <span>View pricing →</span>
            ) : (
              <span>Login for pricing</span>
            )}
          </div>
        </div>
      </div>
    </LocalizedClientLink>
  )
}