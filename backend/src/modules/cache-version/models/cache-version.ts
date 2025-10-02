import { model } from "@medusajs/framework/utils";

export const CacheVersion = model.define("cache_version", {
  id: model
    .id({
      prefix: "cv",
    })
    .primaryKey(),
  version: model.text(),
});
