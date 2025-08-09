import express from 'express';
import { PrismaClient } from '@eazyque/database';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Enhanced analytics endpoint for real-time dashboard
router.get('/real-time-stats', authMiddleware, async (req, res) => {
  try {
    const shopId = (req.user as any).shopId;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Sales trends (hourly for today)
    const hourlyStats = await prisma.$queryRaw`
      SELECT 
        EXTRACT(HOUR FROM "createdAt") as hour,
        COUNT(*) as orders,
        SUM("totalAmount") as revenue
      FROM "Order" 
      WHERE "shopId" = ${shopId} 
        AND "createdAt" >= ${today}
        AND "status" = 'COMPLETED'
      GROUP BY EXTRACT(HOUR FROM "createdAt")
      ORDER BY hour
    `;

    // Daily trends (last 7 days)
    const dailyStats = await prisma.$queryRaw`
      SELECT 
        DATE("createdAt") as date,
        COUNT(*) as orders,
        SUM("totalAmount") as revenue,
        AVG("totalAmount") as avgOrderValue
      FROM "Order" 
      WHERE "shopId" = ${shopId} 
        AND "createdAt" >= ${sevenDaysAgo}
        AND "status" = 'COMPLETED'
      GROUP BY DATE("createdAt")
      ORDER BY date
    `;

    // Category performance
    const categoryStats = await prisma.$queryRaw`
      SELECT 
        p.category,
        COUNT(oi.*) as itemsSold,
        SUM(oi.quantity) as totalQuantity,
        SUM(oi.quantity * oi."unitPrice") as revenue,
        AVG(oi."unitPrice") as avgPrice
      FROM "OrderItem" oi
      JOIN "Product" p ON oi."productId" = p.id
      JOIN "Order" o ON oi."orderId" = o.id
      WHERE o."shopId" = ${shopId}
        AND o."createdAt" >= ${thirtyDaysAgo}
        AND o."status" = 'COMPLETED'
      GROUP BY p.category
      ORDER BY revenue DESC
    `;

    // Top selling products
    const topProducts = await prisma.$queryRaw`
      SELECT 
        p.name,
        p.barcode,
        p.category,
        SUM(oi.quantity) as quantitySold,
        SUM(oi.quantity * oi."unitPrice") as revenue,
        COUNT(DISTINCT oi."orderId") as ordersCount
      FROM "OrderItem" oi
      JOIN "Product" p ON oi."productId" = p.id
      JOIN "Order" o ON oi."orderId" = o.id
      WHERE o."shopId" = ${shopId}
        AND o."createdAt" >= ${thirtyDaysAgo}
        AND o."status" = 'COMPLETED'
      GROUP BY p.id, p.name, p.barcode, p.category
      ORDER BY quantitySold DESC
      LIMIT 10
    `;

    // Inventory insights
    const inventoryStats = await prisma.$queryRaw`
      SELECT 
        p.category,
        COUNT(*) as totalProducts,
        SUM(CASE WHEN i.quantity <= 10 THEN 1 ELSE 0 END) as lowStockCount,
        SUM(CASE WHEN i.quantity = 0 THEN 1 ELSE 0 END) as outOfStockCount,
        AVG(i.quantity) as avgStock,
        SUM(i.quantity * p.price) as totalInventoryValue
      FROM "Product" p
      JOIN "Inventory" i ON p.id = i."productId"
      WHERE p."shopId" = ${shopId}
      GROUP BY p.category
      ORDER BY totalInventoryValue DESC
    `;

    // Real-time metrics
    const realTimeMetrics = {
      todayOrders: await prisma.order.count({
        where: {
          shopId,
          createdAt: { gte: today },
          status: 'COMPLETED'
        }
      }),
      todayRevenue: await prisma.order.aggregate({
        where: {
          shopId,
          createdAt: { gte: today },
          status: 'COMPLETED'
        },
        _sum: { totalAmount: true }
      }),
      yesterdayOrders: await prisma.order.count({
        where: {
          shopId,
          createdAt: { gte: yesterday, lt: today },
          status: 'COMPLETED'
        }
      }),
      yesterdayRevenue: await prisma.order.aggregate({
        where: {
          shopId,
          createdAt: { gte: yesterday, lt: today },
          status: 'COMPLETED'
        },
        _sum: { totalAmount: true }
      }),
      currentMonthOrders: await prisma.order.count({
        where: {
          shopId,
          createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
          status: 'COMPLETED'
        }
      }),
      currentMonthRevenue: await prisma.order.aggregate({
        where: {
          shopId,
          createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
          status: 'COMPLETED'
        },
        _sum: { totalAmount: true }
      }),
      pendingOrders: await prisma.order.count({
        where: { shopId, status: 'PENDING' }
      }),
      lowStockProducts: await prisma.inventory.count({
        where: {
          product: { shopId },
          quantity: { lte: 10 }
        }
      }),
      totalProducts: await prisma.product.count({
        where: { shopId }
      })
    };

    // Calculate growth rates
    const todayRevenue = realTimeMetrics.todayRevenue._sum.totalAmount || 0;
    const yesterdayRevenue = realTimeMetrics.yesterdayRevenue._sum.totalAmount || 0;
    const revenueGrowth = yesterdayRevenue > 0 
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 
      : 0;

    const ordersGrowth = realTimeMetrics.yesterdayOrders > 0 
      ? ((realTimeMetrics.todayOrders - realTimeMetrics.yesterdayOrders) / realTimeMetrics.yesterdayOrders) * 100 
      : 0;

    res.json({
      success: true,
      data: {
        realTimeMetrics: {
          ...realTimeMetrics,
          todayRevenue: todayRevenue,
          yesterdayRevenue: yesterdayRevenue,
          revenueGrowth: Math.round(revenueGrowth * 100) / 100,
          ordersGrowth: Math.round(ordersGrowth * 100) / 100
        },
        hourlyStats: (hourlyStats as any[]).map((stat: any) => ({
          hour: parseInt(stat.hour),
          orders: parseInt(stat.orders),
          revenue: parseFloat(stat.revenue) || 0
        })),
        dailyStats: (dailyStats as any[]).map((stat: any) => ({
          date: stat.date,
          orders: parseInt(stat.orders),
          revenue: parseFloat(stat.revenue) || 0,
          avgOrderValue: parseFloat(stat.avgordervalue) || 0
        })),
        categoryStats: (categoryStats as any[]).map((stat: any) => ({
          category: stat.category,
          itemsSold: parseInt(stat.itemssold),
          totalQuantity: parseInt(stat.totalquantity),
          revenue: parseFloat(stat.revenue) || 0,
          avgPrice: parseFloat(stat.avgprice) || 0
        })),
        topProducts: (topProducts as any[]).map((product: any) => ({
          name: product.name,
          barcode: product.barcode,
          category: product.category,
          quantitySold: parseInt(product.quantitysold),
          revenue: parseFloat(product.revenue) || 0,
          ordersCount: parseInt(product.orderscount)
        })),
        inventoryStats: (inventoryStats as any[]).map((stat: any) => ({
          category: stat.category,
          totalProducts: parseInt(stat.totalproducts),
          lowStockCount: parseInt(stat.lowstockcount),
          outOfStockCount: parseInt(stat.outofstockcount),
          avgStock: parseFloat(stat.avgstock) || 0,
          totalInventoryValue: parseFloat(stat.totalinventoryvalue) || 0
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching real-time analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data'
    });
  }
});

// Customer analytics endpoint
router.get('/customer-insights', authMiddleware, async (req, res) => {
  try {
    const shopId = (req.user as any).shopId;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Customer behavior analysis
    const customerStats = await prisma.$queryRaw`
      SELECT 
        o."customerName",
        o."customerPhone",
        COUNT(*) as totalOrders,
        SUM(o."totalAmount") as totalSpent,
        AVG(o."totalAmount") as avgOrderValue,
        MAX(o."createdAt") as lastOrderDate,
        MIN(o."createdAt") as firstOrderDate
      FROM "Order" o
      WHERE o."shopId" = ${shopId}
        AND o."status" = 'COMPLETED'
        AND o."customerName" IS NOT NULL
        AND o."createdAt" >= ${thirtyDaysAgo}
      GROUP BY o."customerName", o."customerPhone"
      HAVING COUNT(*) > 1
      ORDER BY totalSpent DESC
      LIMIT 50
    `;

    // Purchase patterns
    const purchasePatterns = await prisma.$queryRaw`
      SELECT 
        EXTRACT(HOUR FROM "createdAt") as hour,
        EXTRACT(DOW FROM "createdAt") as dayOfWeek,
        COUNT(*) as orders,
        AVG("totalAmount") as avgOrderValue
      FROM "Order"
      WHERE "shopId" = ${shopId}
        AND "status" = 'COMPLETED'
        AND "createdAt" >= ${thirtyDaysAgo}
      GROUP BY EXTRACT(HOUR FROM "createdAt"), EXTRACT(DOW FROM "createdAt")
      ORDER BY orders DESC
    `;

    res.json({
      success: true,
      data: {
        customerStats: (customerStats as any[]).map((customer: any) => ({
          customerName: customer.customername,
          customerPhone: customer.customerphone,
          totalOrders: parseInt(customer.totalorders),
          totalSpent: parseFloat(customer.totalspent) || 0,
          avgOrderValue: parseFloat(customer.avgordervalue) || 0,
          lastOrderDate: customer.lastorderdate,
          firstOrderDate: customer.firstorderdate
        })),
        purchasePatterns: (purchasePatterns as any[]).map((pattern: any) => ({
          hour: parseInt(pattern.hour),
          dayOfWeek: parseInt(pattern.dayofweek),
          orders: parseInt(pattern.orders),
          avgOrderValue: parseFloat(pattern.avgordervalue) || 0
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching customer insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer insights'
    });
  }
});

export default router;
