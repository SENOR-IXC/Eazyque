// Shared types and schemas for EazyQue Retail Platform
import { z } from 'zod';

// ============ GST & Tax Types ============
export enum GSTRate {
  ZERO = 0,
  FIVE = 5,
  TWELVE = 12,
  EIGHTEEN = 18,
  TWENTY_EIGHT = 28
}

export enum TaxType {
  CGST = 'CGST',
  SGST = 'SGST',
  IGST = 'IGST',
  CESS = 'CESS'
}

export const TaxSchema = z.object({
  type: z.nativeEnum(TaxType),
  rate: z.number().min(0).max(100),
  amount: z.number().min(0)
});

export const HSNSchema = z.object({
  code: z.string().min(4).max(8),
  description: z.string(),
  gstRate: z.nativeEnum(GSTRate),
  isActive: z.boolean().default(true)
});

// ============ User & Authentication Types ============
export enum UserRole {
  ADMIN = 'ADMIN',
  SHOP_OWNER = 'SHOP_OWNER',
  CASHIER = 'CASHIER',
  CUSTOMER = 'CUSTOMER'
}

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  phone: z.string().min(10).max(15),
  name: z.string().min(1),
  role: z.nativeEnum(UserRole),
  shopId: z.string().uuid().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date()
});

// ============ Shop & Business Types ============
export const AddressSchema = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string(),
  pincode: z.string().length(6),
  country: z.string().default('India')
});

export const ShopSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  gstNumber: z.string().length(15),
  panNumber: z.string().length(10),
  address: AddressSchema,
  phone: z.string(),
  email: z.string().email(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date()
});

// ============ Product & Inventory Types ============
export enum ProductCategory {
  GROCERIES = 'GROCERIES',
  DAIRY = 'DAIRY',
  VEGETABLES = 'VEGETABLES',
  FRUITS = 'FRUITS',
  BEVERAGES = 'BEVERAGES',
  SNACKS = 'SNACKS',
  PERSONAL_CARE = 'PERSONAL_CARE',
  HOUSEHOLD = 'HOUSEHOLD',
  OTHER = 'OTHER'
}

export enum UnitOfMeasurement {
  KG = 'KG',
  GRAM = 'GRAM',
  LITER = 'LITER',
  ML = 'ML',
  PIECE = 'PIECE',
  PACK = 'PACK',
  BOX = 'BOX'
}

export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  barcode: z.string().optional(),
  hsnCode: z.string(),
  category: z.nativeEnum(ProductCategory),
  unitOfMeasurement: z.nativeEnum(UnitOfMeasurement),
  basePrice: z.number().min(0),
  sellingPrice: z.number().min(0),
  gstRate: z.nativeEnum(GSTRate),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
  shopId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const InventorySchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.number().min(0),
  minStockLevel: z.number().min(0),
  maxStockLevel: z.number().min(0),
  batchNumber: z.string().optional(),
  expiryDate: z.date().optional(),
  costPrice: z.number().min(0),
  lastUpdated: z.date()
});

// ============ Order & Billing Types ============
export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentMethod {
  CASH = 'CASH',
  UPI = 'UPI',
  CARD = 'CARD',
  WALLET = 'WALLET',
  SPLIT = 'SPLIT'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export const OrderItemSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.number().min(0.01),
  unitPrice: z.number().min(0),
  totalPrice: z.number().min(0),
  taxAmount: z.number().min(0),
  discountAmount: z.number().min(0).default(0)
});

export const OrderSchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.string(),
  customerId: z.string().uuid().optional(),
  shopId: z.string().uuid(),
  cashierId: z.string().uuid().optional(),
  items: z.array(OrderItemSchema),
  subtotal: z.number().min(0),
  taxAmount: z.number().min(0),
  discountAmount: z.number().min(0).default(0),
  totalAmount: z.number().min(0),
  status: z.nativeEnum(OrderStatus),
  paymentMethod: z.nativeEnum(PaymentMethod),
  paymentStatus: z.nativeEnum(PaymentStatus),
  isDelivery: z.boolean().default(false),
  deliveryAddress: AddressSchema.optional(),
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// ============ Customer Types ============
export const CustomerSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  phone: z.string().min(10).max(15),
  email: z.string().email().optional(),
  address: AddressSchema.optional(),
  loyaltyPoints: z.number().min(0).default(0),
  totalSpent: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date()
});

// ============ API Response Types ============
export const APIResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().optional(),
  error: z.string().optional(),
  timestamp: z.date().default(() => new Date())
});

// ============ Barcode & Scanning Types ============
export enum BarcodeFormat {
  EAN_13 = 'EAN_13',
  EAN_8 = 'EAN_8',
  UPC_A = 'UPC_A',
  UPC_E = 'UPC_E',
  CODE_128 = 'CODE_128',
  CODE_39 = 'CODE_39',
  QR_CODE = 'QR_CODE'
}

export const ScanResultSchema = z.object({
  barcode: z.string(),
  format: z.nativeEnum(BarcodeFormat),
  timestamp: z.date(),
  confidence: z.number().min(0).max(1).optional()
});

// ============ Notification Types ============
export enum NotificationType {
  ORDER_PLACED = 'ORDER_PLACED',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  LOW_STOCK = 'LOW_STOCK',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  PROMOTION = 'PROMOTION'
}

export const NotificationSchema = z.object({
  id: z.string().uuid(),
  type: z.nativeEnum(NotificationType),
  title: z.string(),
  message: z.string(),
  userId: z.string().uuid(),
  shopId: z.string().uuid().optional(),
  isRead: z.boolean().default(false),
  createdAt: z.date()
});

// ============ Type Exports ============
export type Tax = z.infer<typeof TaxSchema>;
export type HSN = z.infer<typeof HSNSchema>;
export type User = z.infer<typeof UserSchema>;
export type Address = z.infer<typeof AddressSchema>;
export type Shop = z.infer<typeof ShopSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type Inventory = z.infer<typeof InventorySchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type Order = z.infer<typeof OrderSchema>;
export type Customer = z.infer<typeof CustomerSchema>;
export type APIResponse = z.infer<typeof APIResponseSchema>;
export type ScanResult = z.infer<typeof ScanResultSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
