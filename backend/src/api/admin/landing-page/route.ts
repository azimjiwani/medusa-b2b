import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import type { IStoreModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { z } from "@medusajs/framework/zod";
import {
  landingPageSchema,
  landingPageDraftSchema,
  readLandingPageState,
  updateLandingPageMetadata,
} from "../../../utils/landing-page-config";

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service: IStoreModuleService = req.scope.resolve(Modules.STORE);
  const [store] = await service.listStores({}, { take: 1 });
  if (!store) return res.status(404).json({ message: "Store not found" });
  return res.json(readLandingPageState(store.metadata));
};

const updateSchema = z.discriminatedUnion("action", [
  z
    .object({ action: z.literal("save"), config: landingPageDraftSchema })
    .strict(),
  z
    .object({ action: z.literal("publish"), config: landingPageSchema })
    .strict(),
]);

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({
      message: parsed.error.issues
        .map((issue) => {
          const bannerIndex = issue.path.indexOf("banners");
          const banner = issue.path[bannerIndex + 1];
          if (bannerIndex >= 0 && typeof banner === "number")
            return `Banner ${banner + 1}: ${issue.message}`;
          const sectionIndex = issue.path.indexOf("sections");
          const index = issue.path[sectionIndex + 1];
          return sectionIndex >= 0 && typeof index === "number"
            ? `Section ${index + 1}: ${issue.message}`
            : issue.message;
        })
        .join("; "),
    });
  const service: IStoreModuleService = req.scope.resolve(Modules.STORE);
  const [store] = await service.listStores({}, { take: 1 });
  if (!store) return res.status(404).json({ message: "Store not found" });
  const metadata = updateLandingPageMetadata(
    store.metadata,
    parsed.data.config,
    parsed.data.action
  );
  await service.updateStores(store.id, { metadata });
  return res.json(readLandingPageState(metadata));
};
