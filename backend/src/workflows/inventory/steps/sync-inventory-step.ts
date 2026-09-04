import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ModuleRegistrationName } from "@medusajs/framework/utils"
import { isB2bInventoryProduct } from "./product-availability"
import {
    fetchBngInventoryProducts,
    type BngInventoryProduct,
} from "../bng-inventory-source"
import {
    prepareBngProductOptionSync,
    reconcileBngProductOptions,
} from "../bng-product-option-sync"
import type { ProductOptionSyncSummary } from "../bng-product-options"
import {
    getInventorySyncReferences,
    toInventoryProductHandle,
} from "../inventory-sync-helpers"

interface InventoryUpdate {
    sku: string;
    quantity: number;
    productName: string;
    price: number;
    wholesale_level1: number;
    wholesale_level2: number;
    wholesale_level3: number;
}

interface InventoryStepResult {
    success: boolean;
    error?: string;
    totalUpdated: number;
    totalDeleted: number;
    totalPricesUpdated: number;
    productOptions?: ProductOptionSyncSummary;
    priceData?: Array<{
        sku: string;
        price: number;
        wholesale_level1: number;
        wholesale_level2: number;
        wholesale_level3: number;
    }>;
    summary?: {
        totalApiProducts: number;
        productsWithBothAvailability: number;
        productsAvailableToB2b: number;
        inventoryLevelsUpdated: number;
        productsDeleted: number;
        pricesUpdated: number;
    };
}

