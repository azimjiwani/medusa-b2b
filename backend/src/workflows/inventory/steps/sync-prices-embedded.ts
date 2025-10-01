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
            const pricingService = container.resolve(ModuleRegistrationName.PRICING);
            const remoteLink = container.resolve(ContainerRegistrationKeys.LINK);
            
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

                    let priceSetId: string;
                    
                    if (!priceSetData.data || priceSetData.data.length === 0) {
                        console.log(`⚠️  No price set found for variant: ${variant.sku}. Creating new price set...`);
                        
                        // Create a new price set for this variant
                        try {
                            const newPriceSet = await pricingService.createPriceSets({
                                prices: [
                                    {
                                        currency_code: "cad",
                                        amount: product.price || 0,
                                        rules: {}
                                    }
                                ]
                            });
                            
                            priceSetId = newPriceSet.id;
                            console.log(`✓ Created new price set ${priceSetId} for ${variant.sku}`);
                            
                            // Link the price set to the variant using remote link
                            await remoteLink.create({
                                [ModuleRegistrationName.PRODUCT]: {
                                    variant_id: variant.id,
                                },
                                [ModuleRegistrationName.PRICING]: {
                                    price_set_id: priceSetId,
                                }
                            });
                            
                            console.log(`✓ Linked price set to variant ${variant.sku}`);
                            
                        } catch (createError: any) {
                            console.error(`Failed to create price set for ${product.sku}:`, createError.message);
                            errors++;
                            continue;
                        }
                    } else {
                        priceSetId = priceSetData.data[0].price_set_id;
                    }

                    // Get the full price set with all prices
                    let priceSet;
                    try {
                        priceSet = await pricingService.retrievePriceSet(
                            priceSetId,
                            { relations: ["prices", "prices.price_rules"] }
                        );
                        
                        if (!priceSet || !priceSet.prices) {
                            console.log(`⚠️  No prices found for price set: ${priceSetId}`);
                            continue;
                        }
                    } catch (retrieveError: any) {
                        console.error(`Failed to retrieve price set for ${product.sku} (${priceSetId}):`, retrieveError.message);
                        errors++;
                        continue;
                    }

                    // Track if any prices need updating
                    const pricesToUpdate: any[] = [];
                    
                    // 1. Check and update default price
                    if (product.price && product.price > 0) {
                        const defaultPrice = priceSet.prices.find((p: any) => 
                            p.currency_code === 'cad' && 
                            (!p.price_rules || p.price_rules.length === 0)
                        );

                        if (!defaultPrice || defaultPrice.amount !== product.price) {
                            pricesToUpdate.push({
                                currency_code: "cad",
                                amount: product.price,
                                rules: {}
                            });
                            defaultPricesUpdated++;
                            console.log(`✓ Will update default price for ${product.sku}: ${defaultPrice?.amount || 'N/A'} → $${product.price}`);
                        }
                    }

                    // 2. Check and update Wholesale Level 1 price
                    if (product.wholesale_level1 && product.wholesale_level1 > 0) {
                        const wholesale1Price = priceSet.prices.find((p: any) => 
                            p.currency_code === 'cad' && 
                            p.price_rules?.some((r: any) => 
                                r.attribute === 'customer.groups.id' && 
                                r.value === input.customerGroups.wholesale1
                            )
                        );

                        if (!wholesale1Price || wholesale1Price.amount !== product.wholesale_level1) {
                            pricesToUpdate.push({
                                currency_code: "cad",
                                amount: product.wholesale_level1,
                                rules: {
                                    "customer.groups.id": input.customerGroups.wholesale1
                                }
                            });
                            wholesale1Updated++;
                            console.log(`✓ Will update Wholesale Level 1 price for ${product.sku}: ${wholesale1Price?.amount || 'N/A'} → $${product.wholesale_level1}`);
                        }
                    }

                    // 3. Check and update Wholesale Level 2 price
                    if (product.wholesale_level2 && product.wholesale_level2 > 0) {
                        const wholesale2Price = priceSet.prices.find((p: any) => 
                            p.currency_code === 'cad' && 
                            p.price_rules?.some((r: any) => 
                                r.attribute === 'customer.groups.id' && 
                                r.value === input.customerGroups.wholesale2
                            )
                        );

                        if (!wholesale2Price || wholesale2Price.amount !== product.wholesale_level2) {
                            pricesToUpdate.push({
                                currency_code: "cad",
                                amount: product.wholesale_level2,
                                rules: {
                                    "customer.groups.id": input.customerGroups.wholesale2
                                }
                            });
                            wholesale2Updated++;
                            console.log(`✓ Will update Wholesale Level 2 price for ${product.sku}: ${wholesale2Price?.amount || 'N/A'} → $${product.wholesale_level2}`);
                        }
                    }

                    // 4. Check and update Wholesale Level 3 price
                    if (product.wholesale_level3 && product.wholesale_level3 > 0) {
                        const wholesale3Price = priceSet.prices.find((p: any) => 
                            p.currency_code === 'cad' && 
                            p.price_rules?.some((r: any) => 
                                r.attribute === 'customer.groups.id' && 
                                r.value === input.customerGroups.wholesale3
                            )
                        );

                        if (!wholesale3Price || wholesale3Price.amount !== product.wholesale_level3) {
                            pricesToUpdate.push({
                                currency_code: "cad",
                                amount: product.wholesale_level3,
                                rules: {
                                    "customer.groups.id": input.customerGroups.wholesale3
                                }
                            });
                            wholesale3Updated++;
                            console.log(`✓ Will update Wholesale Level 3 price for ${product.sku}: ${wholesale3Price?.amount || 'N/A'} → $${product.wholesale_level3}`);
                        }
                    }

                    // Only update if there are actual changes
                    if (pricesToUpdate.length > 0) {
                        try {
                            console.log(`🔄 Calling addPrices for ${product.sku} with priceSetId: ${priceSetId}`);
                            // Use addPrices to upsert prices (it will update existing ones or create new ones)
                            await pricingService.addPrices({
                                priceSetId: priceSetId,
                                prices: pricesToUpdate
                            });
                            console.log(`✅ Updated ${pricesToUpdate.length} price(s) for ${product.sku}`);
                        } catch (priceError: any) {
                            console.error(`Failed to update prices for ${product.sku} (priceSetId: ${priceSetId}):`, priceError.message);
                            errors++;
                        }
                    } else {
                        console.log(`⏭️  No price changes for ${product.sku}`);
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