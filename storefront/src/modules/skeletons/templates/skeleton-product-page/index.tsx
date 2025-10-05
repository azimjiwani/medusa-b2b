const SkeletonProductPage = () => {
  return (
    <div className="flex flex-col gap-y-10 my-6 animate-pulse">
      {/* Product Info Section Skeleton */}
      <div className="content-container">
        <div className="grid grid-cols-1 large:grid-cols-2 gap-8">
          {/* Image Gallery Skeleton */}
          <div className="flex flex-col gap-4">
            {/* Main Image */}
            <div className="aspect-square bg-gray-200 rounded-lg"></div>
            
            {/* Thumbnail Gallery */}
            <div className="flex gap-2">
              {[...Array(4)].map((_, index) => (
                <div
                  key={index}
                  className="w-16 h-16 bg-gray-200 rounded-md flex-shrink-0"
                ></div>
              ))}
            </div>
          </div>

          {/* Product Details Skeleton */}
          <div className="flex flex-col gap-4">
            {/* Title */}
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            
            {/* Price */}
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            
            {/* Colors Section */}
            <div className="flex flex-col gap-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="flex gap-2">
                {[...Array(3)].map((_, index) => (
                  <div
                    key={index}
                    className="w-8 h-8 bg-gray-200 rounded-full"
                  ></div>
                ))}
              </div>
            </div>
            
            {/* Sizes Section */}
            <div className="flex flex-col gap-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="flex gap-2">
                {[...Array(5)].map((_, index) => (
                  <div
                    key={index}
                    className="w-10 h-8 bg-gray-200 rounded"
                  ></div>
                ))}
              </div>
            </div>

            {/* Metadata Table Skeleton */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 p-3">
                <div className="h-5 bg-gray-200 rounded w-1/3"></div>
              </div>
              <div className="divide-y divide-gray-200">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="flex p-3">
                    <div className="w-1/3 h-4 bg-gray-200 rounded mr-4"></div>
                    <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Facts Skeleton */}
      <div className="content-container">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-1 medium:grid-cols-3 gap-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Variants Matrix Skeleton */}
      <div className="content-container">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="overflow-x-auto">
          <div className="min-w-full border border-gray-200 rounded-lg">
            {/* Header */}
            <div className="bg-gray-50 border-b border-gray-200 p-3">
              <div className="flex gap-4">
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="h-4 bg-gray-200 rounded w-12"></div>
                ))}
              </div>
            </div>
            {/* Rows */}
            {[...Array(4)].map((_, rowIndex) => (
              <div key={rowIndex} className="border-b border-gray-200 p-3">
                <div className="flex gap-4">
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  {[...Array(5)].map((_, colIndex) => (
                    <div key={colIndex} className="h-4 bg-gray-200 rounded w-12"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Related Products Skeleton */}
      <div className="content-container">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-1 small:grid-cols-2 medium:grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="aspect-square bg-gray-200"></div>
              <div className="p-3">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SkeletonProductPage