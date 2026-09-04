# Custom CLI Script

A custom CLI script is a function to execute through Medusa's CLI tool. This is useful when creating custom Medusa tooling to run as a CLI tool.

## How to Create a Custom CLI Script?

To create a custom CLI script, create a TypeScript or JavaScript file under the `src/scripts` directory. The file must default export a function.

For example, create the file `src/scripts/my-script.ts` with the following content:

```ts title="src/scripts/my-script.ts"
import { ExecArgs, IProductModuleService } from "@medusajs/framework/types";
import { ModuleRegistrationName } from "@medusajs/framework/utils";

export default async function myScript({ container }: ExecArgs) {
  const productModuleService: IProductModuleService = container.resolve(
    ModuleRegistrationName.PRODUCT
  );

  const [, count] = await productModuleService.listAndCount();

  console.log(`You have ${count} product(s)`);
}
```

The function receives as a parameter an object having a `container` property, which is an instance of the Medusa Container. Use it to resolve resources in your Medusa application.

---

## How to Run Custom CLI Script?

To run the custom CLI script, run the `exec` command:

```bash
npx medusa exec ./src/scripts/my-script.ts
```

---

## Custom CLI Script Arguments

Your script can accept arguments from the command line. Arguments are passed to the function's object parameter in the `args` property.

For example:

```ts
import { ExecArgs } from "@medusajs/framework/types";

export default async function myScript({ args }: ExecArgs) {
  console.log(`The arguments you passed: ${args}`);
}
```

Then, pass the arguments in the `exec` command after the file path:

```bash
npx medusa exec ./src/scripts/my-script.ts arg1 arg2
```

## Backfill BNG Product Options

Provision the eight reusable global option definitions before running a dry run
or enabling scheduled writes:

```bash
yarn provision:bng-product-options
```

The provisioning command is idempotent and creates empty Brand, Color, Device,
Capacity, Length, Material, Memory, and Watts definitions through Medusa's
Product Module. It reuses an existing unique definition and marks it with BNG
ownership metadata. Reconciliation fails without mutating the catalog if any
definition is missing or duplicated.

The BNG product-option backfill is read-only by default and prints a structured
summary of proposed reusable option values, product associations,
variant assignments, removals, rejections, and failures:

```bash
yarn backfill:bng-product-options --dry-run
```

After reviewing the dry run, apply the same reconciliation logic against a
fresh source snapshot with:

```bash
yarn backfill:bng-product-options --apply
```

Scheduled and manual inventory syncs run the same validation and reconciliation
logic. Product-option writes remain gated until
`BNG_PRODUCT_OPTIONS_SYNC_ENABLED=true`. Safety thresholds can be tightened with
`BNG_SYNC_MIN_B2B_PRODUCTS`, `BNG_SYNC_MAX_PRODUCT_REMOVALS`,
`BNG_SYNC_MAX_PRODUCT_REMOVAL_FRACTION`, `BNG_SYNC_MAX_OPTION_REMOVALS`, and
`BNG_SYNC_MAX_OPTION_REMOVAL_FRACTION`.
