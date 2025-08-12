import { Router, Request, Response } from 'express';
import { PrismaClient } from '@eazyque/database';
import { authMiddleware, requireRole } from '../middleware/auth';
import { body, param, validationResult } from 'express-validator';

const router = Router();
const prisma = new PrismaClient();

// Types for loyalty system
interface LoyaltyCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  loyaltyPoints: number;
  totalSpent: number;
  memberSince: Date;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
}

interface LoyaltyTransaction {
  id: string;
  customerId: string;
  orderId?: string;
  type: 'EARNED' | 'REDEEMED' | 'EXPIRED' | 'BONUS';
  points: number;
  description: string;
  createdAt: Date;
}

// Calculate customer tier based on total spent
function calculateTier(totalSpent: number): 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' {
  if (totalSpent >= 100000) return 'PLATINUM'; // ₹1,00,000+
  if (totalSpent >= 50000) return 'GOLD';      // ₹50,000+
  if (totalSpent >= 20000) return 'SILVER';    // ₹20,000+
  return 'BRONZE'; // Below ₹20,000
}

// Get tier multiplier for points earning
function getTierMultiplier(tier: string): number {
  const multipliers = {
    'BRONZE': 1.0,
    'SILVER': 1.2,
    'GOLD': 1.5,
    'PLATINUM': 2.0
  };
  return multipliers[tier as keyof typeof multipliers] || 1.0;
}

