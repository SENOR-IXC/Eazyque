import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Seed HSN Codes
  console.log('📊 Seeding HSN codes...');
  await prisma.hSNCode.createMany({
    data: [
      { code: '1006', description: 'Rice', gstRate: 5, chapter: '10', section: 'II' },
      { code: '1101', description: 'Wheat flour', gstRate: 5, chapter: '11', section: 'II' },
      { code: '1701', description: 'Sugar', gstRate: 5, chapter: '17', section: 'III' },
      { code: '1507', description: 'Edible oils', gstRate: 5, chapter: '15', section: 'III' },
      { code: '0401', description: 'Milk', gstRate: 5, chapter: '04', section: 'I' },
      { code: '0405', description: 'Butter', gstRate: 5, chapter: '04', section: 'I' },
      { code: '0406', description: 'Cheese', gstRate: 12, chapter: '04', section: 'I' },
      { code: '2202', description: 'Soft drinks', gstRate: 12, chapter: '22', section: 'IV' },
      { code: '2101', description: 'Tea/Coffee', gstRate: 5, chapter: '21', section: 'IV' },
      { code: '3401', description: 'Soap', gstRate: 18, chapter: '34', section: 'VI' },
      { code: '3305', description: 'Shampoo', gstRate: 18, chapter: '33', section: 'VI' },
      { code: '3924', description: 'Plastic containers', gstRate: 12, chapter: '39', section: 'VII' },
      { code: '1905', description: 'Biscuits', gstRate: 18, chapter: '19', section: 'IV' },
      { code: '1704', description: 'Chocolates', gstRate: 18, chapter: '17', section: 'IV' },
      { code: '3004', description: 'Medicines', gstRate: 5, chapter: '30', section: 'VI' }
    ],
    skipDuplicates: true
  });

  // Create demo shop
  console.log('🏪 Creating demo shop...');
  const demoShop = await prisma.shop.create({
    data: {
      name: 'Demo Grocery Store',
      gstNumber: '27AABCU9603R1ZM',
      panNumber: 'AABCU9603R',
      phone: '+919876543210',
      email: 'demo@eazyque.com',
      addressLine1: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      country: 'India'
    }
  });

  // Create admin user
  console.log('👤 Creating admin user...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@eazyque.com',
      phone: '+919876543210',
      name: 'Admin User',
      role: 'ADMIN',
      password: hashedPassword,
      shopId: demoShop.id
    }
  });

  // Create shop owner
  console.log('🏪 Creating shop owner...');
  const shopOwnerPassword = await bcrypt.hash('owner123', 10);
  const shopOwner = await prisma.user.create({
    data: {
      email: 'owner@demoshop.com',
      phone: '+919876543211',
      name: 'Shop Owner',
      role: 'SHOP_OWNER',
      password: shopOwnerPassword,
      shopId: demoShop.id
    }
  });

  // Create cashier
  console.log('💰 Creating cashier...');
  const cashierPassword = await bcrypt.hash('cashier123', 10);
  const cashier = await prisma.user.create({
    data: {
      email: 'cashier@demoshop.com',
      phone: '+919876543212',
      name: 'Cashier User',
      role: 'CASHIER',
      password: cashierPassword,
      shopId: demoShop.id
    }
  });

  // Create sample products
  console.log('📦 Creating sample products...');
  const products = await prisma.product.createMany({
    data: [
      {
        name: 'Basmati Rice 1kg',
        description: 'Premium quality basmati rice',
        barcode: '8901030865557',
        hsnCode: '1006',
        category: 'GROCERIES',
        unitOfMeasurement: 'KG',
        basePrice: 100,
        sellingPrice: 120,
        gstRate: 5,
        shopId: demoShop.id
      },
      {
        name: 'Milk 1L',
        description: 'Fresh full cream milk',
        barcode: '8901030865558',
        hsnCode: '0401',
        category: 'DAIRY',
        unitOfMeasurement: 'LITER',
        basePrice: 45,
        sellingPrice: 55,
        gstRate: 5,
        shopId: demoShop.id
      },
      {
        name: 'Biscuits Pack',
        description: 'Delicious cream biscuits',
        barcode: '8901030865559',
        hsnCode: '1905',
        category: 'SNACKS',
        unitOfMeasurement: 'PACK',
        basePrice: 30,
        sellingPrice: 40,
        gstRate: 18,
        shopId: demoShop.id
      },
      {
        name: 'Cooking Oil 1L',
        description: 'Refined sunflower oil',
        barcode: '8901030865560',
        hsnCode: '1507',
        category: 'GROCERIES',
        unitOfMeasurement: 'LITER',
        basePrice: 80,
        sellingPrice: 95,
        gstRate: 5,
        shopId: demoShop.id
      },
      {
        name: 'Soap Bar',
        description: 'Moisturizing soap bar',
        barcode: '8901030865561',
        hsnCode: '3401',
        category: 'PERSONAL_CARE',
        unitOfMeasurement: 'PIECE',
        basePrice: 25,
        sellingPrice: 35,
        gstRate: 18,
        shopId: demoShop.id
      }
    ]
  });

  // Get created products for inventory
  const createdProducts = await prisma.product.findMany({
    where: { shopId: demoShop.id }
  });

  // Create inventory for products
  console.log('📊 Creating inventory records...');
  await prisma.inventory.createMany({
    data: createdProducts.map((product: any) => ({
      productId: product.id,
      quantity: Math.floor(Math.random() * 100) + 20, // 20-120 items
      minStockLevel: 10,
      maxStockLevel: 200,
      costPrice: product.basePrice,
      shopId: demoShop.id
    }))
  });

  // Create sample customers
  console.log('👥 Creating sample customers...');
  await prisma.customer.createMany({
    data: [
      {
        name: 'John Doe',
        phone: '+919876543220',
        email: 'john@example.com',
        addressLine1: '456 Customer Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400002',
        loyaltyPoints: 150,
        totalSpent: 2500,
        shopId: demoShop.id
      },
      {
        name: 'Jane Smith',
        phone: '+919876543221',
        email: 'jane@example.com',
        addressLine1: '789 Buyer Avenue',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400003',
        loyaltyPoints: 75,
        totalSpent: 1200,
        shopId: demoShop.id
      }
    ]
  });

  // Create sample settings
  console.log('⚙️ Creating app settings...');
  await prisma.appSetting.createMany({
    data: [
      {
        key: 'loyalty_points_per_rupee',
        value: { points: 1, rupees: 100 },
        shopId: demoShop.id
      },
      {
        key: 'tax_settings',
        value: { 
          default_gst_rate: 18,
          enable_cess: false,
          round_off: true 
        },
        shopId: demoShop.id
      },
      {
        key: 'receipt_settings',
        value: {
          show_hsn: true,
          show_gst_breakup: true,
          footer_message: 'Thank you for shopping with us!'
        },
        shopId: demoShop.id
      }
    ]
  });

  console.log('✅ Database seeding completed successfully!');
  console.log(`
🎉 Demo data created:
   Shop: ${demoShop.name}
   Admin: admin@eazyque.com (password: admin123)
   Owner: owner@demoshop.com (password: owner123)
   Cashier: cashier@demoshop.com (password: cashier123)
   Products: ${createdProducts.length} items
   HSN Codes: 15 entries
  `);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
