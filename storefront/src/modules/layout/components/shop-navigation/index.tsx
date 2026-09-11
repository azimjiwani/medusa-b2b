import { listCategories } from "@/lib/data/categories"
import { listBngProductOptions } from "@/lib/data/products"
import { getVisibleCategories } from "@/lib/util/category-filters"
import ShopDropdowns from "./shop-dropdowns"

export default async function ShopNavigation() {
  const [categories, options] = await Promise.all([
    listCategories().catch(() => []),
    listBngProductOptions().catch(() => []),
  ])

  return (
    <ShopDropdowns
      categories={getVisibleCategories(categories).map(
        ({ id, name, handle }) => ({
          id,
          name,
          handle,
        })
      )}
      options={options.filter(
        ({ title }) => title === "Brand" || title === "Device"
      )}
    />
  )
}
