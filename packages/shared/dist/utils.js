"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONSTANTS = exports.StorageUtils = exports.SearchUtils = exports.FormatUtils = exports.ValidationUtils = exports.OrderUtils = exports.GSTCalculator = void 0;
// Utility functions for the EazyQue platform
const date_fns_1 = require("date-fns");
const types_1 = require("./types");
// ============ GST Calculation Utilities ============
class GSTCalculator {
    /**
     * Calculate GST breakdown for intrastate transactions (CGST + SGST)
     */
    static calculateIntrastateTax(amount, gstRate) {
        const halfRate = gstRate / 2;
        const cgstAmount = (amount * halfRate) / 100;
        const sgstAmount = (amount * halfRate) / 100;
        return [
            { type: types_1.TaxType.CGST, rate: halfRate, amount: cgstAmount },
            { type: types_1.TaxType.SGST, rate: halfRate, amount: sgstAmount }
        ];
    }
    /**
     * Calculate GST for interstate transactions (IGST)
     */
    static calculateInterstateTax(amount, gstRate) {
        const igstAmount = (amount * gstRate) / 100;
        return [
            { type: types_1.TaxType.IGST, rate: gstRate, amount: igstAmount }
        ];
    }
    /**
     * Calculate tax based on state comparison
     */
    static calculateTax(amount, gstRate, sourceState, targetState) {
        const isIntrastate = sourceState.toLowerCase() === targetState.toLowerCase();
        return isIntrastate
            ? this.calculateIntrastateTax(amount, gstRate)
            : this.calculateInterstateTax(amount, gstRate);
    }
    /**
     * Calculate inclusive price (price with GST included)
     */
    static calculateInclusivePrice(basePrice, gstRate) {
        return basePrice * (1 + gstRate / 100);
    }
    /**
     * Calculate exclusive price (price without GST)
     */
    static calculateExclusivePrice(inclusivePrice, gstRate) {
        return inclusivePrice / (1 + gstRate / 100);
    }
    /**
     * Calculate total tax amount from tax array
     */
    static getTotalTaxAmount(taxes) {
        return taxes.reduce((total, tax) => total + tax.amount, 0);
    }
}
exports.GSTCalculator = GSTCalculator;
// ============ Order Utilities ============
class OrderUtils {
    /**
     * Generate order number with timestamp
     */
    static generateOrderNumber(shopId) {
        const timestamp = Date.now().toString();
        const shopPrefix = shopId.slice(-4).toUpperCase();
        return `ORD-${shopPrefix}-${timestamp}`;
    }
    /**
     * Calculate order totals including tax and discount
     */
    static calculateOrderTotals(items, additionalDiscount = 0) {
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const totalTax = items.reduce((sum, item) => sum + item.taxAmount, 0);
        const totalDiscount = items.reduce((sum, item) => sum + item.discountAmount, 0) + additionalDiscount;
        const finalAmount = subtotal + totalTax - totalDiscount;
        return {
            subtotal,
            totalTax,
            totalDiscount,
            finalAmount: Math.max(0, finalAmount) // Ensure non-negative
        };
    }
}
exports.OrderUtils = OrderUtils;
// ============ Validation Utilities ============
class ValidationUtils {
    /**
     * Validate Indian GST number
     */
    static isValidGSTNumber(gstin) {
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        return gstRegex.test(gstin);
    }
    /**
     * Validate Indian PAN number
     */
    static isValidPAN(pan) {
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        return panRegex.test(pan);
    }
    /**
     * Validate Indian phone number
     */
    static isValidPhoneNumber(phone) {
        const phoneRegex = /^[6-9]\d{9}$/;
        return phoneRegex.test(phone.replace(/\D/g, ''));
    }
    /**
     * Validate Indian pincode
     */
    static isValidPincode(pincode) {
        const pincodeRegex = /^[1-9][0-9]{5}$/;
        return pincodeRegex.test(pincode);
    }
    /**
     * Validate HSN code
     */
    static isValidHSNCode(hsn) {
        const hsnRegex = /^[0-9]{4,8}$/;
        return hsnRegex.test(hsn);
    }
}
exports.ValidationUtils = ValidationUtils;
// ============ Formatting Utilities ============
class FormatUtils {
    /**
     * Format currency in Indian format
     */
    static formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount);
    }
    /**
     * Format number in Indian numbering system
     */
    static formatIndianNumber(num) {
        return new Intl.NumberFormat('en-IN').format(num);
    }
    /**
     * Format date for Indian timezone
     */
    static formatDate(date, formatStr = 'dd/MM/yyyy') {
        const dateObj = typeof date === 'string' ? (0, date_fns_1.parseISO)(date) : date;
        return (0, date_fns_1.isValid)(dateObj) ? (0, date_fns_1.format)(dateObj, formatStr) : '';
    }
    /**
     * Format time for Indian timezone
     */
    static formatTime(date) {
        const dateObj = typeof date === 'string' ? (0, date_fns_1.parseISO)(date) : date;
        return (0, date_fns_1.isValid)(dateObj) ? (0, date_fns_1.format)(dateObj, 'HH:mm:ss') : '';
    }
    /**
     * Format phone number for display
     */
    static formatPhoneNumber(phone) {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 10) {
            return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
        }
        return phone;
    }
    /**
     * Format GST number for display
     */
    static formatGSTNumber(gstin) {
        if (gstin.length === 15) {
            return `${gstin.slice(0, 2)}-${gstin.slice(2, 7)}-${gstin.slice(7, 11)}-${gstin.slice(11, 12)}-${gstin.slice(12, 13)}-${gstin.slice(13, 14)}-${gstin.slice(14)}`;
        }
        return gstin;
    }
}
exports.FormatUtils = FormatUtils;
// ============ Search & Filter Utilities ============
class SearchUtils {
    /**
     * Fuzzy search implementation
     */
    static fuzzySearch(query, text) {
        const queryLower = query.toLowerCase();
        const textLower = text.toLowerCase();
        let queryIndex = 0;
        for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
            if (textLower[i] === queryLower[queryIndex]) {
                queryIndex++;
            }
        }
        return queryIndex === queryLower.length;
    }
    /**
     * Filter array by search query
     */
    static filterByQuery(items, query, searchFields) {
        if (!query.trim())
            return items;
        return items.filter(item => searchFields.some(field => {
            const value = String(item[field]);
            return this.fuzzySearch(query, value);
        }));
    }
}
exports.SearchUtils = SearchUtils;
// ============ Storage Utilities ============
class StorageUtils {
    /**
     * Safe JSON parse with fallback
     */
    static safeJsonParse(json, fallback) {
        try {
            return JSON.parse(json);
        }
        catch {
            return fallback;
        }
    }
    /**
     * Safe JSON stringify
     */
    static safeJsonStringify(obj) {
        try {
            return JSON.stringify(obj);
        }
        catch {
            return '{}';
        }
    }
    /**
     * Get item from localStorage with type safety
     */
    static getLocalStorageItem(key, fallback) {
        if (typeof window === 'undefined')
            return fallback;
        try {
            const item = localStorage.getItem(key);
            return item ? this.safeJsonParse(item, fallback) : fallback;
        }
        catch {
            return fallback;
        }
    }
    /**
     * Set item in localStorage
     */
    static setLocalStorageItem(key, value) {
        if (typeof window === 'undefined')
            return false;
        try {
            localStorage.setItem(key, this.safeJsonStringify(value));
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.StorageUtils = StorageUtils;
// ============ Constants ============
exports.CONSTANTS = {
    // GST Rates
    GST_RATES: [0, 5, 12, 18, 28],
    // Indian States
    INDIAN_STATES: [
        'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
        'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
        'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
        'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
        'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
        'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
        'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
    ],
    // Default pagination
    PAGINATION: {
        DEFAULT_PAGE_SIZE: 20,
        MAX_PAGE_SIZE: 100
    },
    // File upload limits
    UPLOAD_LIMITS: {
        MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
        ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp']
    },
    // API timeouts - Optimized for better performance
    API_TIMEOUTS: {
        DEFAULT: 15000, // 15 seconds (reduced from 30)
        UPLOAD: 45000, // 45 seconds (reduced from 60)
        PAYMENT: 30000 // 30 seconds (reduced from 45)
    }
};
//# sourceMappingURL=utils.js.map