import { PrismaClient } from '@eazyque/database'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding test products with barcodes...')

  try {
    // Get the first shop (or create one if none exists)
    let shop = await prisma.shop.findFirst()
    
    if (!shop) {
      console.log('No shop found, creating test shop...')
      shop = await prisma.shop.create({
        data: {
          name: 'Test Shop',
          gstNumber: '27ABCDE1234F1Z5',
          panNumber: 'ABCDE1234F',
          phone: '9876543210',
          email: 'test@shop.com',
          addressLine1: 'Test Address',
          city: 'Test City',
          state: 'Maharashtra',
          pincode: '400001'
        }
      })
    }

    console.log('Using shop:', shop.name, shop.id)

    // Test products with common barcode formats
    const testProducts = [
      {
        name: 'Coca Cola 500ml',
        description: 'Coca Cola Soft Drink 500ml Bottle',
        barcode: '8901030812345', // EAN-13 format
        hsnCode: '22021010',
        category: 'BEVERAGES',
        unitOfMeasurement: 'PIECES',
        basePrice: 25.00,
        sellingPrice: 30.00,
        gstRate: 18.0,
        shopId: shop.id
      },
      {
        name: 'Parle-G Biscuits',
        description: 'Parle-G Glucose Biscuits 100g Pack',
        barcode: '8901719101013', // EAN-13 format
        hsnCode: '19059090',
        category: 'SNACKS',
        unitOfMeasurement: 'PIECES',
        basePrice: 12.00,
        sellingPrice: 15.00,
        gstRate: 5.0,
        shopId: shop.id
      },
      {
        name: 'Maggi Noodles',
        description: 'Maggi 2-Minute Masala Noodles 70g',
        barcode: '8901030827394', // EAN-13 format
        hsnCode: '19023010',
        category: 'FOOD',
        unitOfMeasurement: 'PIECES',
        basePrice: 12.00,
        sellingPrice: 14.00,
        gstRate: 12.0,
        shopId: shop.id
      },
      {
        name: 'Amul Milk 500ml',
        description: 'Amul Toned Milk 500ml Packet',
        barcode: '8901030845102', // EAN-13 format
        hsnCode: '04011010',
        category: 'DAIRY',
        unitOfMeasurement: 'PIECES',
        basePrice: 22.00,
        sellingPrice: 25.00,
        gstRate: 5.0,
        shopId: shop.id
      },
      {
        name: 'Lays Chips',
        description: 'Lays Classic Salted Potato Chips 50g',
        barcode: '8901030896112', // EAN-13 format
        hsnCode: '20052010',
        category: 'SNACKS',
        unitOfMeasurement: 'PIECES',
        basePrice: 18.00,
        sellingPrice: 20.00,
        gstRate: 12.0,
        shopId: shop.id
      }
    ]

    console.log('Creating test products...')

    for (const product of testProducts) {
      // Check if product already exists
      const existing = await prisma.product.findFirst({
        where: { barcode: product.barcode, shopId: shop.id }
      })

      if (existing) {
        console.log(`✓ Product already exists: ${product.name} (${product.barcode})`)
        continue
      }

      // Create product and inventory in a transaction
      const result = await prisma.$transaction(async (tx: any) => {
        const newProduct = await tx.product.create({
          data: product
        })

        // Create initial inventory
        await tx.inventory.create({
          data: {
            productId: newProduct.id,
            quantity: Math.floor(Math.random() * 50) + 10, // Random stock between 10-60
            minStockLevel: 5,
            maxStockLevel: 100,
            costPrice: product.basePrice,
            shopId: shop.id
          }
        })

        return newProduct
      })

      console.log(`✅ Created: ${result.name} (${result.barcode})`)
    }

    console.log('🎉 Test products seeded successfully!')
    console.log('\nTest these barcodes in the scanner:')
    testProducts.forEach(p => {
      console.log(`- ${p.barcode} → ${p.name}`)
    })

  } catch (error) {
    console.error('❌ Error seeding products:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
