type Environment = Record<string, string | undefined>

export const toInventoryProductHandle = (sku: string) =>
  sku
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

export const getInventorySyncReferences = (env: Environment = process.env) => ({
  salesChannelId:
    env.INVENTORY_SYNC_SALES_CHANNEL_ID || "sc_01JVWCJ6BKX3RMSEVS193GX8TM",
  shippingProfileId:
    env.INVENTORY_SYNC_SHIPPING_PROFILE_ID || "sp_01JVWCGP3VMEM2AGW36ZVNGFPW",
  customerGroups: {
    wholesale1:
      env.INVENTORY_SYNC_WHOLESALE_1_GROUP_ID || "cusgroup_01JZE2HPC55BK2694XKDMME92X",
    wholesale2:
      env.INVENTORY_SYNC_WHOLESALE_2_GROUP_ID || "cusgroup_01JZE2J7YB302W5F46CEKFJ1TZ",
    wholesale3:
      env.INVENTORY_SYNC_WHOLESALE_3_GROUP_ID || "cusgroup_01JZE2JH53DVYMSXQ0M7ADH9SX",
  },
})

export const buildInventoryPriceUpdate = (
  existingPrice: { id: string } | undefined,
  amount: number,
  customerGroupId?: string
) => ({
  ...(existingPrice ? { id: existingPrice.id } : {}),
  currency_code: "cad",
  amount,
  ...(customerGroupId
    ? { rules: { "customer.groups.id": customerGroupId } }
    : {}),
})