// Get all loyalty customers for a shop
router.get('/customers', authMiddleware, async (req: Request, res: Response) => {
  try {
    const shopId = req.user?.shopId;
    if (!shopId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Shop ID required' 
      });
    }

    const customers = await prisma.customer.findMany({
      where: { shopId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        loyaltyPoints: true,
        totalSpent: true,
        createdAt: true,
        orders: {
          select: {
            totalAmount: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        loyaltyPoints: 'desc'
      }
    });

    const loyaltyCustomers: LoyaltyCustomer[] = customers.map(customer => ({
      id: customer.id,
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      loyaltyPoints: customer.loyaltyPoints || 0,
      totalSpent: customer.totalSpent || 0,
      memberSince: customer.createdAt,
      tier: calculateTier(customer.totalSpent || 0)
    }));

    res.json({
      success: true,
      data: loyaltyCustomers,
      totalCustomers: customers.length
    });
  } catch (error) {
    console.error('Error fetching loyalty customers:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Get customer loyalty details
router.get('/customer/:customerId', 
  authMiddleware,
  param('customerId').isUUID().withMessage('Valid customer ID required'),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const { customerId } = req.params;
      const shopId = req.user?.shopId;

      const customer = await prisma.customer.findFirst({
        where: { 
          id: customerId,
          shopId 
        },
        include: {
          orders: {
            select: {
              id: true,
              orderNumber: true,
              totalAmount: true,
              createdAt: true,
              items: {
                select: {
                  quantity: true,
                  unitPrice: true,
                  product: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 10
          }
        }
      });

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }

      const tier = calculateTier(customer.totalSpent || 0);
      const tierMultiplier = getTierMultiplier(tier);

      res.json({
        success: true,
        data: {
          customer: {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            loyaltyPoints: customer.loyaltyPoints || 0,
            totalSpent: customer.totalSpent || 0,
            memberSince: customer.createdAt,
            tier,
            tierMultiplier
          },
          recentOrders: customer.orders,
          tierBenefits: {
            pointsMultiplier: tierMultiplier,
            nextTierSpend: tier === 'PLATINUM' ? 0 : 
              tier === 'GOLD' ? 100000 - (customer.totalSpent || 0) :
              tier === 'SILVER' ? 50000 - (customer.totalSpent || 0) :
              20000 - (customer.totalSpent || 0)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching customer loyalty details:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }
);

// Add loyalty points (manual or bonus)
router.post('/add-points',
  authMiddleware,
  body('customerId').isUUID().withMessage('Valid customer ID required'),
  body('points').isInt({ min: 1 }).withMessage('Points must be a positive integer'),
  body('description').notEmpty().withMessage('Description required'),
  body('type').isIn(['BONUS', 'MANUAL']).withMessage('Type must be BONUS or MANUAL'),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const { customerId, points, description, type } = req.body;
      const shopId = req.user?.shopId;

      // Verify customer belongs to shop
      const customer = await prisma.customer.findFirst({
        where: { id: customerId, shopId }
      });

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }

      // Update customer points
      const updatedCustomer = await prisma.customer.update({
        where: { id: customerId },
        data: {
          loyaltyPoints: {
            increment: points
          }
        }
      });

      res.json({
        success: true,
        message: `${points} loyalty points added successfully`,
        data: {
          customerId,
          pointsAdded: points,
          totalPoints: updatedCustomer.loyaltyPoints,
          tier: calculateTier(updatedCustomer.totalSpent || 0)
        }
      });
    } catch (error) {
      console.error('Error adding loyalty points:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }
);

// Redeem loyalty points
router.post('/redeem',
  authMiddleware,
  body('customerId').isUUID().withMessage('Valid customer ID required'),
  body('points').isInt({ min: 1 }).withMessage('Points must be a positive integer'),
  body('description').optional().notEmpty().withMessage('Description cannot be empty if provided'),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const { customerId, points, description = 'Points redeemed' } = req.body;
      const shopId = req.user?.shopId;

      // Verify customer and check points balance
      const customer = await prisma.customer.findFirst({
        where: { id: customerId, shopId }
      });

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }

      const currentPoints = customer.loyaltyPoints || 0;
      if (currentPoints < points) {
        return res.status(400).json({
          success: false,
          message: `Insufficient points. Customer has ${currentPoints} points, attempting to redeem ${points}`
        });
      }

      // Minimum redemption check (100 points)
      if (points < 100) {
        return res.status(400).json({
          success: false,
          message: 'Minimum redemption is 100 points'
        });
      }

      // Calculate redemption value (1 point = ₹1)
      const redemptionValue = points;

      // Update customer points
      const updatedCustomer = await prisma.customer.update({
        where: { id: customerId },
        data: {
          loyaltyPoints: {
            decrement: points
          }
        }
      });

      res.json({
        success: true,
        message: `${points} loyalty points redeemed successfully`,
        data: {
          customerId,
          pointsRedeemed: points,
          redemptionValue,
          remainingPoints: updatedCustomer.loyaltyPoints,
          tier: calculateTier(updatedCustomer.totalSpent || 0)
        }
      });
    } catch (error) {
      console.error('Error redeeming loyalty points:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }
);

// Get loyalty program statistics
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const shopId = req.user?.shopId;
    if (!shopId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Shop ID required' 
      });
    }

    const customers = await prisma.customer.findMany({
      where: { shopId },
      select: {
        loyaltyPoints: true,
        totalSpent: true
      }
    });

    const totalCustomers = customers.length;
    const totalPoints = customers.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0);
    const totalSpent = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);

    // Calculate tier distribution
    const tierDistribution = customers.reduce((acc, customer) => {
      const tier = calculateTier(customer.totalSpent || 0);
      acc[tier] = (acc[tier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      data: {
        totalCustomers,
        totalPointsIssued: totalPoints,
        totalSpentByLoyaltyCustomers: totalSpent,
        averagePointsPerCustomer: totalCustomers > 0 ? Math.round(totalPoints / totalCustomers) : 0,
        tierDistribution: {
          bronze: tierDistribution.BRONZE || 0,
          silver: tierDistribution.SILVER || 0,
          gold: tierDistribution.GOLD || 0,
          platinum: tierDistribution.PLATINUM || 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching loyalty stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Search customers by name, email, or phone
router.get('/search',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { q } = req.query;
      const shopId = req.user?.shopId;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Search query required'
        });
      }

      const customers = await prisma.customer.findMany({
        where: {
          shopId,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q } }
          ]
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          loyaltyPoints: true,
          totalSpent: true
        },
        take: 10
      });

      const results = customers.map(customer => ({
        ...customer,
        tier: calculateTier(customer.totalSpent || 0)
      }));

      res.json({
        success: true,
        data: results,
        count: results.length
      });
    } catch (error) {
      console.error('Error searching customers:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }
);

export default router;