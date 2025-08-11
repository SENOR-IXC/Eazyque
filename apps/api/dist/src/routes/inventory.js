"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Inventory management routes
const express_1 = require("express");
const database_1 = require("@eazyque/database");
const auth_1 = require("../middleware/auth");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// Inventory entry validation schema
const inventoryEntrySchema = zod_1.z.object({
    productId: zod_1.z.string().min(1, 'Product ID is required'),
    quantity: zod_1.z.number().positive('Quantity must be positive'),
    costPrice: zod_1.z.number().positive('Cost price must be positive'),
    notes: zod_1.z.string().optional()
});
// Add inventory entry
router.post('/', auth_1.authMiddleware, auth_1.requireStaff, async (req, res) => {
    try {
        const { shopId } = req.user;
        const validatedData = inventoryEntrySchema.parse(req.body);
        // Check if product exists
        const product = await database_1.prisma.product.findFirst({
            where: {
                id: validatedData.productId,
                shopId
            }
        });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        // Get or create inventory record
        let inventory = await database_1.prisma.inventory.findFirst({
            where: {
                productId: validatedData.productId,
                shopId
            }
        });
        if (inventory) {
            // Update existing inventory
            inventory = await database_1.prisma.inventory.update({
                where: { id: inventory.id },
                data: {
                    quantity: inventory.quantity + validatedData.quantity,
                    costPrice: validatedData.costPrice,
                    lastUpdated: new Date()
                }
            });
        }
        else {
            // Create new inventory record
            inventory = await database_1.prisma.inventory.create({
                data: {
                    productId: validatedData.productId,
                    shopId,
                    quantity: validatedData.quantity,
                    costPrice: validatedData.costPrice,
                    minStockLevel: 10,
                    maxStockLevel: 1000
                }
            });
        }
        // Create audit log
        const auditLog = await database_1.prisma.auditLog.create({
            data: {
                action: 'INVENTORY_ADD',
                resource: 'inventory',
                resourceId: inventory.id,
                oldValues: {},
                newValues: {
                    quantity: validatedData.quantity,
                    costPrice: validatedData.costPrice,
                    notes: validatedData.notes
                },
                userId: req.user.id,
                shopId
            }
        });
        res.status(201).json({
            success: true,
            data: {
                inventory,
                auditLog
            }
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: error.errors
            });
        }
        console.error('Failed to add inventory:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add inventory'
        });
    }
});
// Get inventory records with optimized queries
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const { shopId } = req.user;
        const { page = 1, limit = 20, productId } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);
        const where = { shopId };
        if (productId) {
            where.productId = productId;
        }
        // Use parallel execution for better performance
        const [inventoryRecords, total] = await Promise.all([
            database_1.prisma.inventory.findMany({
                where,
                select: {
                    id: true,
                    productId: true,
                    quantity: true,
                    minStockLevel: true,
                    maxStockLevel: true,
                    batchNumber: true,
                    expiryDate: true,
                    costPrice: true,
                    lastUpdated: true,
                    product: {
                        select: {
                            name: true,
                            barcode: true,
                            sellingPrice: true,
                            category: true
                        }
                    }
                },
                orderBy: { lastUpdated: 'desc' },
                skip,
                take
            }),
            database_1.prisma.inventory.count({ where })
        ]);
        res.json({
            success: true,
            data: inventoryRecords,
            pagination: {
                page: Number(page),
                limit: take,
                total,
                pages: Math.ceil(total / take)
            }
        });
    }
    catch (error) {
        console.error('Failed to fetch inventory records:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch inventory records'
        });
    }
});
// Get low stock products with optimized query
router.get('/low-stock', auth_1.authMiddleware, async (req, res) => {
    try {
        const { shopId } = req.user;
        const { threshold = 10 } = req.query;
        const lowStockProducts = await database_1.prisma.inventory.findMany({
            where: {
                shopId,
                quantity: { lte: Number(threshold) }
            },
            select: {
                id: true,
                productId: true,
                quantity: true,
                minStockLevel: true,
                maxStockLevel: true,
                lastUpdated: true,
                product: {
                    select: {
                        name: true,
                        barcode: true,
                        sellingPrice: true,
                        category: true
                    }
                }
            },
            orderBy: { quantity: 'asc' },
            take: 50 // Limit results for performance
        });
        res.json({
            success: true,
            data: lowStockProducts
        });
    }
    catch (error) {
        console.error('Failed to fetch low stock products:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch low stock products'
        });
    }
});
// Update stock manually
router.patch('/:productId', auth_1.authMiddleware, auth_1.requireStaff, async (req, res) => {
    try {
        const { shopId } = req.user;
        const { productId } = req.params;
        const { quantity, notes } = req.body;
        if (typeof quantity !== 'number') {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be a number'
            });
        }
        // Check if product exists
        const product = await database_1.prisma.product.findFirst({
            where: {
                id: productId,
                shopId
            }
        });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        // Get inventory record
        let inventory = await database_1.prisma.inventory.findFirst({
            where: {
                productId,
                shopId
            }
        });
        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: 'Inventory record not found'
            });
        }
        const newQuantity = inventory.quantity + quantity;
        if (newQuantity < 0) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient stock'
            });
        }
        // Update inventory
        const updatedInventory = await database_1.prisma.inventory.update({
            where: { id: inventory.id },
            data: {
                quantity: newQuantity,
                lastUpdated: new Date()
            }
        });
        // Create audit log
        const auditLog = await database_1.prisma.auditLog.create({
            data: {
                action: quantity > 0 ? 'INVENTORY_ADD' : 'INVENTORY_SUBTRACT',
                resource: 'inventory',
                resourceId: inventory.id,
                oldValues: { quantity: inventory.quantity },
                newValues: { quantity: newQuantity, notes },
                userId: req.user.id,
                shopId
            }
        });
        res.json({
            success: true,
            data: {
                inventory: updatedInventory,
                auditLog
            }
        });
    }
    catch (error) {
        console.error('Failed to update stock:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update stock'
        });
    }
});
exports.default = router;
//# sourceMappingURL=inventory.js.map