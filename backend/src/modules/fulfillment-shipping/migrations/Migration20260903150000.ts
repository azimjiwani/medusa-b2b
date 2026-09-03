import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260903150000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      update "shipping_option_rule"
      set "value" = to_jsonb('true'::text)
      where "attribute" = 'enabled_in_store'
        and "value" = to_jsonb('"true"'::text);
    `)

    this.addSql(`
      update "tax_region"
      set "provider_id" = 'tp_system'
      where "provider_id" is null;
    `)
  }

  async down(): Promise<void> {
    // Keep the repaired checkout data valid if application code is rolled back.
  }
}
