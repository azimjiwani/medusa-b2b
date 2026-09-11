import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import type { IStoreModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { readProductRankingState } from "../../../utils/product-ranking-config";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const service: IStoreModuleService = req.scope.resolve(Modules.STORE);
  const [store] = await service.listStores({}, { take: 1 });
  const { published, published_at } = readProductRankingState(store?.metadata);
  return res.json({ config: published, published_at });
};
