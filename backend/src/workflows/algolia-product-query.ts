export const getAlgoliaProductListArgs = (productIds?: string[]) => ({
  filters: productIds?.length ? { id: productIds } : {},
  config: {
    relations: ["variants", "categories", "tags", "images"],
  },
})