export const syncInventoryStep = createStep<any, InventoryStepResult, unknown>(
  "sync-inventory-step",
  async (input: any, { container }: any) => {
    try {
        console.log("=== STARTING DAILY INVENTORY SYNC ===");
        console.log(`Sync started at: ${new Date().toISOString()}`);

        // Step 1: Fetch current inventory from BNG API
        console.log("\nFetching inventory from BNG API...");
        let bngApiProducts: BngInventoryProduct[] = [];

        try {
            bngApiProducts = await fetchBngInventoryProducts();
            console.log(`Fetched ${bngApiProducts.length} products from BNG API`);
        } catch(error: any) {
            console.error(`Failed to get products from BNG API:`, error.message || error);
            return new StepResponse({ 
                success: false, 
                error: error.message,
                totalUpdated: 0,
                totalDeleted: 0,
                totalPricesUpdated: 0,
                summary: {
                    totalApiProducts: 0,
                    productsWithBothAvailability: 0,
                    productsAvailableToB2b: 0,
                    inventoryLevelsUpdated: 0,
                    productsDeleted: 0,
                    pricesUpdated: 0
                }
            });
        }

        // Validate the complete source and build a read-only option plan before
        // any inventory, catalog, or pricing mutation is allowed to begin.
        if (input.syncProductOptions) {
            await prepareBngProductOptionSync(container, bngApiProducts);
        }

        // Step 2: Create a map of ALL SKUs from API (to track what exists)
        const allApiSkus = new Set<string>();
        bngApiProducts.forEach(product => {
            allApiSkus.add(product.upcCode.trim());
        });

        // Step 3: Include products available to both channels or wholesale only
        const filteredProducts = bngApiProducts.filter(isB2bInventoryProduct);
        const productsWithBothAvailability = bngApiProducts.filter(product => product.productAvailabilityType === "Both").length;
        const productsWithWholesaleAvailability = bngApiProducts.filter(product => product.productAvailabilityType === "WholeSale").length;
        console.log(`Total products in API: ${bngApiProducts.length}`);
        console.log(`Products with "Both" availability: ${productsWithBothAvailability}`);
        console.log(`Products with "WholeSale" availability: ${productsWithWholesaleAvailability}`);
        console.log(`Products with "Retail" availability: ${bngApiProducts.filter(p => p.productAvailabilityType === "Retail").length}`);

        // Step 4: Create a map of SKU to inventory data for B2B products
        const inventoryMap = new Map<string, InventoryUpdate>();

        filteredProducts.forEach(product => {
            const sku = product.upcCode.trim();
            inventoryMap.set(sku, {
                sku: sku,
                quantity: parseInt(product.quantity) || 0,
                productName: product.productName,
                price: product.price,
                wholesale_level1: product.price_WholesaleLevel1,
                wholesale_level2: product.price_WholesaleLevel2,
                wholesale_level3: product.price_WholesaleLevel3
            });
        });

        // Step 4: Get all products from v2 database
        console.log("\nFetching existing products from database...");
        const productService = container.resolve(ModuleRegistrationName.PRODUCT);
        const inventoryService = container.resolve(ModuleRegistrationName.INVENTORY);
        const stockLocationService = container.resolve(ModuleRegistrationName.STOCK_LOCATION);
        const remoteLink = container.resolve("remoteLink");

        let hasMore = true;
        let offset = 0;
        const limit = 100;
        let totalUpdated = 0;
        let totalPricesUpdated = 0;
        const priceDataForSync: any[] = [];
        let totalDeleted = 0;
        const updates: any[] = [];
        const productsToDelete: any[] = [];
        const errors: string[] = [];

        while (hasMore) {
            const batchProducts = await productService.listProducts(
                {},
                {
                    skip: offset,
                    take: limit,
                    relations: ["variants"]
                }
            );

            for (const product of batchProducts) {
                let shouldDeleteProduct = true;

                if (product.variants) {
                    for (const variant of product.variants) {
                        if (variant.sku) {
                            // Check if this SKU exists in API at all
                            if (!allApiSkus.has(variant.sku)) {
                                // SKU doesn't exist in API - mark for deletion
                                continue;
                            }

                            // Check if this SKU is available to B2B customers
                            if (inventoryMap.has(variant.sku)) {
                                shouldDeleteProduct = false;
                                const inventoryData = inventoryMap.get(variant.sku)!;

                                // Update inventory quantity
                                try {
                                    // Get current inventory level
                                    const inventoryItems = await inventoryService.listInventoryItems({
                                        sku: variant.sku
                                    });

                                    if (inventoryItems && inventoryItems.length > 0) {
                                        const inventoryItem = inventoryItems[0];

                                        // Get inventory levels
                                        const levels = await inventoryService.listInventoryLevels({
                                            inventory_item_id: inventoryItem.id
                                        });

                                        if (levels && levels.length > 0) {
                                            const currentLevel = levels[0];

                                            if (currentLevel.stocked_quantity !== inventoryData.quantity) {
                                                // Update inventory level
                                                await inventoryService.updateInventoryLevels([{
                                                    inventory_item_id: inventoryItem.id,
                                                    location_id: currentLevel.location_id,
                                                    stocked_quantity: inventoryData.quantity
                                                }]);

                                                updates.push({
                                                    sku: variant.sku,
                                                    product: product.title,
                                                    oldQuantity: currentLevel.stocked_quantity,
                                                    newQuantity: inventoryData.quantity
                                                });

                                                totalUpdated++;
                                                console.log(`✓ Updated inventory for ${variant.sku}: ${currentLevel.stocked_quantity} → ${inventoryData.quantity}`);
                                            }
                                        } else {
                                            // Create inventory level if it doesn't exist
                                            const stockLocations = await stockLocationService.listStockLocations({});
                                            if (stockLocations && stockLocations.length > 0) {
                                                await inventoryService.createInventoryLevels([{
                                                    inventory_item_id: inventoryItem.id,
                                                    location_id: stockLocations[0].id,
                                                    stocked_quantity: inventoryData.quantity
                                                }]);

                                                updates.push({
                                                    sku: variant.sku,
                                                    product: product.title,
                                                    oldQuantity: 0,
                                                    newQuantity: inventoryData.quantity
                                                });

                                                totalUpdated++;
                                                console.log(`✓ Created inventory level for ${variant.sku}: ${inventoryData.quantity}`);
                                            }
                                        }
                                    } else {
                                        // Create inventory item if it doesn't exist
                                        const createdItem = await inventoryService.createInventoryItems({
                                            sku: variant.sku,
                                            title: variant.title || product.title
                                        });

                                        // Link variant to inventory item via remoteLink
                                        await remoteLink.create({
                                            [ModuleRegistrationName.PRODUCT]: {
                                                variant_id: variant.id
                                            },
                                            [ModuleRegistrationName.INVENTORY]: {
                                                inventory_item_id: createdItem.id
                                            },
                                            data: {
                                                required_quantity: 1
                                            }
                                        });

                                        console.log(`✓ Linked variant ${variant.id} to inventory item ${createdItem.id}`);

                                        // Create inventory level
                                        const stockLocations = await stockLocationService.listStockLocations({});
                                        if (stockLocations && stockLocations.length > 0) {
                                            await inventoryService.createInventoryLevels([{
                                                inventory_item_id: createdItem.id,
                                                location_id: stockLocations[0].id,
                                                stocked_quantity: inventoryData.quantity
                                            }]);

                                            updates.push({
                                                sku: variant.sku,
                                                product: product.title,
                                                oldQuantity: 0,
                                                newQuantity: inventoryData.quantity
                                            });

                                            totalUpdated++;
                                            console.log(`✓ Created inventory item and level for ${variant.sku}: ${inventoryData.quantity}`);
                                        }
                                    }
                                } catch (error: any) {
                                    console.error(`Failed to update inventory for ${variant.sku}:`, error.message || error);
                                    errors.push(`Inventory ${variant.sku}: ${error.message || error}`);
                                }

                                // Collect price data for sync
                                priceDataForSync.push({
                                    sku: variant.sku,
                                    price: inventoryData.price,
                                    wholesale_level1: inventoryData.wholesale_level1,
                                    wholesale_level2: inventoryData.wholesale_level2,
                                    wholesale_level3: inventoryData.wholesale_level3
                                });
                                console.log(`✓ Collected price data for ${variant.sku}`);
                            }
                        }
                    }
                }

                // Delete if: 1) Product not in API at all, OR 2) Product isn't available to B2B customers
                if (shouldDeleteProduct) {
                    const sku = product.variants?.[0]?.sku || 'no-sku';
                    const reason = !allApiSkus.has(sku) ? 'NOT_IN_API' : 'NOT_B2B_AVAILABLE';
                    productsToDelete.push({
                        id: product.id,
                        title: product.title,
                        sku: sku,
                        reason: reason
                    });
                }
            }

            if (batchProducts.length < limit) {
                hasMore = false;
            } else {
                offset += limit;
            }
        }

        // Step 5: Create new products that exist in API but not in database
        const processedSkus = new Set<string>();
        // Track which SKUs we've already processed from existing products
        for (const product of await productService.listProducts({}, { relations: ["variants"] })) {
            if (product.variants) {
                for (const variant of product.variants) {
                    if (variant.sku) {
                        processedSkus.add(variant.sku);
                    }
                }
            }
        }

        // Find products that need to be created (in inventoryMap but not in processedSkus)
        const productsToCreate: any[] = [];
        for (const [sku, inventoryData] of inventoryMap.entries()) {
            if (!processedSkus.has(sku)) {
                productsToCreate.push(inventoryData);
            }
        }

        if (productsToCreate.length > 0) {
            console.log(`\n=== CREATING NEW PRODUCTS ===`);
            console.log(`Found ${productsToCreate.length} new products to create from API`);
            
            const { salesChannelId, shippingProfileId } = getInventorySyncReferences();
            
            for (const productData of productsToCreate) {
                try {
                    // Create the product (trim product name to avoid trailing spaces)
                    const cleanProductName = productData.productName.trim();
                    const productHandle = toInventoryProductHandle(productData.sku);
                    const createdProduct = await productService.createProducts({
                        title: cleanProductName,
                        handle: productHandle,
                        status: "published",
                        variants: [
                            {
                                title: cleanProductName,
                                sku: productData.sku,
                                manage_inventory: true
                            }
                        ]
                    });
                    
                    console.log(`✓ Created product: ${productData.productName} (${productData.sku})`);
                    
                    // Manually create the sales channel association
                    await remoteLink.create({
                        [ModuleRegistrationName.PRODUCT]: {
                            product_id: createdProduct.id
                        },
                        [ModuleRegistrationName.SALES_CHANNEL]: {
                            sales_channel_id: salesChannelId
                        }
                    });
                    
                    console.log(`✓ Associated product ${createdProduct.id} with sales channel ${salesChannelId}`);

                    // Link product to the default shipping profile
                    await remoteLink.create({
                        [ModuleRegistrationName.PRODUCT]: {
                            product_id: createdProduct.id
                        },
                        [ModuleRegistrationName.FULFILLMENT]: {
                            shipping_profile_id: shippingProfileId
                        }
                    });
                    
                    console.log(`✓ Associated product ${createdProduct.id} with shipping profile ${shippingProfileId}`);
                    
                    // Create inventory item and level
                    if (createdProduct.variants && createdProduct.variants[0]) {
                        const variant = createdProduct.variants[0];
                        
                        // Create inventory item
                        const inventoryItem = await inventoryService.createInventoryItems({
                            sku: variant.sku,
                            title: variant.title || createdProduct.title
                        });
                        
                        // Link variant to inventory item via remoteLink
                        await remoteLink.create({
                            [ModuleRegistrationName.PRODUCT]: {
                                variant_id: variant.id
                            },
                            [ModuleRegistrationName.INVENTORY]: {
                                inventory_item_id: inventoryItem.id
                            },
                            data: {
                                required_quantity: 1
                            }
                        });

                        console.log(`✓ Linked variant ${variant.id} to inventory item ${inventoryItem.id}`);

                        // Create inventory level
                        const stockLocations = await stockLocationService.listStockLocations({});
                        if (stockLocations && stockLocations.length > 0) {
                            await inventoryService.createInventoryLevels([{
                                inventory_item_id: inventoryItem.id,
                                location_id: stockLocations[0].id,
                                stocked_quantity: productData.quantity
                            }]);
                            
                            console.log(`✓ Created inventory for ${productData.sku}: ${productData.quantity} units`);
                        }
                        
                        // Collect price data for sync
                        priceDataForSync.push({
                            sku: variant.sku,
                            price: productData.price,
                            wholesale_level1: productData.wholesale_level1,
                            wholesale_level2: productData.wholesale_level2,
                            wholesale_level3: productData.wholesale_level3
                        });
                        console.log(`✓ Collected price data for new product ${variant.sku}`);
                    }
                    
                    totalUpdated++;
                    
                } catch (error: any) {
                    console.error(`Failed to create product ${productData.productName} (${productData.sku}):`, error.message || error);
                    errors.push(`Create ${productData.sku}: ${error.message || error}`);
                }
            }
        }

        // Step 6: Delete products that are not in the API or aren't available to B2B customers
        if (productsToDelete.length > 0) {
            console.log(`\n=== DELETING PRODUCTS ===`);
            const unavailableToB2bCount = productsToDelete.filter(p => p.reason === 'NOT_B2B_AVAILABLE').length;
            const notInApiCount = productsToDelete.filter(p => p.reason === 'NOT_IN_API').length;
            console.log(`Found ${productsToDelete.length} products to delete:`);
            console.log(`  - ${unavailableToB2bCount} not available to B2B customers`);
            console.log(`  - ${notInApiCount} not in API anymore`);

            for (const productToDelete of productsToDelete) {
                try {
                    await productService.deleteProducts([productToDelete.id]);
                    totalDeleted++;
                    console.log(`✓ Deleted [${productToDelete.reason}]: ${productToDelete.title} (${productToDelete.sku})`);
                } catch (error: any) {
                    console.error(`Failed to delete product ${productToDelete.title}:`, error.message || error);
                    errors.push(`Delete ${productToDelete.sku}: ${error.message || error}`);
                }
            }
        }

        let productOptions: ProductOptionSyncSummary | undefined;
        if (input.syncProductOptions) {
            productOptions = await reconcileBngProductOptions(
                container,
                bngApiProducts,
                { dryRun: false }
            );
            errors.push(
                ...[
                    ...productOptions.failures,
                    ...productOptions.rejections,
                ].map(
                    failure => `Product options ${failure.sku || "global"}: ${failure.reason}`
                )
            );
        }

        // Step 7: Summary report
        console.log("\n=== SYNC SUMMARY ===");
        console.log(`Sync completed at: ${new Date().toISOString()}`);
        console.log(`Products in API (total): ${bngApiProducts.length}`);
        console.log(`Products in API (available to B2B): ${filteredProducts.length}`);
        console.log(`Inventory levels updated: ${totalUpdated}`);
        console.log(`Products deleted: ${totalDeleted}`);
        console.log(`Prices updated: ${totalPricesUpdated}`);

        if (updates.length > 0) {
            console.log("\nSample updates (first 10):");
            updates.slice(0, 10).forEach(update => {
                console.log(`  - ${update.product} (${update.sku}): ${update.oldQuantity} → ${update.newQuantity}`);
            });
        }

        if (errors.length > 0) {
            console.error(`\nInventory sync completed with ${errors.length} error(s)`);
        } else {
            console.log("\n✓ Daily inventory sync completed successfully");
        }

        return new StepResponse({
            success: errors.length === 0,
            error: errors.join("; "),
            totalUpdated,
            totalDeleted,
            totalPricesUpdated,
            priceData: priceDataForSync,
            productOptions,
            summary: {
                totalApiProducts: bngApiProducts.length,
                productsWithBothAvailability,
                productsAvailableToB2b: filteredProducts.length,
                inventoryLevelsUpdated: totalUpdated,
                productsDeleted: totalDeleted,
                pricesUpdated: totalPricesUpdated
            }
        });

    } catch (error: any) {
        console.error("Error occurred during daily inventory sync:", error);
        return new StepResponse({ 
            success: false, 
            error: error.message,
            totalUpdated: 0,
            totalDeleted: 0,
            totalPricesUpdated: 0,
            summary: {
                totalApiProducts: 0,
                productsWithBothAvailability: 0,
                productsAvailableToB2b: 0,
                inventoryLevelsUpdated: 0,
                productsDeleted: 0,
                pricesUpdated: 0
            }
        });
    }
  }
)
