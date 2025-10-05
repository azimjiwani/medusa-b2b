import type {
    CreateCustomerAddressDTO,
    CreateUserDTO,
    CustomerDTO,
    ExecArgs,
} from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { createCustomerAddressesWorkflow } from "@medusajs/medusa/core-flows";
import fs from "fs";
import path from "path";

/**
 * Interfaccia per la struttura JSON esportata da Spree
 */
interface SpreeAddress {
  id?: number | null;
  type?: "billing" | "shipping" | "other";
  firstname?: string;
  lastname?: string;
  address1?: string;
  address2?: string;
  city?: string;
    zipcode?: string;
    phone?: string;
    state?: string;
    country?: string;
    company?: string;
  }

  interface SpreeUser {
    user_id: number;
    email: string;
    registered_at: string;
    updated_at?: string;
    last_sign_in_at?: string;
    spree_api_key?: string;
    confirmed_at?: string;
    addresses?: SpreeAddress[];
    phone?: string;
    company?: string;
    bill_address_id?: number | null;
    ship_address_id?: number | null;
    tax_code?: string | null;
    vat_number?: string | null;
    pec?: string | null;
    sdi?: string | null;
    zucchetti_code?: string | null;
  }

/**
 * Parser CLI semplice (senza librerie esterne)
 */
function parseArgs(): { file: string } {
  const args = process.argv.slice(2);
  const fileFlagIndex = args.findIndex((a) => a === "--file" || a === "-f");

  if (fileFlagIndex === -1 || !args[fileFlagIndex + 1]) {
    console.error("❌ Devi specificare il file da leggere con --file <path>");
    console.error("   Esempio: npx medusa exec ./src/scripts/import-spree-users.ts -- --file ./import_data/spree_users_export.json");
    process.exit(1);
  }

  const file = path.resolve(args[fileFlagIndex + 1]);
  return { file };
}

/**
 * Script principale
 */
export default async function run({ container }: ExecArgs) {
  const { file } = parseArgs();

  const customerModuleService = container.resolve(Modules.CUSTOMER);
  const userModuleService = container.resolve(Modules.USER);
  const createAddresses = createCustomerAddressesWorkflow(container);

  if (!fs.existsSync(file)) {
    console.error(`❌ File non trovato: ${file}`);
    process.exit(1);
  }

  console.log(`📂 Lettura file: ${file}`);
  const rawData = fs.readFileSync(file, "utf-8");

  let customers: SpreeUser[];
  try {
    customers = JSON.parse(rawData);
  } catch (err) {
    console.error("❌ Errore nel parsing del file JSON:", err);
    process.exit(1);
  }

  console.log(`📦 Importazione di ${customers.length} utenti da Spree...`);

  for (const u of customers) {
    try {
      if (!u.email) {
        console.warn(`⚠️ Utente senza email, ID=${u.user_id}, ignorato`);
        continue;
      }

      const email = u.email.trim();
      const normalizedEmail = email.toLowerCase();
      const emailFilters = Array.from(new Set([email, normalizedEmail]));

      const [existingCustomer] = await customerModuleService.listCustomers(
        { email: emailFilters },
        { take: 1 }
      );

      let customer = existingCustomer;

      if (!customer) {
        const firstAddress = u.addresses?.[0];
        const metadata = buildCustomerMetadata(u);
        const createdCustomers = await customerModuleService.createCustomers([
          {
            email: normalizedEmail,
            first_name: firstAddress?.firstname ?? null,
            last_name: firstAddress?.lastname ?? null,
            phone: u.phone ?? null,
            company_name: u.company ?? null,
            metadata,
          },
        ]);

        customer = createdCustomers?.[0];

        if (!customer) {
          throw new Error("creazione cliente non riuscita");
        }
        console.log(`✅ Creato cliente ${email}`);
      } else {
        const metadata = buildCustomerMetadata(u, customer.metadata ?? {});

        await customerModuleService.updateCustomers(customer.id, {
          phone: u.phone ?? customer.phone ?? null,
          company_name: u.company ?? customer.company_name ?? null,
          metadata,
        });

        console.log(`↺ Cliente esistente ${email}`);
      }

      const addresses = buildCustomerAddresses(u.addresses ?? [], customer.id, {
        billAddressId: u.bill_address_id,
        fallbackPhone: u.phone,
        fallbackCompany: u.company,
      });

      if (addresses.length) {
        await createAddresses.run({
          input: {
            addresses,
          },
        });
        console.log(`🏠 Importati ${addresses.length} indirizzi per ${email}`);
      }

      const userResult = await ensureUserForCustomer(
        userModuleService,
        customer,
        emailFilters
      );

      if (userResult?.status === "created") {
        console.log(`👤 Creato utente ${userResult.email}`);
      } else if (userResult?.status === "existing") {
        console.log(`👤 Utente esistente ${userResult.email}`);
      }
    } catch (err: any) {
      console.error(`❌ Errore import ${u.email}: ${err.message}`);
    }
  }

  console.log("✅ Importazione completata con successo.");
}

