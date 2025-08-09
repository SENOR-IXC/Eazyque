import { PrismaClient, ProductCategory, UnitOfMeasurement } from '@eazyque/database'

const prisma = new PrismaClient()

// Test products with real barcode formats for testing
const testProducts = [
  {
    name: "Amul Milk 500ml",
    description: "Fresh full cream milk",
    barcode: "8904552002344", // Real-like EAN-13 barcode
    hsnCode: "0401",
    category: ProductCategory.DAIRY,
    unitOfMeasurement: UnitOfMeasurement.ML,
    basePrice: 30.00,
    sellingPrice: 35.00,
    gstRate: 5.0,
    imageUrl: "https://via.placeholder.com/300x300/blue/white?text=Milk"
  },
  {
    name: "Maggi Noodles 70g",
    description: "Instant noodles masala flavor",
    barcode: "8901030826829", // Real-like EAN-13 barcode
    hsnCode: "1902",
    category: ProductCategory.GROCERIES,
    unitOfMeasurement: UnitOfMeasurement.GRAM,
    basePrice: 12.00,
    sellingPrice: 15.00,
    gstRate: 18.0,
    imageUrl: "https://via.placeholder.com/300x300/red/white?text=Noodles"
  },
  {
    name: "Lays Chips 25g",
    description: "Classic salted potato chips",
    barcode: "8901030765432", // Real-like EAN-13 barcode
    hsnCode: "2005",
    category: ProductCategory.SNACKS,
    unitOfMeasurement: UnitOfMeasurement.GRAM,
    basePrice: 10.00,
    sellingPrice: 12.00,
    gstRate: 18.0,
    imageUrl: "https://via.placeholder.com/300x300/yellow/black?text=Chips"
  },
  {
    name: "Pepsi 600ml",
    description: "Cold drink cola flavor",
    barcode: "8901030876543", // Real-like EAN-13 barcode
    hsnCode: "2202",
    category: ProductCategory.BEVERAGES,
    unitOfMeasurement: UnitOfMeasurement.ML,
    basePrice: 35.00,
    sellingPrice: 40.00,
    gstRate: 28.0,
    imageUrl: "https://via.placeholder.com/300x300/navy/white?text=Pepsi"
  },
  {
    name: "Parle-G Biscuit 100g",
    description: "Glucose biscuits",
    barcode: "8901063105836", // Real-like EAN-13 barcode
    hsnCode: "1905",
    category: ProductCategory.SNACKS,
    unitOfMeasurement: UnitOfMeasurement.GRAM,
    basePrice: 8.00,
    sellingPrice: 10.00,
    gstRate: 18.0,
    imageUrl: "https://via.placeholder.com/300x300/orange/white?text=Parle-G"
  },
  {
    name: "Apple 1kg",
    description: "Fresh red apples",
    barcode: "2012345678901", // EAN-13 starting with 20 (weighted products)
    hsnCode: "0808",
    category: ProductCategory.FRUITS,
    unitOfMeasurement: UnitOfMeasurement.KG,
    basePrice: 120.00,
    sellingPrice: 150.00,
    gstRate: 0.0,
    imageUrl: "https://via.placeholder.com/300x300/red/white?text=Apple"
  },
  {
    name: "Ariel Detergent 1kg",
    description: "Washing powder",
    barcode: "8901030987654", // Real-like EAN-13 barcode
    hsnCode: "3402",
    category: ProductCategory.HOUSEHOLD,
    unitOfMeasurement: UnitOfMeasurement.KG,
    basePrice: 180.00,
    sellingPrice: 220.00,
    gstRate: 18.0,
    imageUrl: "https://via.placeholder.com/300x300/blue/white?text=Ariel"
  },
  {
    name: "Colgate Toothpaste 100g",
    description: "Dental care toothpaste",
    barcode: "8901030456789", // Real-like EAN-13 barcode
    hsnCode: "3306",
    category: ProductCategory.PERSONAL_CARE,
    unitOfMeasurement: UnitOfMeasurement.GRAM,
    basePrice: 45.00,
    sellingPrice: 55.00,
    gstRate: 18.0,
    imageUrl: "https://via.placeholder.com/300x300/white/red?text=Colgate"
  }
]

async function seedBarcodeTestProducts() {
  try {
    console.log('🌱 Starting barcode test products seeding...')

    // First, get a shop to associate products with
    const shop = await prisma.shop.findFirst({
      where: { isActive: true }
    })

    if (!shop) {
      console.error('❌ No active shop found! Please create a shop first.')
      return
    }

    console.log(`📍 Using shop: ${shop.name} (${shop.id})`)

    // Delete existing test products to avoid conflicts
    const existingBarcodes = testProducts.map(p => p.barcode)
    
    // First delete inventory for these products
    const existingProducts = await prisma.product.findMany({
      where: { barcode: { in: existingBarcodes } },
      select: { id: true }
    })
    
    if (existingProducts.length > 0) {
      const productIds = existingProducts.map(p => p.id)
      await prisma.inventory.deleteMany({
        where: { productId: { in: productIds } }
      })
    }
    
    // Then delete the products
    await prisma.product.deleteMany({
      where: {
        barcode: { in: existingBarcodes }
      }
    })

    console.log('🗑️  Cleaned up existing test products')

    // Create test products
    const createdProducts = []
    for (const productData of testProducts) {
      const product = await prisma.product.create({
        data: {
          ...productData,
          shopId: shop.id
        }
      })
      createdProducts.push(product)
      console.log(`✅ Created: ${product.name} (Barcode: ${product.barcode})`)

      // Create inventory for each product
      await prisma.inventory.create({
        data: {
          productId: product.id,
          shopId: shop.id,
          quantity: 100, // Start with 100 units
          minStockLevel: 10,
          maxStockLevel: 500,
          costPrice: productData.basePrice
        }
      })
    }

    console.log('\n📦 Test Products with Barcodes Created:')
    console.log('========================================')
    testProducts.forEach(product => {
      console.log(`${product.name}: ${product.barcode}`)
    })

    console.log('\n🎯 Test Instructions:')
    console.log('1. Open http://localhost:3000/pos in your browser')
    console.log('2. Click the "Scan Barcode" button')
    console.log('3. Allow camera permissions when prompted')
    console.log('4. Test with the barcodes listed above')
    console.log('5. You can also use any barcode generator app on your phone')
    console.log('   to generate these barcodes for testing')

    console.log('\n✨ Seeding completed successfully!')

  } catch (error) {
    console.error('❌ Error seeding test products:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedBarcodeTestProducts()
}

export { seedBarcodeTestProducts, testProducts }
