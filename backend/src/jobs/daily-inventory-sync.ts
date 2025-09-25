import { MedusaContainer } from "@medusajs/framework/types"
import dailyInventorySyncWorkflow from "../workflows/inventory/daily-inventory-sync"

export default async function dailyInventorySyncJob(
  container: MedusaContainer
) {
  const { result } = await dailyInventorySyncWorkflow(container)
    .run({
      input: {},
    })

  console.log("Daily inventory sync result:", result)
}

export const config = {
    name: "daily-inventory-sync",
    schedule: "*/15 * * * *", // Run every 15 minutes
};