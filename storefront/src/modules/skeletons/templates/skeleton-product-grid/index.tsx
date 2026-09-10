import repeat from "@/lib/util/repeat"
import SkeletonProductPreview from "@/modules/skeletons/components/skeleton-product-preview"

const SkeletonProductGrid = ({ count = 8 }: { count?: number }) => {
  const countToRender = Math.min(count, 8)

  return (
    <ul
      className="grid w-full grid-cols-1 min-[640px]:grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-5 flex-1"
      data-testid="products-list-loader"
    >
      {repeat(countToRender).map((index) => (
        <li key={index}>
          <SkeletonProductPreview />
        </li>
      ))}
    </ul>
  )
}

export default SkeletonProductGrid
