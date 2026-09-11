import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import type { IStoreModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { z } from "@medusajs/framework/zod";
import {
  productRankingSchema,
  readProductRankingState,
  updateProductRankingMetadata,
} from "../../../utils/product-ranking-config";

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
) => {
  const service: IStoreModuleService = req.scope.resolve(Modules.STORE);
  const [store] = await service.listStores({}, { take: 1 });
  if (!store) return res.status(404).json({ message: "Store not found" });
  return res.json(readProductRankingState(store.metadata));
};

const updateSchema = z
  .object({
    action: z.enum(["save", "publish"]),
    config: productRankingSchema,
  })
  .strict();

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({
      message: parsed.error.issues.map((issue) => issue.message).join("; "),
    });
  const service: IStoreModuleService = req.scope.resolve(Modules.STORE);
  const [store] = await service.listStores({}, { take: 1 });
  if (!store) return res.status(404).json({ message: "Store not found" });
  const metadata = updateProductRankingMetadata(
    store.metadata,
    parsed.data.config,
    parsed.data.action,
  );
  await service.updateStores(store.id, { metadata });
  return res.json(readProductRankingState(metadata));
};
