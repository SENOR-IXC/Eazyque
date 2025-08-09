import express from 'express';
import { PrismaClient } from '@eazyque/database';
import { authMiddleware, requireAdmin, requireShopOwner } from '../middleware/auth';
import { ValidationUtils } from '@eazyque/shared';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/shops - Get all shops (Admin only)
router.get('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const shops = await prisma.shop.findMany({
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true
          }
        },
        _count: {
          select: {
            orders: true,
            products: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: shops
    });
  } catch (error) {
    console.error('Shops fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shops',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// GET /api/shops/public - Get shops for employee signup (public route)
router.get('/public', async (req, res) => {
  try {
    const shops = await prisma.shop.findMany({
      select: {
        id: true,
        name: true,
        city: true,
        state: true
      },
      where: {
        isActive: true
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: shops
    });
  } catch (error) {
    console.error('Public shops fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shops',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// POST /api/shops/signup - Create new shop during signup (public route)
router.post('/signup', async (req, res) => {
  try {
    const {
      name,
      gstNumber,
      panNumber,
      phone,
      email,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      country = 'India'
    } = req.body;

    // Validate required fields
    if (!name || !gstNumber || !panNumber || !phone || !email || !addressLine1 || !city || !state || !pincode) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate GST number format (Indian GST format)
    if (!ValidationUtils.isValidGSTNumber(gstNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid GST number format'
      });
    }

    // Validate PAN number format
    if (!ValidationUtils.isValidPAN(panNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid PAN number format'
      });
    }

    // Check if shop with GST/PAN already exists
    const existingShop = await prisma.shop.findFirst({
      where: {
        OR: [
          { gstNumber },
          { panNumber }
        ]
      }
    });

    if (existingShop) {
      return res.status(409).json({
        success: false,
        message: 'Shop with this GST number or PAN number already exists'
      });
    }

    // Create shop
    const shop = await prisma.shop.create({
      data: {
        name,
        gstNumber,
        panNumber,
        phone,
        email,
        addressLine1,
        addressLine2,
        city,
        state,
        pincode,
        country
      }
    });

    res.status(201).json({
      success: true,
      message: 'Shop created successfully',
      data: shop
    });
  } catch (error) {
    console.error('Shop creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create shop',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// POST /api/shops - Create new shop
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      name,
      gstNumber,
      panNumber,
      phone,
      email,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      country = 'India'
    } = req.body;

    // Validate required fields
    if (!name || !gstNumber || !panNumber || !phone || !email || !addressLine1 || !city || !state || !pincode) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate GST number format (Indian GST format)
    if (!ValidationUtils.isValidGSTNumber(gstNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid GST number format'
      });
    }

    // Validate PAN number format
    if (!ValidationUtils.isValidPAN(panNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid PAN number format'
      });
    }

    // Check if shop with GST/PAN already exists
    const existingShop = await prisma.shop.findFirst({
      where: {
        OR: [
          { gstNumber },
          { panNumber }
        ]
      }
    });

    if (existingShop) {
      return res.status(409).json({
        success: false,
        message: 'Shop with this GST number or PAN number already exists'
      });
    }

    // Create shop
    const shop = await prisma.shop.create({
      data: {
        name,
        gstNumber,
        panNumber,
        phone,
        email,
        addressLine1,
        addressLine2,
        city,
        state,
        pincode,
        country
      }
    });

    res.status(201).json({
      success: true,
      message: 'Shop created successfully',
      data: shop
    });
  } catch (error) {
    console.error('Shop creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create shop',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// GET /api/shops/:id - Get shop by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user as any;

    // Check authorization (admin can see any shop, others only their own)
    if (user.role !== 'ADMIN' && user.shopId !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const shop = await prisma.shop.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            orders: true,
            products: true,
            inventory: true
          }
        }
      }
    });

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    res.json({
      success: true,
      data: shop
    });
  } catch (error) {
    console.error('Shop fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shop',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// PUT /api/shops/:id - Update shop
router.put('/:id', authMiddleware, requireShopOwner, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user as any;

    // Check authorization
    if (user.role !== 'ADMIN' && user.shopId !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const {
      name,
      phone,
      email,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      isActive
    } = req.body;

    const updatedShop = await prisma.shop.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(email && { email }),
        ...(addressLine1 && { addressLine1 }),
        ...(addressLine2 && { addressLine2 }),
        ...(city && { city }),
        ...(state && { state }),
        ...(pincode && { pincode }),
        ...(typeof isActive === 'boolean' && { isActive })
      }
    });

    res.json({
      success: true,
      message: 'Shop updated successfully',
      data: updatedShop
    });
  } catch (error) {
    console.error('Shop update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update shop',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// DELETE /api/shops/:id - Delete shop (Admin only)
router.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if shop has orders or products
    const shopData = await prisma.shop.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orders: true,
            products: true,
            users: true
          }
        }
      }
    });

    if (!shopData) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    if (shopData._count.orders > 0 || shopData._count.products > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete shop with existing orders or products. Deactivate instead.'
      });
    }

    await prisma.shop.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Shop deleted successfully'
    });
  } catch (error) {
    console.error('Shop deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete shop',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

export default router;
