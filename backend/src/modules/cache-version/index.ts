import { Module } from "@medusajs/framework/utils";
import CacheVersionModuleService from "./service";

export const CACHE_VERSION_MODULE = "cacheVersion";

export default Module(CACHE_VERSION_MODULE, {
  service: CacheVersionModuleService,
});
