"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationSchema = exports.NotificationType = exports.ScanResultSchema = exports.BarcodeFormat = exports.APIResponseSchema = exports.CustomerSchema = exports.OrderSchema = exports.OrderItemSchema = exports.PaymentStatus = exports.PaymentMethod = exports.OrderStatus = exports.InventorySchema = exports.ProductSchema = exports.UnitOfMeasurement = exports.ProductCategory = exports.ShopSchema = exports.AddressSchema = exports.UserSchema = exports.UserRole = exports.HSNSchema = exports.TaxSchema = exports.TaxType = exports.GSTRate = void 0;
// Shared types and schemas for EazyQue Retail Platform
const zod_1 = require("zod");
// ============ GST & Tax Types ============
var GSTRate;
(function (GSTRate) {
    GSTRate[GSTRate["ZERO"] = 0] = "ZERO";
    GSTRate[GSTRate["FIVE"] = 5] = "FIVE";
    GSTRate[GSTRate["TWELVE"] = 12] = "TWELVE";
    GSTRate[GSTRate["EIGHTEEN"] = 18] = "EIGHTEEN";
    GSTRate[GSTRate["TWENTY_EIGHT"] = 28] = "TWENTY_EIGHT";
})(GSTRate || (exports.GSTRate = GSTRate = {}));
var TaxType;
(function (TaxType) {
    TaxType["CGST"] = "CGST";
    TaxType["SGST"] = "SGST";
    TaxType["IGST"] = "IGST";
    TaxType["CESS"] = "CESS";
})(TaxType || (exports.TaxType = TaxType = {}));
exports.TaxSchema = zod_1.z.object({
    type: zod_1.z.nativeEnum(TaxType),
    rate: zod_1.z.number().min(0).max(100),
    amount: zod_1.z.number().min(0)
});
exports.HSNSchema = zod_1.z.object({
    code: zod_1.z.string().min(4).max(8),
    description: zod_1.z.string(),
    gstRate: zod_1.z.nativeEnum(GSTRate),
    isActive: zod_1.z.boolean().default(true)
});
// ============ User & Authentication Types ============
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["SHOP_OWNER"] = "SHOP_OWNER";
    UserRole["CASHIER"] = "CASHIER";
    UserRole["CUSTOMER"] = "CUSTOMER";
})(UserRole || (exports.UserRole = UserRole = {}));
exports.UserSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().min(10).max(15),
    name: zod_1.z.string().min(1),
    role: zod_1.z.nativeEnum(UserRole),
    shopId: zod_1.z.string().uuid().optional(),
    isActive: zod_1.z.boolean().default(true),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
// ============ Shop & Business Types ============
exports.AddressSchema = zod_1.z.object({
    street: zod_1.z.string(),
    city: zod_1.z.string(),
    state: zod_1.z.string(),
    pincode: zod_1.z.string().length(6),
    country: zod_1.z.string().default('India')
});
exports.ShopSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1),
    gstNumber: zod_1.z.string().length(15),
    panNumber: zod_1.z.string().length(10),
    address: exports.AddressSchema,
    phone: zod_1.z.string(),
    email: zod_1.z.string().email(),
    isActive: zod_1.z.boolean().default(true),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
// ============ Product & Inventory Types ============
var ProductCategory;
(function (ProductCategory) {
    ProductCategory["GROCERIES"] = "GROCERIES";
    ProductCategory["DAIRY"] = "DAIRY";
    ProductCategory["VEGETABLES"] = "VEGETABLES";
    ProductCategory["FRUITS"] = "FRUITS";
    ProductCategory["BEVERAGES"] = "BEVERAGES";
    ProductCategory["SNACKS"] = "SNACKS";
    ProductCategory["PERSONAL_CARE"] = "PERSONAL_CARE";
    ProductCategory["HOUSEHOLD"] = "HOUSEHOLD";
    ProductCategory["OTHER"] = "OTHER";
})(ProductCategory || (exports.ProductCategory = ProductCategory = {}));
var UnitOfMeasurement;
(function (UnitOfMeasurement) {
    UnitOfMeasurement["KG"] = "KG";
    UnitOfMeasurement["GRAM"] = "GRAM";
    UnitOfMeasurement["LITER"] = "LITER";
    UnitOfMeasurement["ML"] = "ML";
    UnitOfMeasurement["PIECE"] = "PIECE";
    UnitOfMeasurement["PACK"] = "PACK";
    UnitOfMeasurement["BOX"] = "BOX";
})(UnitOfMeasurement || (exports.UnitOfMeasurement = UnitOfMeasurement = {}));
exports.ProductSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    barcode: zod_1.z.string().optional(),
    hsnCode: zod_1.z.string(),
    category: zod_1.z.nativeEnum(ProductCategory),
    unitOfMeasurement: zod_1.z.nativeEnum(UnitOfMeasurement),
    basePrice: zod_1.z.number().min(0),
    sellingPrice: zod_1.z.number().min(0),
    gstRate: zod_1.z.nativeEnum(GSTRate),
    imageUrl: zod_1.z.string().url().optional(),
    isActive: zod_1.z.boolean().default(true),
    shopId: zod_1.z.string().uuid(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
exports.InventorySchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    productId: zod_1.z.string().uuid(),
    quantity: zod_1.z.number().min(0),
    minStockLevel: zod_1.z.number().min(0),
    maxStockLevel: zod_1.z.number().min(0),
    batchNumber: zod_1.z.string().optional(),
    expiryDate: zod_1.z.date().optional(),
    costPrice: zod_1.z.number().min(0),
    lastUpdated: zod_1.z.date()
});
// ============ Order & Billing Types ============
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "PENDING";
    OrderStatus["PROCESSING"] = "PROCESSING";
    OrderStatus["COMPLETED"] = "COMPLETED";
    OrderStatus["CANCELLED"] = "CANCELLED";
    OrderStatus["REFUNDED"] = "REFUNDED";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CASH"] = "CASH";
    PaymentMethod["UPI"] = "UPI";
    PaymentMethod["CARD"] = "CARD";
    PaymentMethod["WALLET"] = "WALLET";
    PaymentMethod["SPLIT"] = "SPLIT";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["PROCESSING"] = "PROCESSING";
    PaymentStatus["SUCCESS"] = "SUCCESS";
    PaymentStatus["FAILED"] = "FAILED";
    PaymentStatus["REFUNDED"] = "REFUNDED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
