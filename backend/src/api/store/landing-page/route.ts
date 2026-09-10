import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import type { IStoreModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { readLandingPageState } from "../../../utils/landing-page-config";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const service: IStoreModuleService = req.scope.resolve(Modules.STORE);
  const [store] = await service.listStores({}, { take: 1 });
  // Never expose draft content or unrelated store metadata to the public API.
  const { published, published_at } = readLandingPageState(store?.metadata);
  return res.json({
    config: {
      ...published,
      banners: published.hero_enabled
        ? published.banners.filter((banner) => banner.enabled)
        : [],
      sections: published.sections.filter((section) => section.enabled),
    },
    published_at,
  });
};
