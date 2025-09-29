import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ModuleRegistrationName, ContainerRegistrationKeys } from "@medusajs/framework/utils"

interface PriceData {
    sku: string;
    price: number;
    wholesale_level1: number;
    wholesale_level2: number;
    wholesale_level3: number;
}

interface PriceSyncInput {
    priceData: PriceData[];
    customerGroups: {
        wholesale1: string;
        wholesale2: string;
        wholesale3: string;
    };
}

interface PriceSyncResult {
    success: boolean;
    error?: string;
    defaultPricesUpdated: number;
    customerGroupPricesUpdated: number;
    summary: {
        totalProcessed: number;
        defaultPricesUpdated: number;
        wholesale1Updated: number;
        wholesale2Updated: number;
        wholesale3Updated: number;
        errors: number;
    };
}

export const syncPricesEmbeddedStep = createStep(
    "sync-prices-embedded-step",
    async (input: PriceSyncInput, { container }: any) => {
        try {
            console.log("=== STARTING EMBEDDED PRICE SYNC ===");
            console.log(`Sync started at: ${new Date().toISOString()}`);
            console.log(`Processing ${input.priceData.length} products`);

            const query = container.resolve(ContainerRegistrationKeys.QUERY);
            const productService = container.resolve(ModuleRegistrationName.PRODUCT);
            
            let defaultPricesUpdated = 0;
            let wholesale1Updated = 0;
            let wholesale2Updated = 0;
            let wholesale3Updated = 0;
            let errors = 0;

            // Process each product's pricing data
            for (const product of input.priceData) {
                try {
                    // Get variant by SKU to find price set
                    const variants = await productService.listProductVariants({
                        sku: product.sku
                    });

                    if (!variants || variants.length === 0) {
                        console.log(`⚠️  No variant found for SKU: ${product.sku}`);
                        continue;
                    }

                    const variant = variants[0];
                    
                    // Get price set for this variant
                    const priceSetData = await query.graph({
                        entity: "product_variant_price_set",
                        filters: { variant_id: variant.id },
                        fields: ["price_set_id"]
                    });

                    if (!priceSetData.data || priceSetData.data.length === 0) {
                        console.log(`⚠️  No price set found for variant: ${variant.sku}`);
                        continue;
                    }

                    const priceSetId = priceSetData.data[0].price_set_id;

                    // 1. Update default price
                    if (product.price && product.price > 0) {
                        await query.raw(`
                            UPDATE price 
                            SET amount = $1, 
                                raw_amount = $2::jsonb,
                                updated_at = NOW()
                            WHERE price_set_id = $3 
                              AND price_list_id IS NULL 
                              AND currency_code = 'cad'
                              AND deleted_at IS NULL
                        `, [
                            product.price,
                            JSON.stringify({ value: product.price.toString(), precision: 20 }),
                            priceSetId
                        ]);
                        defaultPricesUpdated++;
                        console.log(`✓ Updated default price for ${product.sku}: $${product.price}`);
                    }

                    // 2. Update/Create Wholesale Level 1 price ($15 in our example)
                    if (product.wholesale_level1 && product.wholesale_level1 > 0) {
                        const priceId = `price_wholesale1_${variant.id}`;
                        
                        await query.raw(`
                            INSERT INTO price (
                                id, 
                                price_set_id, 
                                currency_code, 
                                amount, 
                                raw_amount, 
                                rules_count,
                                created_at, 
                                updated_at
                            )
                            VALUES ($1, $2, 'cad', $3, $4::jsonb, 1, NOW(), NOW())
                            ON CONFLICT (id) DO UPDATE 
                            SET amount = EXCLUDED.amount,
                                raw_amount = EXCLUDED.raw_amount,
                                updated_at = NOW()
                        `, [
                            priceId,
                            priceSetId,
                            product.wholesale_level1,
                            JSON.stringify({ value: product.wholesale_level1.toString(), precision: 20 })
                        ]);

                        // Create/Update price rule
                        await query.raw(`
                            INSERT INTO price_rule (
                                id, 
                                price_id, 
                                attribute, 
                                operator, 
                                value, 
                                priority,
                                created_at, 
                                updated_at
                            )
                            VALUES ($1, $2, 'customer.groups.id', 'eq', $3, 0, NOW(), NOW())
                            ON CONFLICT (id) DO UPDATE 
                            SET value = EXCLUDED.value,
                                updated_at = NOW()
                        `, [
                            `prule_wholesale1_${variant.id}`,
                            priceId,
                            input.customerGroups.wholesale1
                        ]);

                        wholesale1Updated++;
                        console.log(`✓ Updated Wholesale Level 1 price for ${product.sku}: $${product.wholesale_level1}`);
                    }

                    // 3. Update/Create Wholesale Level 2 price ($12 in our example)
                    if (product.wholesale_level2 && product.wholesale_level2 > 0) {
                        const priceId = `price_wholesale2_${variant.id}`;
                        
                        await query.raw(`
                            INSERT INTO price (
                                id, 
                                price_set_id, 
                                currency_code, 
                                amount, 
                                raw_amount, 
                                rules_count,
                                created_at, 
                                updated_at
                            )
                            VALUES ($1, $2, 'cad', $3, $4::jsonb, 1, NOW(), NOW())
                            ON CONFLICT (id) DO UPDATE 
                            SET amount = EXCLUDED.amount,
                                raw_amount = EXCLUDED.raw_amount,
                                updated_at = NOW()
                        `, [
                            priceId,
                            priceSetId,
                            product.wholesale_level2,
                            JSON.stringify({ value: product.wholesale_level2.toString(), precision: 20 })
                        ]);

                        // Create/Update price rule
                        await query.raw(`
                            INSERT INTO price_rule (
                                id, 
                                price_id, 
                                attribute, 
                                operator, 
                                value, 
                                priority,
                                created_at, 
                                updated_at
                            )
                            VALUES ($1, $2, 'customer.groups.id', 'eq', $3, 0, NOW(), NOW())
                            ON CONFLICT (id) DO UPDATE 
                            SET value = EXCLUDED.value,
                                updated_at = NOW()
                        `, [
                            `prule_wholesale2_${variant.id}`,
                            priceId,
                            input.customerGroups.wholesale2
                        ]);

                        wholesale2Updated++;
                        console.log(`✓ Updated Wholesale Level 2 price for ${product.sku}: $${product.wholesale_level2}`);
                    }

                    // 4. Update/Create Wholesale Level 3 price ($14 in our example)
                    if (product.wholesale_level3 && product.wholesale_level3 > 0) {
                        const priceId = `price_wholesale3_${variant.id}`;
                        
                        await query.raw(`
                            INSERT INTO price (
                                id, 
                                price_set_id, 
                                currency_code, 
                                amount, 
                                raw_amount, 
                                rules_count,
                                created_at, 
                                updated_at
                            )
                            VALUES ($1, $2, 'cad', $3, $4::jsonb, 1, NOW(), NOW())
                            ON CONFLICT (id) DO UPDATE 
                            SET amount = EXCLUDED.amount,
                                raw_amount = EXCLUDED.raw_amount,
                                updated_at = NOW()
                        `, [
                            priceId,
                            priceSetId,
                            product.wholesale_level3,
                            JSON.stringify({ value: product.wholesale_level3.toString(), precision: 20 })
                        ]);

                        // Create/Update price rule
                        await query.raw(`
                            INSERT INTO price_rule (
                                id, 
                                price_id, 
                                attribute, 
                                operator, 
                                value, 
                                priority,
                                created_at, 
                                updated_at
                            )
                            VALUES ($1, $2, 'customer.groups.id', 'eq', $3, 0, NOW(), NOW())
                            ON CONFLICT (id) DO UPDATE 
                            SET value = EXCLUDED.value,
                                updated_at = NOW()
                        `, [
                            `prule_wholesale3_${variant.id}`,
                            priceId,
                            input.customerGroups.wholesale3
                        ]);

                        wholesale3Updated++;
                        console.log(`✓ Updated Wholesale Level 3 price for ${product.sku}: $${product.wholesale_level3}`);
                    }

                } catch (error: any) {
                    console.error(`Error processing price for ${product.sku}:`, error.message || error);
                    errors++;
                }
            }

            const totalCustomerGroupPricesUpdated = wholesale1Updated + wholesale2Updated + wholesale3Updated;

            console.log("\n=== EMBEDDED PRICE SYNC SUMMARY ===");
            console.log(`Products processed: ${input.priceData.length}`);
            console.log(`Default prices updated: ${defaultPricesUpdated}`);
            console.log(`Wholesale Level 1 prices updated: ${wholesale1Updated}`);
            console.log(`Wholesale Level 2 prices updated: ${wholesale2Updated}`);
            console.log(`Wholesale Level 3 prices updated: ${wholesale3Updated}`);
            console.log(`Total customer group prices updated: ${totalCustomerGroupPricesUpdated}`);
            console.log(`Errors: ${errors}`);
            console.log(`Sync completed at: ${new Date().toISOString()}`);

            return new StepResponse({
                success: true,
                defaultPricesUpdated,
                customerGroupPricesUpdated: totalCustomerGroupPricesUpdated,
                summary: {
                    totalProcessed: input.priceData.length,
                    defaultPricesUpdated,
                    wholesale1Updated,
                    wholesale2Updated,
                    wholesale3Updated,
                    errors
                }
            });

        } catch (error: any) {
            console.error("Error occurred during embedded price sync:", error);
            return new StepResponse({
                success: false,
                error: error.message,
                defaultPricesUpdated: 0,
                customerGroupPricesUpdated: 0,
                summary: {
                    totalProcessed: 0,
                    defaultPricesUpdated: 0,
                    wholesale1Updated: 0,
                    wholesale2Updated: 0,
                    wholesale3Updated: 0,
                    errors: 1
                }
            });
        }
    }
)