exports.OrderItemSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    productId: zod_1.z.string().uuid(),
    quantity: zod_1.z.number().min(0.01),
    unitPrice: zod_1.z.number().min(0),
    totalPrice: zod_1.z.number().min(0),
    taxAmount: zod_1.z.number().min(0),
    discountAmount: zod_1.z.number().min(0).default(0)
});
exports.OrderSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    orderNumber: zod_1.z.string(),
    customerId: zod_1.z.string().uuid().optional(),
    shopId: zod_1.z.string().uuid(),
    cashierId: zod_1.z.string().uuid().optional(),
    items: zod_1.z.array(exports.OrderItemSchema),
    subtotal: zod_1.z.number().min(0),
    taxAmount: zod_1.z.number().min(0),
    discountAmount: zod_1.z.number().min(0).default(0),
    totalAmount: zod_1.z.number().min(0),
    status: zod_1.z.nativeEnum(OrderStatus),
    paymentMethod: zod_1.z.nativeEnum(PaymentMethod),
    paymentStatus: zod_1.z.nativeEnum(PaymentStatus),
    isDelivery: zod_1.z.boolean().default(false),
    deliveryAddress: exports.AddressSchema.optional(),
    notes: zod_1.z.string().optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
// ============ Customer Types ============
exports.CustomerSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1),
    phone: zod_1.z.string().min(10).max(15),
    email: zod_1.z.string().email().optional(),
    address: exports.AddressSchema.optional(),
    loyaltyPoints: zod_1.z.number().min(0).default(0),
    totalSpent: zod_1.z.number().min(0).default(0),
    isActive: zod_1.z.boolean().default(true),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
// ============ API Response Types ============
exports.APIResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    message: zod_1.z.string(),
    data: zod_1.z.any().optional(),
    error: zod_1.z.string().optional(),
    timestamp: zod_1.z.date().default(() => new Date())
});
// ============ Barcode & Scanning Types ============
var BarcodeFormat;
(function (BarcodeFormat) {
    BarcodeFormat["EAN_13"] = "EAN_13";
    BarcodeFormat["EAN_8"] = "EAN_8";
    BarcodeFormat["UPC_A"] = "UPC_A";
    BarcodeFormat["UPC_E"] = "UPC_E";
    BarcodeFormat["CODE_128"] = "CODE_128";
    BarcodeFormat["CODE_39"] = "CODE_39";
    BarcodeFormat["QR_CODE"] = "QR_CODE";
})(BarcodeFormat || (exports.BarcodeFormat = BarcodeFormat = {}));
exports.ScanResultSchema = zod_1.z.object({
    barcode: zod_1.z.string(),
    format: zod_1.z.nativeEnum(BarcodeFormat),
    timestamp: zod_1.z.date(),
    confidence: zod_1.z.number().min(0).max(1).optional()
});
// ============ Notification Types ============
var NotificationType;
(function (NotificationType) {
    NotificationType["ORDER_PLACED"] = "ORDER_PLACED";
    NotificationType["PAYMENT_SUCCESS"] = "PAYMENT_SUCCESS";
    NotificationType["PAYMENT_FAILED"] = "PAYMENT_FAILED";
    NotificationType["LOW_STOCK"] = "LOW_STOCK";
    NotificationType["SYSTEM_ALERT"] = "SYSTEM_ALERT";
    NotificationType["PROMOTION"] = "PROMOTION";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
exports.NotificationSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    type: zod_1.z.nativeEnum(NotificationType),
    title: zod_1.z.string(),
    message: zod_1.z.string(),
    userId: zod_1.z.string().uuid(),
    shopId: zod_1.z.string().uuid().optional(),
    isRead: zod_1.z.boolean().default(false),
    createdAt: zod_1.z.date()
});
//# sourceMappingURL=types.js.map