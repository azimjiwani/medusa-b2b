// src/scripts/delete-all-inventory-items.ts

import { ExecArgs } from "@medusajs/framework/types"
import { deleteInventoryItemWorkflow } from "@medusajs/medusa/core-flows"

export default async function deleteAllInventoryItems({ container, logger }: ExecArgs) {
  // Recupera tutti gli ID degli inventory items
  const query = container.resolve("query")
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  })

  const ids = inventoryItems.map((item: { id: string }) => item.id)

  if (ids.length === 0) {
    logger.info("Nessun inventory item trovato.")
    return
  }

  logger.info(`Trovati ${ids.length} inventory items. Procedo con la cancellazione...`)

  // Cancella tutti gli inventory items trovati
  const { result } = await deleteInventoryItemWorkflow({ container })
    .run({ input: ids })

  logger.info(`Cancellati ${result.length} inventory items.`)
}
