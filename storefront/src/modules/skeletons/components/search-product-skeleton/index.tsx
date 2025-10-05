"use client"

export default function SearchProductSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden animate-pulse">
      {/* Product Image Skeleton */}
      <div className="aspect-square bg-gray-200"></div>

      {/* Product Info Skeleton */}
      <div className="p-3">
        {/* Title Skeleton */}
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
        
        {/* Tags Skeleton */}
        <div className="flex flex-wrap gap-1 mb-2">
          <div className="h-6 bg-gray-100 rounded w-16"></div>
          <div className="h-6 bg-gray-100 rounded w-20"></div>
        </div>

        {/* Colors Skeleton */}
        <div className="mb-2">
          <div className="h-3 bg-gray-200 rounded w-12 mb-1"></div>
          <div className="flex flex-wrap gap-1">
            <div className="h-6 bg-blue-100 rounded w-14"></div>
            <div className="h-6 bg-blue-100 rounded w-16"></div>
            <div className="h-6 bg-blue-100 rounded w-12"></div>
          </div>
        </div>

        {/* Sizes Skeleton */}
        <div className="mb-2">
          <div className="h-3 bg-gray-200 rounded w-10 mb-1"></div>
          <div className="flex flex-wrap gap-1">
            <div className="h-5 bg-green-100 rounded w-8"></div>
            <div className="h-5 bg-green-100 rounded w-8"></div>
            <div className="h-5 bg-green-100 rounded w-8"></div>
            <div className="h-5 bg-green-100 rounded w-8"></div>
          </div>
        </div>

        {/* Price placeholder skeleton */}
        <div className="h-4 bg-gray-200 rounded w-24 mt-2"></div>
      </div>
    </div>
  )
}