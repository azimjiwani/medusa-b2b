"use client"

import SearchProductSkeleton from "@/modules/skeletons/components/search-product-skeleton"

interface SkeletonSearchGridProps {
  count?: number
}

export default function SkeletonSearchGrid({ count = 24 }: SkeletonSearchGridProps) {
  return (
    <>
      {/* Results count skeleton */}
      <div className="mb-4">
        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
      </div>
      
      {/* Products grid skeleton */}
      <ul className="grid grid-cols-1 w-full small:grid-cols-3 medium:grid-cols-4 gap-3">
        {Array.from({ length: count }).map((_, index) => (
          <li key={index}>
            <SearchProductSkeleton />
          </li>
        ))}
      </ul>
      
      {/* Pagination skeleton */}
      <div className="flex justify-center mt-8">
        <div className="flex space-x-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    </>
  )
}