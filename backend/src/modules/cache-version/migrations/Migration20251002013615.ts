import { Migration } from '@mikro-orm/migrations';

export class Migration20251002013615 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "cache_version" ("id" text not null, "version" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "cache_version_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_cache_version_deleted_at" ON "cache_version" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "cache_version" cascade;`);
  }

}
