type InventoryVariant = {
  allow_backorder?: boolean | null
  inventory_quantity?: number | null
  manage_inventory?: boolean | null
}

export const UNLIMITED_INVENTORY = 999_999

export const getAvailableInventory = (variant?: InventoryVariant | null): number => {
  if (variant?.manage_inventory === false || variant?.allow_backorder) {
    return UNLIMITED_INVENTORY
  }

  return Math.max(0, variant?.inventory_quantity ?? 0)
}

export const formatInventory = (inventoryQuantity: number): string => {
  if (inventoryQuantity >= UNLIMITED_INVENTORY) {
    return "In stock"
  }

  if (inventoryQuantity === 0) {
    return "Out of stock"
  }

  return inventoryQuantity < 100 ? "< 100 in stock" : "100+ in stock"
}
