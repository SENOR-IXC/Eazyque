import { z } from 'zod';
export declare enum GSTRate {
    ZERO = 0,
    FIVE = 5,
    TWELVE = 12,
    EIGHTEEN = 18,
    TWENTY_EIGHT = 28
}
export declare enum TaxType {
    CGST = "CGST",
    SGST = "SGST",
    IGST = "IGST",
    CESS = "CESS"
}
export declare const TaxSchema: z.ZodObject<{
    type: z.ZodNativeEnum<typeof TaxType>;
    rate: z.ZodNumber;
    amount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: TaxType;
    rate: number;
    amount: number;
}, {
    type: TaxType;
    rate: number;
    amount: number;
}>;
export declare const HSNSchema: z.ZodObject<{
    code: z.ZodString;
    description: z.ZodString;
    gstRate: z.ZodNativeEnum<typeof GSTRate>;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    code: string;
    description: string;
    gstRate: GSTRate;
    isActive: boolean;
}, {
    code: string;
    description: string;
    gstRate: GSTRate;
    isActive?: boolean | undefined;
}>;
export declare enum UserRole {
    ADMIN = "ADMIN",
    SHOP_OWNER = "SHOP_OWNER",
    CASHIER = "CASHIER",
    CUSTOMER = "CUSTOMER"
}
export declare const UserSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    phone: z.ZodString;
    name: z.ZodString;
    role: z.ZodNativeEnum<typeof UserRole>;
    shopId: z.ZodOptional<z.ZodString>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    isActive: boolean;
    id: string;
    email: string;
    phone: string;
    name: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
    shopId?: string | undefined;
}, {
    id: string;
    email: string;
    phone: string;
    name: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
    isActive?: boolean | undefined;
    shopId?: string | undefined;
}>;
export declare const AddressSchema: z.ZodObject<{
    street: z.ZodString;
    city: z.ZodString;
    state: z.ZodString;
    pincode: z.ZodString;
    country: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
}, {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country?: string | undefined;
}>;
export declare const ShopSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    gstNumber: z.ZodString;
    panNumber: z.ZodString;
    address: z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodString;
        pincode: z.ZodString;
        country: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        street: string;
        city: string;
        state: string;
        pincode: string;
        country: string;
    }, {
        street: string;
        city: string;
        state: string;
        pincode: string;
        country?: string | undefined;
    }>;
    phone: z.ZodString;
    email: z.ZodString;
    isActive: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    isActive: boolean;
    id: string;
    email: string;
    phone: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    gstNumber: string;
    panNumber: string;
    address: {
        street: string;
        city: string;
        state: string;
        pincode: string;
        country: string;
    };
}, {
    id: string;
    email: string;
    phone: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    gstNumber: string;
    panNumber: string;
    address: {
        street: string;
        city: string;
        state: string;
        pincode: string;
        country?: string | undefined;
    };
    isActive?: boolean | undefined;
}>;
export declare enum ProductCategory {
    GROCERIES = "GROCERIES",
    DAIRY = "DAIRY",
    VEGETABLES = "VEGETABLES",
    FRUITS = "FRUITS",
    BEVERAGES = "BEVERAGES",
    SNACKS = "SNACKS",
    PERSONAL_CARE = "PERSONAL_CARE",
    HOUSEHOLD = "HOUSEHOLD",
    OTHER = "OTHER"
}
export declare enum UnitOfMeasurement {
    KG = "KG",
    GRAM = "GRAM",
    LITER = "LITER",
    ML = "ML",
    PIECE = "PIECE",
    PACK = "PACK",
    BOX = "BOX"
}
export declare const ProductSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    barcode: z.ZodOptional<z.ZodString>;
    hsnCode: z.ZodString;
    category: z.ZodNativeEnum<typeof ProductCategory>;
    unitOfMeasurement: z.ZodNativeEnum<typeof UnitOfMeasurement>;
    basePrice: z.ZodNumber;
    sellingPrice: z.ZodNumber;
    gstRate: z.ZodNativeEnum<typeof GSTRate>;
    imageUrl: z.ZodOptional<z.ZodString>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    shopId: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    gstRate: GSTRate;
    isActive: boolean;
    id: string;
    name: string;
    shopId: string;
    createdAt: Date;
    updatedAt: Date;
    hsnCode: string;
    category: ProductCategory;
    unitOfMeasurement: UnitOfMeasurement;
    basePrice: number;
    sellingPrice: number;
    description?: string | undefined;
    barcode?: string | undefined;
    imageUrl?: string | undefined;
}, {
    gstRate: GSTRate;
    id: string;
    name: string;
    shopId: string;
    createdAt: Date;
    updatedAt: Date;
    hsnCode: string;
    category: ProductCategory;
    unitOfMeasurement: UnitOfMeasurement;
    basePrice: number;
    sellingPrice: number;
    description?: string | undefined;
    isActive?: boolean | undefined;
    barcode?: string | undefined;
    imageUrl?: string | undefined;
}>;
export declare const InventorySchema: z.ZodObject<{
    id: z.ZodString;
    productId: z.ZodString;
    quantity: z.ZodNumber;
    minStockLevel: z.ZodNumber;
    maxStockLevel: z.ZodNumber;
    batchNumber: z.ZodOptional<z.ZodString>;
    expiryDate: z.ZodOptional<z.ZodDate>;
    costPrice: z.ZodNumber;
    lastUpdated: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    productId: string;
    quantity: number;
    minStockLevel: number;
    maxStockLevel: number;
    costPrice: number;
    lastUpdated: Date;
    batchNumber?: string | undefined;
    expiryDate?: Date | undefined;
}, {
    id: string;
    productId: string;
    quantity: number;
    minStockLevel: number;
    maxStockLevel: number;
    costPrice: number;
    lastUpdated: Date;
    batchNumber?: string | undefined;
    expiryDate?: Date | undefined;
}>;
export declare enum OrderStatus {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED",
    REFUNDED = "REFUNDED"
}
export declare enum PaymentMethod {
    CASH = "CASH",
    UPI = "UPI",
    CARD = "CARD",
    WALLET = "WALLET",
    SPLIT = "SPLIT"
}
export declare enum PaymentStatus {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    SUCCESS = "SUCCESS",
    FAILED = "FAILED",
    REFUNDED = "REFUNDED"
}
export declare const OrderItemSchema: z.ZodObject<{
    id: z.ZodString;
    productId: z.ZodString;
    quantity: z.ZodNumber;
    unitPrice: z.ZodNumber;
    totalPrice: z.ZodNumber;
    taxAmount: z.ZodNumber;
    discountAmount: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    taxAmount: number;
    discountAmount: number;
}, {
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    taxAmount: number;
    discountAmount?: number | undefined;
}>;
export declare const OrderSchema: z.ZodObject<{
    id: z.ZodString;
    orderNumber: z.ZodString;
    customerId: z.ZodOptional<z.ZodString>;
    shopId: z.ZodString;
    cashierId: z.ZodOptional<z.ZodString>;
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        productId: z.ZodString;
        quantity: z.ZodNumber;
        unitPrice: z.ZodNumber;
        totalPrice: z.ZodNumber;
        taxAmount: z.ZodNumber;
        discountAmount: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        productId: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        taxAmount: number;
        discountAmount: number;
    }, {
        id: string;
        productId: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        taxAmount: number;
        discountAmount?: number | undefined;
    }>, "many">;
    subtotal: z.ZodNumber;
    taxAmount: z.ZodNumber;
    discountAmount: z.ZodDefault<z.ZodNumber>;
    totalAmount: z.ZodNumber;
    status: z.ZodNativeEnum<typeof OrderStatus>;
    paymentMethod: z.ZodNativeEnum<typeof PaymentMethod>;
    paymentStatus: z.ZodNativeEnum<typeof PaymentStatus>;
    isDelivery: z.ZodDefault<z.ZodBoolean>;
    deliveryAddress: z.ZodOptional<z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodString;
        pincode: z.ZodString;
        country: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        street: string;
        city: string;
        state: string;
        pincode: string;
        country: string;
    }, {
        street: string;
        city: string;
        state: string;
        pincode: string;
        country?: string | undefined;
    }>>;
    notes: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    status: OrderStatus;
    id: string;
    shopId: string;
    createdAt: Date;
    updatedAt: Date;
    taxAmount: number;
    discountAmount: number;
    orderNumber: string;
    items: {
        id: string;
        productId: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        taxAmount: number;
        discountAmount: number;
    }[];
    subtotal: number;
    totalAmount: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    isDelivery: boolean;
    customerId?: string | undefined;
    cashierId?: string | undefined;
    deliveryAddress?: {
        street: string;
        city: string;
        state: string;
        pincode: string;
        country: string;
    } | undefined;
    notes?: string | undefined;
}, {
    status: OrderStatus;
    id: string;
    shopId: string;
    createdAt: Date;
    updatedAt: Date;
    taxAmount: number;
    orderNumber: string;
    items: {
        id: string;
        productId: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        taxAmount: number;
        discountAmount?: number | undefined;
    }[];
    subtotal: number;
    totalAmount: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    discountAmount?: number | undefined;
    customerId?: string | undefined;
    cashierId?: string | undefined;
    isDelivery?: boolean | undefined;
    deliveryAddress?: {
        street: string;
        city: string;
        state: string;
        pincode: string;
        country?: string | undefined;
    } | undefined;
    notes?: string | undefined;
}>;
export declare const CustomerSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    phone: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodString;
        pincode: z.ZodString;
        country: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        street: string;
        city: string;
        state: string;
        pincode: string;
        country: string;
    }, {
        street: string;
        city: string;
        state: string;
        pincode: string;
        country?: string | undefined;
    }>>;
    loyaltyPoints: z.ZodDefault<z.ZodNumber>;
    totalSpent: z.ZodDefault<z.ZodNumber>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    isActive: boolean;
    id: string;
    phone: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    loyaltyPoints: number;
    totalSpent: number;
    email?: string | undefined;
    address?: {
        street: string;
        city: string;
        state: string;
        pincode: string;
        country: string;
    } | undefined;
}, {
    id: string;
    phone: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    isActive?: boolean | undefined;
    email?: string | undefined;
    address?: {
        street: string;
        city: string;
        state: string;
        pincode: string;
        country?: string | undefined;
    } | undefined;
    loyaltyPoints?: number | undefined;
    totalSpent?: number | undefined;
}>;
export declare const APIResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    message: z.ZodString;
    data: z.ZodOptional<z.ZodAny>;
    error: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodDefault<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    message: string;
    success: boolean;
    timestamp: Date;
    data?: any;
    error?: string | undefined;
}, {
    message: string;
    success: boolean;
    data?: any;
    error?: string | undefined;
    timestamp?: Date | undefined;
}>;
export declare enum BarcodeFormat {
    EAN_13 = "EAN_13",
    EAN_8 = "EAN_8",
    UPC_A = "UPC_A",
    UPC_E = "UPC_E",
    CODE_128 = "CODE_128",
    CODE_39 = "CODE_39",
    QR_CODE = "QR_CODE"
}
export declare const ScanResultSchema: z.ZodObject<{
    barcode: z.ZodString;
    format: z.ZodNativeEnum<typeof BarcodeFormat>;
    timestamp: z.ZodDate;
    confidence: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    barcode: string;
    timestamp: Date;
    format: BarcodeFormat;
    confidence?: number | undefined;
}, {
    barcode: string;
    timestamp: Date;
    format: BarcodeFormat;
    confidence?: number | undefined;
}>;
export declare enum NotificationType {
    ORDER_PLACED = "ORDER_PLACED",
    PAYMENT_SUCCESS = "PAYMENT_SUCCESS",
    PAYMENT_FAILED = "PAYMENT_FAILED",
    LOW_STOCK = "LOW_STOCK",
    SYSTEM_ALERT = "SYSTEM_ALERT",
    PROMOTION = "PROMOTION"
}
export declare const NotificationSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodNativeEnum<typeof NotificationType>;
    title: z.ZodString;
    message: z.ZodString;
    userId: z.ZodString;
    shopId: z.ZodOptional<z.ZodString>;
    isRead: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    type: NotificationType;
    message: string;
    id: string;
    createdAt: Date;
    title: string;
    userId: string;
    isRead: boolean;
    shopId?: string | undefined;
}, {
    type: NotificationType;
    message: string;
    id: string;
    createdAt: Date;
    title: string;
    userId: string;
    shopId?: string | undefined;
    isRead?: boolean | undefined;
}>;
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
//# sourceMappingURL=types.d.ts.map