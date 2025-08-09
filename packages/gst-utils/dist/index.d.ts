import { GSTRate } from '@eazyque/shared';
export interface HSNCodeEntry {
    code: string;
    description: string;
    gstRate: GSTRate;
    chapter: string;
    section: string;
}
export declare const HSN_DATABASE: HSNCodeEntry[];
export declare class GSTValidator {
    /**
     * Validate GST number format and checksum
     */
    static validateGSTIN(gstin: string): {
        isValid: boolean;
        error?: string;
    };
    /**
     * Validate GST checksum (simplified version)
     */
    private static validateGSTChecksum;
    /**
     * Extract state code from GST number
     */
    static getStateCodeFromGSTIN(gstin: string): string | null;
    /**
     * Check if transaction is interstate
     */
    static isInterstateTransaction(sellerGSTIN: string, buyerGSTIN: string): boolean;
}
export declare class HSNUtils {
    /**
     * Search HSN codes by description
     */
    static searchByDescription(query: string): HSNCodeEntry[];
    /**
     * Get HSN entry by code
     */
    static getByCode(code: string): HSNCodeEntry | null;
    /**
     * Get all HSN codes for a chapter
     */
    static getByChapter(chapter: string): HSNCodeEntry[];
    /**
     * Validate HSN code format
     */
    static validateHSNCode(code: string): boolean;
    /**
     * Get suggested HSN codes based on product name
     */
    static getSuggestions(productName: string): HSNCodeEntry[];
}
export interface GSTReportData {
    period: string;
    gstin: string;
    legalName: string;
    transactions: Array<{
        invoiceNumber: string;
        date: string;
        customerGSTIN?: string;
        customerName: string;
        hsnCode: string;
        taxableValue: number;
        cgstRate: number;
        cgstAmount: number;
        sgstRate: number;
        sgstAmount: number;
        igstRate: number;
        igstAmount: number;
        totalTax: number;
        totalValue: number;
    }>;
}
export declare class GSTReportGenerator {
    /**
     * Generate GSTR-1 summary data
     */
    static generateGSTR1Summary(data: GSTReportData): {
        totalTaxableValue: number;
        totalCGST: number;
        totalSGST: number;
        totalIGST: number;
        totalTax: number;
        totalInvoiceValue: number;
        b2bInvoices: number;
        b2cInvoices: number;
    };
    /**
     * Generate tax rate wise summary
     */
    static generateTaxRateWiseSummary(data: GSTReportData): {
        rate: number;
        taxableValue: number;
        cgstAmount: number;
        sgstAmount: number;
        igstAmount: number;
        totalTax: number;
    }[];
    /**
     * Generate HSN-wise summary
     */
    static generateHSNWiseSummary(data: GSTReportData): {
        hsnCode: string;
        description: string;
        quantity: number;
        totalValue: number;
        taxableValue: number;
        totalTax: number;
    }[];
}
export declare class GSTReturnUtils {
    /**
     * Validate return period format (MMYYYY)
     */
    static validateReturnPeriod(period: string): boolean;
    /**
     * Get due date for GST return filing
     */
    static getReturnDueDate(period: string, returnType: 'GSTR1' | 'GSTR3B'): Date | null;
    /**
     * Check if return filing is overdue
     */
    static isReturnOverdue(period: string, returnType: 'GSTR1' | 'GSTR3B'): boolean;
}
export declare const GST_CONSTANTS: {
    readonly GST_RATES: readonly [0, 5, 12, 18, 28];
    readonly STATE_CODES: {
        readonly '01': "Jammu and Kashmir";
        readonly '02': "Himachal Pradesh";
        readonly '03': "Punjab";
        readonly '04': "Chandigarh";
        readonly '05': "Uttarakhand";
        readonly '06': "Haryana";
        readonly '07': "Delhi";
        readonly '08': "Rajasthan";
        readonly '09': "Uttar Pradesh";
        readonly '10': "Bihar";
        readonly '11': "Sikkim";
        readonly '12': "Arunachal Pradesh";
        readonly '13': "Nagaland";
        readonly '14': "Manipur";
        readonly '15': "Mizoram";
        readonly '16': "Tripura";
        readonly '17': "Meghalaya";
        readonly '18': "Assam";
        readonly '19': "West Bengal";
        readonly '20': "Jharkhand";
        readonly '21': "Odisha";
        readonly '22': "Chhattisgarh";
        readonly '23': "Madhya Pradesh";
        readonly '24': "Gujarat";
        readonly '25': "Daman and Diu";
        readonly '26': "Dadra and Nagar Haveli";
        readonly '27': "Maharashtra";
        readonly '29': "Karnataka";
        readonly '30': "Goa";
        readonly '31': "Lakshadweep";
        readonly '32': "Kerala";
        readonly '33': "Tamil Nadu";
        readonly '34': "Puducherry";
        readonly '35': "Andaman and Nicobar Islands";
        readonly '36': "Telangana";
        readonly '37': "Andhra Pradesh";
        readonly '38': "Ladakh";
    };
    readonly RETURN_DUE_DATES: {
        readonly GSTR1: 11;
        readonly GSTR3B: 20;
    };
};
//# sourceMappingURL=index.d.ts.map