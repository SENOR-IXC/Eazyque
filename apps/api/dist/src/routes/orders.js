"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Order management routes
const express_1 = require("express");
const database_1 = require("@eazyque/database");
const auth_1 = require("../middleware/auth");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// Order item validation schema
const orderItemSchema = zod_1.z.object({
    productId: zod_1.z.string().min(1, 'Product ID is required'),
    quantity: zod_1.z.number().positive('Quantity must be positive'),
    unitPrice: zod_1.z.number().positive('Unit price must be positive'),
    discountAmount: zod_1.z.number().min(0).optional().default(0)
});
// Order validation schema
const createOrderSchema = zod_1.z.object({
    customerId: zod_1.z.string().nullable().optional(),
    customerName: zod_1.z.string().min(1, 'Customer name is required'),
    customerPhone: zod_1.z.string().optional(),
    items: zod_1.z.array(orderItemSchema).min(1, 'At least one item is required'),
    paymentMethod: zod_1.z.enum(['CASH', 'UPI', 'CARD', 'WALLET', 'SPLIT']),
    discountAmount: zod_1.z.number().min(0).optional().default(0),
    isDelivery: zod_1.z.boolean().optional().default(false),
    deliveryAddress: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional()
});
// Get all orders for a shop
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const { shopId } = req.user;
        const { page = 1, limit = 20, status, paymentStatus, startDate, endDate, search } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        let whereClause = { shopId };
        // Add status filter
        if (status) {
            whereClause.status = status;
        }
        // Add payment status filter
        if (paymentStatus) {
            whereClause.paymentStatus = paymentStatus;
        }
        // Add date range filter
        if (startDate || endDate) {
            whereClause.createdAt = {};
            if (startDate) {
                whereClause.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                whereClause.createdAt.lte = new Date(endDate);
            }
        }
        // Add search filter
        if (search) {
            whereClause.OR = [
                { orderNumber: { contains: search, mode: 'insensitive' } },
                { customerName: { contains: search, mode: 'insensitive' } },
                { customerPhone: { contains: search, mode: 'insensitive' } }
            ];
        }
        const [orders, total] = await Promise.all([
            database_1.prisma.order.findMany({
                where: whereClause,
                include: {
                    items: {
                        include: {
                            product: true
                        }
                    },
                    customer: true,
                    cashier: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    },
                    payments: true
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit)
            }),
            database_1.prisma.order.count({ where: whereClause })
        ]);
        res.json({
            success: true,
            data: orders,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders'
        });
    }
});
// Get order by ID
router.get('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const { shopId } = req.user;
        const { id } = req.params;
        const order = await database_1.prisma.order.findFirst({
            where: { id, shopId },
            include: {
                items: {
                    include: {
                        product: true
                    }
                },
                customer: true,
                cashier: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                payments: true,
                shop: true
            }
        });
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        res.json({
            success: true,
            data: order
        });
    }
    catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order'
        });
    }
});
// Create new order
router.post('/', auth_1.authMiddleware, auth_1.requireStaff, async (req, res) => {
    try {
        const { shopId, id: cashierId } = req.user;
        // Validate input
        const validationResult = createOrderSchema.safeParse(req.body);
        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationResult.error.errors
            });
        }
        const data = validationResult.data;
        // Validate products and calculate totals
        let subtotal = 0;
        let totalTax = 0;
        const orderItems = [];
        for (const item of data.items) {
            const product = await database_1.prisma.product.findFirst({
                where: { id: item.productId, shopId },
                include: { inventory: true }
            });
            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: `Product with ID ${item.productId} not found`
                });
            }
            // Check inventory
            const availableQuantity = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
            if (availableQuantity < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.name}. Available: ${availableQuantity}, Requested: ${item.quantity}`
                });
            }
            const itemTotal = item.quantity * item.unitPrice;
            const itemDiscountedTotal = itemTotal - (item.discountAmount || 0);
            // Simple tax calculation - total GST amount
            const itemTax = (itemDiscountedTotal * product.gstRate) / 100;
            subtotal += itemDiscountedTotal;
            totalTax += itemTax;
            orderItems.push({
                productId: item.productId,
                productName: product.name, // Add the missing productName field
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discountAmount: item.discountAmount || 0,
                taxAmount: itemTax,
                totalPrice: itemDiscountedTotal + itemTax
            });
        }
        const discountAmount = data.discountAmount || 0;
        const finalSubtotal = subtotal - discountAmount;
        const totalAmount = finalSubtotal + totalTax;
        // Generate order number
        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
        // Create order in transaction
        const order = await database_1.prisma.$transaction(async (tx) => {
            // Create order
            const newOrder = await tx.order.create({
                data: {
                    orderNumber,
                    customerId: data.customerId,
                    customerName: data.customerName,
                    customerPhone: data.customerPhone,
                    shopId,
                    cashierId,
                    subtotal,
                    taxAmount: totalTax,
                    discountAmount,
                    totalAmount,
                    paymentMethod: data.paymentMethod,
                    isDelivery: data.isDelivery,
                    deliveryAddress: data.deliveryAddress,
                    notes: data.notes,
                    items: {
                        create: orderItems
                    }
                },
                include: {
                    items: {
                        include: {
                            product: true
                        }
                    },
                    customer: true,
                    cashier: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                }
            });
            // Update inventory
            for (const item of data.items) {
                await tx.inventory.updateMany({
                    where: {
                        productId: item.productId,
                        shopId,
                        quantity: { gte: item.quantity }
                    },
                    data: {
                        quantity: { decrement: item.quantity }
                    }
                });
            }
            // Update customer loyalty points and total spent
            if (data.customerId) {
                await tx.customer.update({
                    where: { id: data.customerId },
                    data: {
                        loyaltyPoints: { increment: Math.floor(totalAmount / 100) }, // 1 point per 100 rupees
                        totalSpent: { increment: totalAmount }
                    }
                });
            }
            return newOrder;
        });
        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: order
        });
    }
    catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order'
        });
    }
});
// Update order status
router.patch('/:id/status', auth_1.authMiddleware, auth_1.requireStaff, async (req, res) => {
    try {
        const { shopId } = req.user;
        const { id } = req.params;
        const { status } = req.body;
        if (!status || !['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Valid status is required'
            });
        }
        const order = await database_1.prisma.order.findFirst({
            where: { id, shopId }
        });
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        const updatedOrder = await database_1.prisma.order.update({
            where: { id },
            data: { status },
            include: {
                items: {
                    include: {
                        product: true
                    }
                },
                customer: true,
                cashier: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });
        res.json({
            success: true,
            message: 'Order status updated successfully',
            data: updatedOrder
        });
    }
    catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update order status'
        });
    }
});
// Cancel order
router.patch('/:id/cancel', auth_1.authMiddleware, auth_1.requireStaff, async (req, res) => {
    try {
        const { shopId } = req.user;
        const { id } = req.params;
        const { reason } = req.body;
        const order = await database_1.prisma.order.findFirst({
            where: { id, shopId },
            include: {
                items: true
            }
        });
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        if (order.status === 'CANCELLED') {
            return res.status(400).json({
                success: false,
                message: 'Order is already cancelled'
            });
        }
        if (order.status === 'COMPLETED') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel completed order'
            });
        }
        // Cancel order and restore inventory
        await database_1.prisma.$transaction(async (tx) => {
            // Update order status
            await tx.order.update({
                where: { id },
                data: {
                    status: 'CANCELLED',
                    notes: reason ? `Cancelled: ${reason}` : 'Cancelled'
                }
            });
            // Restore inventory
            for (const item of order.items) {
                await tx.inventory.updateMany({
                    where: {
                        productId: item.productId,
                        shopId
                    },
                    data: {
                        quantity: { increment: item.quantity }
                    }
                });
            }
            // Deduct customer loyalty points and total spent
            if (order.customerId) {
                await tx.customer.update({
                    where: { id: order.customerId },
                    data: {
                        loyaltyPoints: { decrement: Math.floor(order.totalAmount / 100) },
                        totalSpent: { decrement: order.totalAmount }
                    }
                });
            }
        });
        res.json({
            success: true,
            message: 'Order cancelled successfully'
        });
    }
    catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel order'
        });
    }
});
// Get order analytics
router.get('/analytics/summary', auth_1.authMiddleware, async (req, res) => {
    try {
        const { shopId } = req.user;
        const { period = '7d' } = req.query;
        let startDate;
        const now = new Date();
        switch (period) {
            case '1d':
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }
        const [totalOrders, totalRevenue, pendingOrders, completedOrders, cancelledOrders, topProducts] = await Promise.all([
            database_1.prisma.order.count({
                where: {
                    shopId,
                    createdAt: { gte: startDate }
                }
            }),
            database_1.prisma.order.aggregate({
                where: {
                    shopId,
                    status: { not: 'CANCELLED' },
                    createdAt: { gte: startDate }
                },
                _sum: { totalAmount: true }
            }),
            database_1.prisma.order.count({
                where: {
                    shopId,
                    status: 'PENDING',
                    createdAt: { gte: startDate }
                }
            }),
            database_1.prisma.order.count({
                where: {
                    shopId,
                    status: 'COMPLETED',
                    createdAt: { gte: startDate }
                }
            }),
            database_1.prisma.order.count({
                where: {
                    shopId,
                    status: 'CANCELLED',
                    createdAt: { gte: startDate }
                }
            }),
            database_1.prisma.orderItem.groupBy({
                by: ['productId'],
                where: {
                    order: {
                        shopId,
                        status: { not: 'CANCELLED' },
                        createdAt: { gte: startDate }
                    }
                },
                _sum: { quantity: true, totalPrice: true },
                _count: true,
                orderBy: { _sum: { quantity: 'desc' } },
                take: 10
            })
        ]);
        // Get product details for top products
        const topProductsWithDetails = await Promise.all(topProducts.map(async (item) => {
            const product = await database_1.prisma.product.findUnique({
                where: { id: item.productId },
                select: { name: true, sellingPrice: true }
            });
            return {
                product,
                totalQuantity: item._sum.quantity || 0,
                totalRevenue: item._sum.totalPrice || 0,
                orderCount: item._count || 0
            };
        }));
        res.json({
            success: true,
            data: {
                totalOrders,
                totalRevenue: totalRevenue._sum.totalAmount || 0,
                pendingOrders,
                completedOrders,
                cancelledOrders,
                averageOrderValue: totalOrders > 0 ? (totalRevenue._sum.totalAmount || 0) / totalOrders : 0,
                topProducts: topProductsWithDetails
            }
        });
    }
    catch (error) {
        console.error('Error fetching order analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order analytics'
        });
    }
});
// Get order statistics
router.get('/stats', auth_1.authMiddleware, async (req, res) => {
    try {
        const { shopId } = req.user;
        const [totalOrders, completedOrders, totalRevenue, totalProducts, totalCustomers] = await Promise.all([
            // Total orders count
            database_1.prisma.order.count({
                where: { shopId }
            }),
            // Completed orders count
            database_1.prisma.order.count({
                where: {
                    shopId,
                    status: 'COMPLETED'
                }
            }),
            // Total revenue from completed orders
            database_1.prisma.order.aggregate({
                where: {
                    shopId,
                    status: 'COMPLETED'
                },
                _sum: {
                    totalAmount: true
                }
            }),
            // Total products count
            database_1.prisma.product.count({
                where: { shopId }
            }),
            // Total unique customers count
            database_1.prisma.order.groupBy({
                by: ['customerId'],
                where: {
                    shopId,
                    customerId: {
                        not: null
                    }
                }
            })
        ]);
        res.json({
            success: true,
            data: {
                totalOrders,
                completedOrders,
                totalRevenue: totalRevenue._sum.totalAmount || 0,
                totalProducts,
                totalCustomers: totalCustomers.length
            }
        });
    }
    catch (error) {
        console.error('Failed to fetch order statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order statistics'
        });
    }
});
exports.default = router;
//# sourceMappingURL=orders.js.map