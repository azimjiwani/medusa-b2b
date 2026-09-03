const DEFAULT_BNG_INVENTORY_URL =
  "http://services.batteriesnthings.net/api/v1/inventory"

type InventoryEnvironment = Partial<
  Record<"NODE_ENV" | "BNG_INVENTORY_URL" | "ALLOW_LIVE_BNG_SYNC", string>
>

export function getBngInventoryUrl(
  environment: InventoryEnvironment = process.env as InventoryEnvironment
): string {
  const inventoryUrl =
    environment.BNG_INVENTORY_URL || DEFAULT_BNG_INVENTORY_URL
  const hostname = new URL(inventoryUrl).hostname
  const isLocalFixture = ["localhost", "127.0.0.1", "::1"].includes(hostname)
  const liveSyncIsAllowed = environment.ALLOW_LIVE_BNG_SYNC === "true"

  if (
    environment.NODE_ENV !== "production" &&
    !isLocalFixture &&
    !liveSyncIsAllowed
  ) {
    throw new Error(
      "Refusing to run inventory sync against a non-local BNG URL outside production. Set BNG_INVENTORY_URL to a local fixture or explicitly set ALLOW_LIVE_BNG_SYNC=true."
    )
  }

  return inventoryUrl
}
