import { MedusaService } from "@medusajs/framework/utils";
import { CacheVersion } from "./models";

class CacheVersionModuleService extends MedusaService({
  CacheVersion,
}) {}

export default CacheVersionModuleService;
