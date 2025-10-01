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
    schedule: "*/30 * * * *", // Run every 30 minutes
};