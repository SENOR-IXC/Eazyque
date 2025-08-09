import express from 'express';
import { PrismaClient } from '@eazyque/database';
import { authMiddleware } from '../middleware/auth';
import { cacheControl } from '../middleware/performance';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/dashboard/stats - Get dashboard statistics with caching
router.get('/stats', authMiddleware, cacheControl(60), async (req, res) => {
  try {
    const user = req.user as any;
    const shopId = user.shopId;

    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: 'User not associated with a shop'
      });
    }

    // Optimize by combining queries using Promise.all for parallel execution
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      orderStats,
      revenueStats,
      todayStats,
      productStats,
      lowStockCount,
      recentOrders
    ] = await Promise.all([
      // Order statistics in a single aggregate query
      prisma.order.groupBy({
        by: ['status'],
        where: { shopId },
        _count: { id: true }
      }),
      
      // Revenue statistics
      prisma.order.aggregate({
        where: { 
          shopId,
          status: 'COMPLETED'
        },
        _sum: { totalAmount: true }
      }),
      
      // Today's statistics
      prisma.order.aggregate({
        where: { 
          shopId,
          createdAt: { gte: today, lt: tomorrow }
        },
        _count: { id: true },
        _sum: { totalAmount: true }
      }),
      
      // Product statistics
      prisma.product.count({
        where: { shopId, isActive: true }
      }),
      
      // Low stock count with optimized query
      prisma.inventory.count({
        where: {
          shopId,
          quantity: { lte: 10 }
        }
      }),
      
      // Recent orders with optimized includes
      prisma.order.findMany({
        where: { shopId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          totalAmount: true,
          status: true,
          paymentStatus: true,
          createdAt: true,
          cashier: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: { items: true }
          }
        }
      })
    ]);

    // Process order statistics
    const orderCounts = orderStats.reduce((acc, stat) => {
      acc[stat.status.toLowerCase()] = stat._count.id;
      return acc;
    }, {} as Record<string, number>);

    const totalOrders = orderStats.reduce((sum, stat) => sum + stat._count.id, 0);
    const pendingOrders = orderCounts.pending || 0;
    const completedOrders = orderCounts.completed || 0;
    
    const totalRevenue = Number(revenueStats._sum.totalAmount || 0);
    const todayOrders = todayStats._count.id;
    const todayRevenue = Number(todayStats._sum.totalAmount || 0);

    const stats = {
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue,
      todayOrders,
      todayRevenue,
      totalProducts: productStats,
      lowStockProducts: lowStockCount,
      recentOrders: recentOrders.map((order: any) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        totalAmount: Number(order.totalAmount),
        status: order.status,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        itemCount: order._count.items,
        cashier: order.cashier
      }))
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

export default router;
