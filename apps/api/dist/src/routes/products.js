"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Product management routes
const express_1 = require("express");
const database_1 = require("@eazyque/database");
const auth_1 = require("../middleware/auth");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// Product validation schema
const createProductSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Product name is required'),
    description: zod_1.z.string().optional(),
    barcode: zod_1.z.string().optional(),
    hsnCode: zod_1.z.string().min(4, 'HSN code must be at least 4 characters'),
    category: zod_1.z.enum(['GROCERIES', 'DAIRY', 'VEGETABLES', 'FRUITS', 'BEVERAGES', 'SNACKS', 'PERSONAL_CARE', 'HOUSEHOLD', 'OTHER']),
    unitOfMeasurement: zod_1.z.enum(['KG', 'GRAM', 'LITER', 'ML', 'PIECE', 'PACK', 'BOX']),
    basePrice: zod_1.z.number().positive('Base price must be positive'),
    sellingPrice: zod_1.z.number().positive('Selling price must be positive'),
    gstRate: zod_1.z.number().min(0).max(100, 'GST rate must be between 0 and 100'),
    minStockLevel: zod_1.z.number().min(0).optional(),
    maxStockLevel: zod_1.z.number().min(0).optional(),
    initialStock: zod_1.z.number().min(0).optional().default(0)
});
const updateProductSchema = createProductSchema.partial();
// Get all products for a shop
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const { shopId } = req.user;
        const { search, category, inStock } = req.query;
        let whereClause = { shopId };
        // Add search filter
        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { barcode: { contains: search, mode: 'insensitive' } }
            ];
        }
        // Add category filter
        if (category) {
            whereClause.category = category;
        }
        const products = await database_1.prisma.product.findMany({
            where: whereClause,
            include: {
                inventory: true,
                _count: {
                    select: {
                        orderItems: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        });
        // Filter by stock if requested
        let filteredProducts = products;
        if (inStock === 'true') {
            filteredProducts = products.filter(p => p.inventory && p.inventory.length > 0 && p.inventory[0].quantity > 0);
        }
        else if (inStock === 'false') {
            filteredProducts = products.filter(p => !p.inventory || p.inventory.length === 0 || p.inventory[0].quantity === 0);
        }
        res.json({
            success: true,
            data: filteredProducts,
            total: filteredProducts.length
        });
    }
    catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products'
        });
    }
});
// Get product by ID
router.get('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const { shopId } = req.user;
        const { id } = req.params;
        const product = await database_1.prisma.product.findFirst({
            where: { id, shopId },
            include: {
                inventory: true,
                shop: true,
                _count: {
                    select: {
                        orderItems: true
                    }
                }
            }
        });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        res.json({
            success: true,
            data: product
        });
    }
    catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch product'
        });
    }
});
// Get product by barcode
router.get('/barcode/:barcode', auth_1.authMiddleware, async (req, res) => {
    try {
        const { shopId } = req.user;
        const { barcode } = req.params;
        const product = await database_1.prisma.product.findFirst({
            where: { barcode, shopId },
            include: {
                inventory: true
            }
        });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        res.json({
            success: true,
            data: product
        });
    }
    catch (error) {
        console.error('Error fetching product by barcode:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch product'
        });
    }
});
// Create new product
router.post('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const { shopId } = req.user;
        // Validate input
        const validationResult = createProductSchema.safeParse(req.body);
        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationResult.error.errors
            });
        }
        const data = validationResult.data;
        // Check if barcode already exists (if provided)
        if (data.barcode) {
            const existingProduct = await database_1.prisma.product.findFirst({
                where: { barcode: data.barcode, shopId }
            });
            if (existingProduct) {
                return res.status(400).json({
                    success: false,
                    message: 'Product with this barcode already exists'
                });
            }
        }
        // Create product with inventory
        const result = await database_1.prisma.$transaction(async (tx) => {
            const product = await tx.product.create({
                data: {
                    name: data.name,
                    description: data.description,
                    barcode: data.barcode,
                    hsnCode: data.hsnCode,
                    category: data.category,
                    unitOfMeasurement: data.unitOfMeasurement,
                    basePrice: data.basePrice,
                    sellingPrice: data.sellingPrice,
                    gstRate: data.gstRate,
                    shopId
                }
            });
            // Create initial inventory record
            const inventory = await tx.inventory.create({
                data: {
                    productId: product.id,
                    quantity: data.initialStock || 0,
                    minStockLevel: data.minStockLevel || 10,
                    maxStockLevel: data.maxStockLevel || 1000,
                    costPrice: data.basePrice,
                    shopId
                }
            });
            return { product, inventory };
        });
        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: {
                ...result.product,
                inventory: result.inventory
            }
        });
    }
    catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create product'
        });
    }
});
// Update product
router.put('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const { shopId } = req.user;
        const { id } = req.params;
        // Validate input
        const validationResult = updateProductSchema.safeParse(req.body);
        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationResult.error.errors
            });
        }
        const data = validationResult.data;
        // Check if product exists
        const existingProduct = await database_1.prisma.product.findFirst({
            where: { id, shopId }
        });
        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        // Check barcode uniqueness if being updated
        if (data.barcode && data.barcode !== existingProduct.barcode) {
            const duplicateBarcode = await database_1.prisma.product.findFirst({
                where: {
                    barcode: data.barcode,
                    shopId,
                    NOT: { id }
                }
            });
            if (duplicateBarcode) {
                return res.status(400).json({
                    success: false,
                    message: 'Product with this barcode already exists'
                });
            }
        }
        const product = await database_1.prisma.product.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.barcode !== undefined && { barcode: data.barcode }),
                ...(data.hsnCode && { hsnCode: data.hsnCode }),
                ...(data.category && { category: data.category }),
                ...(data.unitOfMeasurement && { unitOfMeasurement: data.unitOfMeasurement }),
                ...(data.basePrice && { basePrice: data.basePrice }),
                ...(data.sellingPrice && { sellingPrice: data.sellingPrice }),
                ...(data.gstRate !== undefined && { gstRate: data.gstRate })
            },
            include: {
                inventory: true
            }
        });
        // Update inventory limits if provided
        if (data.minStockLevel !== undefined || data.maxStockLevel !== undefined) {
            await database_1.prisma.inventory.updateMany({
                where: { productId: id, shopId },
                data: {
                    ...(data.minStockLevel !== undefined && { minStockLevel: data.minStockLevel }),
                    ...(data.maxStockLevel !== undefined && { maxStockLevel: data.maxStockLevel })
                }
            });
        }
        res.json({
            success: true,
            message: 'Product updated successfully',
            data: product
        });
    }
    catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update product'
        });
    }
});
// Delete product
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const { shopId } = req.user;
        const { id } = req.params;
        // Check if product exists and has any order items
        const product = await database_1.prisma.product.findFirst({
            where: { id, shopId },
            include: {
                _count: {
                    select: {
                        orderItems: true
                    }
                }
            }
        });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        if (product._count.orderItems > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete product that has been used in orders. Consider deactivating instead.'
            });
        }
        // Delete product and related inventory
        await database_1.prisma.$transaction(async (tx) => {
            await tx.inventory.deleteMany({
                where: { productId: id, shopId }
            });
            await tx.product.delete({
                where: { id }
            });
        });
        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete product'
        });
    }
});
// Bulk import products
router.post('/bulk-import', auth_1.authMiddleware, async (req, res) => {
    try {
        const { shopId } = req.user;
        const { products } = req.body;
        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Products array is required'
            });
        }
        const results = {
            success: 0,
            failed: 0,
            errors: []
        };
        for (let i = 0; i < products.length; i++) {
            try {
                const productData = products[i];
                const validationResult = createProductSchema.safeParse(productData);
                if (!validationResult.success) {
                    results.failed++;
                    results.errors.push({
                        index: i,
                        errors: validationResult.error.errors
                    });
                    continue;
                }
                const data = validationResult.data;
                // Check for duplicate barcode
                if (data.barcode) {
                    const existing = await database_1.prisma.product.findFirst({
                        where: { barcode: data.barcode, shopId }
                    });
                    if (existing) {
                        results.failed++;
                        results.errors.push({
                            index: i,
                            message: 'Barcode already exists'
                        });
                        continue;
                    }
                }
                // Create product with inventory
                await database_1.prisma.$transaction(async (tx) => {
                    const product = await tx.product.create({
                        data: {
                            name: data.name,
                            description: data.description,
                            barcode: data.barcode,
                            hsnCode: data.hsnCode,
                            category: data.category,
                            unitOfMeasurement: data.unitOfMeasurement,
                            basePrice: data.basePrice,
                            sellingPrice: data.sellingPrice,
                            gstRate: data.gstRate,
                            shopId
                        }
                    });
                    await tx.inventory.create({
                        data: {
                            productId: product.id,
                            quantity: data.initialStock || 0,
                            minStockLevel: data.minStockLevel || 10,
                            maxStockLevel: data.maxStockLevel || 1000,
                            costPrice: data.basePrice,
                            shopId
                        }
                    });
                });
                results.success++;
            }
            catch (error) {
                results.failed++;
                results.errors.push({
                    index: i,
                    message: 'Database error'
                });
            }
        }
        res.json({
            success: true,
            message: `Bulk import completed. ${results.success} products imported, ${results.failed} failed.`,
            data: results
        });
    }
    catch (error) {
        console.error('Error in bulk import:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to import products'
        });
    }
});
exports.default = router;
//# sourceMappingURL=products.js.map