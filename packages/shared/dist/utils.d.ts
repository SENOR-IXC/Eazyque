import { GSTRate, Tax } from './types';
export declare class GSTCalculator {
    /**
     * Calculate GST breakdown for intrastate transactions (CGST + SGST)
     */
    static calculateIntrastateTax(amount: number, gstRate: GSTRate): Tax[];
    /**
     * Calculate GST for interstate transactions (IGST)
     */
    static calculateInterstateTax(amount: number, gstRate: GSTRate): Tax[];
    /**
     * Calculate tax based on state comparison
     */
    static calculateTax(amount: number, gstRate: GSTRate, sourceState: string, targetState: string): Tax[];
    /**
     * Calculate inclusive price (price with GST included)
     */
    static calculateInclusivePrice(basePrice: number, gstRate: GSTRate): number;
    /**
     * Calculate exclusive price (price without GST)
     */
    static calculateExclusivePrice(inclusivePrice: number, gstRate: GSTRate): number;
    /**
     * Calculate total tax amount from tax array
     */
    static getTotalTaxAmount(taxes: Tax[]): number;
}
export declare class OrderUtils {
    /**
     * Generate order number with timestamp
     */
    static generateOrderNumber(shopId: string): string;
    /**
     * Calculate order totals including tax and discount
     */
    static calculateOrderTotals(items: Array<{
        quantity: number;
        unitPrice: number;
        taxAmount: number;
        discountAmount: number;
    }>, additionalDiscount?: number): {
        subtotal: number;
        totalTax: number;
        totalDiscount: number;
        finalAmount: number;
    };
}
export declare class ValidationUtils {
    /**
     * Validate Indian GST number
     */
    static isValidGSTNumber(gstin: string): boolean;
    /**
     * Validate Indian PAN number
     */
    static isValidPAN(pan: string): boolean;
    /**
     * Validate Indian phone number
     */
    static isValidPhoneNumber(phone: string): boolean;
    /**
     * Validate Indian pincode
     */
    static isValidPincode(pincode: string): boolean;
    /**
     * Validate HSN code
     */
    static isValidHSNCode(hsn: string): boolean;
}
export declare class FormatUtils {
    /**
     * Format currency in Indian format
     */
    static formatCurrency(amount: number): string;
    /**
     * Format number in Indian numbering system
     */
    static formatIndianNumber(num: number): string;
    /**
     * Format date for Indian timezone
     */
    static formatDate(date: Date | string, formatStr?: string): string;
    /**
     * Format time for Indian timezone
     */
    static formatTime(date: Date | string): string;
    /**
     * Format phone number for display
     */
    static formatPhoneNumber(phone: string): string;
    /**
     * Format GST number for display
     */
    static formatGSTNumber(gstin: string): string;
}
export declare class SearchUtils {
    /**
     * Fuzzy search implementation
     */
    static fuzzySearch(query: string, text: string): boolean;
    /**
     * Filter array by search query
     */
    static filterByQuery<T>(items: T[], query: string, searchFields: (keyof T)[]): T[];
}
export declare class StorageUtils {
    /**
     * Safe JSON parse with fallback
     */
    static safeJsonParse<T>(json: string, fallback: T): T;
    /**
     * Safe JSON stringify
     */
    static safeJsonStringify(obj: any): string;
    /**
     * Get item from localStorage with type safety
     */
    static getLocalStorageItem<T>(key: string, fallback: T): T;
    /**
     * Set item in localStorage
     */
    static setLocalStorageItem(key: string, value: any): boolean;
}
export declare const CONSTANTS: {
    readonly GST_RATES: readonly [0, 5, 12, 18, 28];
    readonly INDIAN_STATES: readonly ["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"];
    readonly PAGINATION: {
        readonly DEFAULT_PAGE_SIZE: 20;
        readonly MAX_PAGE_SIZE: 100;
    };
    readonly UPLOAD_LIMITS: {
        readonly MAX_FILE_SIZE: number;
        readonly ALLOWED_IMAGE_TYPES: readonly ["image/jpeg", "image/png", "image/webp"];
    };
    readonly API_TIMEOUTS: {
        readonly DEFAULT: 15000;
        readonly UPLOAD: 45000;
        readonly PAYMENT: 30000;
    };
};
//# sourceMappingURL=utils.d.ts.map