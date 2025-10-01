import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ModuleRegistrationName } from "@medusajs/framework/utils"

interface BngApiProduct {
    upcCode: string;
    productName: string;
    quantity: string;
    price: number;
    price_WholesaleLevel1: number;
    price_WholesaleLevel2: number;
    price_WholesaleLevel3: number;
    productCategory: string;
    productSubCategory: string;
    productAvailabilityType: string;
}

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
        inventoryLevelsUpdated: number;
        productsDeleted: number;
        pricesUpdated: number;
    };
}

export const syncInventoryStep = createStep(
  "sync-inventory-step",
  async (input: any, { container }: any) => {
    try {
        console.log("=== STARTING DAILY INVENTORY SYNC ===");
        console.log(`Sync started at: ${new Date().toISOString()}`);

        // Step 1: Fetch current inventory from BNG API
        console.log("\nFetching inventory from BNG API...");
        let bngApiProducts: BngApiProduct[] = [];

        const headers = {
            'APIKey': process.env.BNG_API_KEY || '',
        };

        try {
            const response = await fetch('http://services.batteriesnthings.net/api/v1/inventory', {
                headers: headers as HeadersInit
            });
            const data = await response.json();
            bngApiProducts = data.data as BngApiProduct[];
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
                    inventoryLevelsUpdated: 0,
                    productsDeleted: 0,
                    pricesUpdated: 0
                }
            });
        }

        // Step 2: Create a map of ALL SKUs from API (to track what exists)
        const allApiSkus = new Set<string>();
        bngApiProducts.forEach(product => {
            allApiSkus.add(product.upcCode.trim());
        });

        // Step 3: Filter products to only include those with productAvailabilityType = "Both"
        const filteredProducts = bngApiProducts.filter(product =>
            product.productAvailabilityType === "Both"
        );
        console.log(`Total products in API: ${bngApiProducts.length}`);
        console.log(`Products with "Both" availability: ${filteredProducts.length}`);
        console.log(`Products with "Retail" availability: ${bngApiProducts.filter(p => p.productAvailabilityType === "Retail").length}`);

        // Step 4: Create a map of SKU to inventory data (only for "Both" products)
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

        let hasMore = true;
        let offset = 0;
        const limit = 100;
        let totalUpdated = 0;
        let totalPricesUpdated = 0;
        const priceDataForSync: any[] = [];
        let totalDeleted = 0;
        const updates: any[] = [];
        const productsToDelete: any[] = [];

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

                            // Check if this SKU has "Both" availability (is in our filtered products)
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

                // Delete if: 1) Product not in API at all, OR 2) Product only has "Retail" availability
                if (shouldDeleteProduct) {
                    const sku = product.variants?.[0]?.sku || 'no-sku';
                    const reason = !allApiSkus.has(sku) ? 'NOT_IN_API' : 'RETAIL_ONLY';
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
            
            // Use the specific sales channel ID
            const salesChannelId = "sc_01JVWCJ6BKX3RMSEVS193GX8TM";
            
            for (const productData of productsToCreate) {
                try {
                    // Create the product (trim product name to avoid trailing spaces)
                    const cleanProductName = productData.productName.trim();
                    const createdProduct = await productService.createProducts({
                        title: cleanProductName,
                        status: "published",
                        sales_channels: [{ id: salesChannelId }],
                        variants: [
                            {
                                title: cleanProductName,
                                sku: productData.sku,
                                manage_inventory: true
                            }
                        ]
                    });
                    
                    console.log(`✓ Created product: ${productData.productName} (${productData.sku})`);
                    
                    // Create inventory item and level
                    if (createdProduct.variants && createdProduct.variants[0]) {
                        const variant = createdProduct.variants[0];
                        
                        // Create inventory item
                        const inventoryItem = await inventoryService.createInventoryItems({
                            sku: variant.sku,
                            title: variant.title || createdProduct.title
                        });
                        
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
                }
            }
        }

        // Step 6: Delete products that are not in the API or have "Retail" availability only
        if (productsToDelete.length > 0) {
            console.log(`\n=== DELETING PRODUCTS ===`);
            const retailOnlyCount = productsToDelete.filter(p => p.reason === 'RETAIL_ONLY').length;
            const notInApiCount = productsToDelete.filter(p => p.reason === 'NOT_IN_API').length;
            console.log(`Found ${productsToDelete.length} products to delete:`);
            console.log(`  - ${retailOnlyCount} with "Retail" availability only`);
            console.log(`  - ${notInApiCount} not in API anymore`);

            for (const productToDelete of productsToDelete) {
                try {
                    await productService.deleteProducts([productToDelete.id]);
                    totalDeleted++;
                    console.log(`✓ Deleted [${productToDelete.reason}]: ${productToDelete.title} (${productToDelete.sku})`);
                } catch (error: any) {
                    console.error(`Failed to delete product ${productToDelete.title}:`, error.message || error);
                }
            }
        }

        // Step 6: Summary report
        console.log("\n=== SYNC SUMMARY ===");
        console.log(`Sync completed at: ${new Date().toISOString()}`);
        console.log(`Products in API (total): ${bngApiProducts.length}`);
        console.log(`Products in API (with availability "Both"): ${filteredProducts.length}`);
        console.log(`Inventory levels updated: ${totalUpdated}`);
        console.log(`Products deleted: ${totalDeleted}`);
        console.log(`Prices updated: ${totalPricesUpdated}`);

        if (updates.length > 0) {
            console.log("\nSample updates (first 10):");
            updates.slice(0, 10).forEach(update => {
                console.log(`  - ${update.product} (${update.sku}): ${update.oldQuantity} → ${update.newQuantity}`);
            });
        }

        console.log("\n✓ Daily inventory sync completed successfully");

        return new StepResponse({
            success: true,
            error: "",
            totalUpdated,
            totalDeleted,
            totalPricesUpdated,
            priceData: priceDataForSync,
            summary: {
                totalApiProducts: bngApiProducts.length,
                productsWithBothAvailability: filteredProducts.length,
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
                inventoryLevelsUpdated: 0,
                productsDeleted: 0,
                pricesUpdated: 0
            }
        });
    }
  }
)