type UserEnsureResult =
  | { status: "existing"; email: string }
  | { status: "created"; email: string };

async function ensureUserForCustomer(
  userModuleService: any,
  customer: Pick<CustomerDTO, "email" | "first_name" | "last_name">,
  emailFilters: string[]
): Promise<UserEnsureResult | null> {
  const email = customer.email;

  if (!email) {
    return null;
  }

  const [existingUser] = await userModuleService.listUsers(
    { email: emailFilters },
    { take: 1 }
  );

  if (existingUser) {
    return { status: "existing", email: existingUser.email ?? email };
  }

  const payload: CreateUserDTO = {
    email,
    first_name: customer.first_name ?? null,
    last_name: customer.last_name ?? null,
  };

  const createdUsers = await userModuleService.createUsers([payload]);
  const user = Array.isArray(createdUsers)
    ? createdUsers[0]
    : createdUsers;

  if (!user) {
    throw new Error("creazione utente non riuscita");
  }

  return { status: "created", email: user.email ?? email };
}

function buildCustomerAddresses(
  addresses: SpreeAddress[],
  customerId: string,
  options: {
    billAddressId?: number;
    fallbackPhone?: string | null;
    fallbackCompany?: string | null;
  }
): CreateCustomerAddressDTO[] {
  const seenDefaults = {
    shipping: false,
    billing: false,
  };

  return addresses.reduce<CreateCustomerAddressDTO[]>((acc, addr, index) => {
    const hasContent = Boolean(
      addr.address1 || addr.address2 || addr.city || addr.zipcode
    );

    if (!hasContent) {
      return acc;
    }

    const isBilling = Boolean(
      (options.billAddressId && addr.id === options.billAddressId) ||
        addr.type === "billing"
    );
    const isShipping = addr.type === "shipping";

    const baseFirstName = addr.firstname ?? null;
    const firstName = isBilling
      ? baseFirstName
        ? `Fatturazione - ${baseFirstName}`
        : "Fatturazione"
      : baseFirstName;

    const resolvedType =
      addr.type ?? (isBilling ? "billing" : isShipping ? "shipping" : "other");

    const payload: CreateCustomerAddressDTO = {
      customer_id: customerId,
      address_name: `${resolvedType}-${index + 1}`,
      first_name: firstName,
      last_name: addr.lastname ?? null,
      address_1: addr.address1 ?? "",
      address_2: addr.address2 ?? "",
      city: addr.city ?? "",
      postal_code: addr.zipcode ?? "",
      country_code: (addr.country ?? "it").toLowerCase(),
      province: addr.state ?? null,
      phone: addr.phone ?? options.fallbackPhone ?? null,
      company: addr.company ?? options.fallbackCompany ?? null,
      metadata: {
        spree_type: resolvedType,
        spree_state: addr.state,
        spree_address_id: addr.id,
      },
    };

    if (isShipping && !seenDefaults.shipping) {
      payload.is_default_shipping = true;
      seenDefaults.shipping = true;
    }

    if (isBilling && !seenDefaults.billing) {
      payload.is_default_billing = true;
      seenDefaults.billing = true;
    }

    acc.push(payload);
    return acc;
  }, []);
}

function buildCustomerMetadata(
  user: SpreeUser,
  base: Record<string, unknown> = {}
) {
  return {
    ...base,
    spree_user_id: user.user_id,
    spree_registered_at: user.registered_at,
    spree_confirmed_at: user.confirmed_at,
    spree_phone: user.phone,
    spree_company: user.company,
    fiscal_code: user.tax_code ?? null,
    vat_number: user.vat_number ?? null,
    pec_address: user.pec ?? null,
    sdi_code: user.sdi ?? null,
    customer_code: user.zucchetti_code ?? null,
  };
}
