import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import dailyInventorySyncWorkflow from "../workflows/inventory/daily-inventory-sync";

/**
 * This script runs the daily inventory sync workflow.
 * Execute by running `npx medusa exec src/scripts/run-inventory-sync.ts`
 */
export default async function runInventorySync({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  
  try {
    logger.info("Starting daily inventory sync workflow...");
    const { result } = await dailyInventorySyncWorkflow.run({
      input: {},
      container,
    });
    logger.info("Workflow completed:", result);
  } catch (error) {
    logger.error("Workflow failed:", error);
  }
}