// GST Utilities for Indian tax compliance
import { z } from 'zod';
import { GSTRate, TaxType } from '@eazyque/shared';

// ============ HSN Code Database ============
export interface HSNCodeEntry {
  code: string;
  description: string;
  gstRate: GSTRate;
  chapter: string;
  section: string;
}

// Sample HSN codes for common retail items
export const HSN_DATABASE: HSNCodeEntry[] = [
  // Food items
  { code: '1006', description: 'Rice', gstRate: GSTRate.FIVE, chapter: '10', section: 'II' },
  { code: '1101', description: 'Wheat flour', gstRate: GSTRate.FIVE, chapter: '11', section: 'II' },
  { code: '1701', description: 'Sugar', gstRate: GSTRate.FIVE, chapter: '17', section: 'III' },
  { code: '1507', description: 'Edible oils', gstRate: GSTRate.FIVE, chapter: '15', section: 'III' },
  
  // Dairy products
  { code: '0401', description: 'Milk', gstRate: GSTRate.FIVE, chapter: '04', section: 'I' },
  { code: '0405', description: 'Butter', gstRate: GSTRate.FIVE, chapter: '04', section: 'I' },
  { code: '0406', description: 'Cheese', gstRate: GSTRate.TWELVE, chapter: '04', section: 'I' },
  
  // Beverages
  { code: '2202', description: 'Soft drinks', gstRate: GSTRate.TWELVE, chapter: '22', section: 'IV' },
  { code: '2101', description: 'Tea/Coffee', gstRate: GSTRate.FIVE, chapter: '21', section: 'IV' },
  
  // Personal care
  { code: '3401', description: 'Soap', gstRate: GSTRate.EIGHTEEN, chapter: '34', section: 'VI' },
  { code: '3305', description: 'Shampoo', gstRate: GSTRate.EIGHTEEN, chapter: '33', section: 'VI' },
  { code: '3401', description: 'Toothpaste', gstRate: GSTRate.EIGHTEEN, chapter: '34', section: 'VI' },
  
  // Household items
  { code: '3924', description: 'Plastic containers', gstRate: GSTRate.TWELVE, chapter: '39', section: 'VII' },
  { code: '6802', description: 'Cleaning products', gstRate: GSTRate.EIGHTEEN, chapter: '68', section: 'XIII' },
  
  // Electronics
  { code: '8517', description: 'Mobile phones', gstRate: GSTRate.EIGHTEEN, chapter: '85', section: 'XVI' },
  { code: '8471', description: 'Computers', gstRate: GSTRate.EIGHTEEN, chapter: '84', section: 'XVI' },
  
  // Textiles
  { code: '6109', description: 'T-shirts', gstRate: GSTRate.TWELVE, chapter: '61', section: 'XI' },
  { code: '6203', description: 'Shirts', gstRate: GSTRate.TWELVE, chapter: '62', section: 'XI' },
  
  // Medicines
  { code: '3004', description: 'Medicines', gstRate: GSTRate.FIVE, chapter: '30', section: 'VI' },
  
  // Snacks & Confectionery
  { code: '1905', description: 'Biscuits', gstRate: GSTRate.EIGHTEEN, chapter: '19', section: 'IV' },
  { code: '1704', description: 'Chocolates', gstRate: GSTRate.EIGHTEEN, chapter: '17', section: 'IV' },
  { code: '2005', description: 'Pickles', gstRate: GSTRate.TWELVE, chapter: '20', section: 'IV' }
];

// ============ GST Validation ============
export class GSTValidator {
  /**
   * Validate GST number format and checksum
   */
  static validateGSTIN(gstin: string): { isValid: boolean; error?: string } {
    if (!gstin || gstin.length !== 15) {
      return { isValid: false, error: 'GST number must be 15 characters long' };
    }

    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(gstin)) {
      return { isValid: false, error: 'Invalid GST number format' };
    }

    // Basic checksum validation
    if (!this.validateGSTChecksum(gstin)) {
      return { isValid: false, error: 'Invalid GST number checksum' };
    }

    return { isValid: true };
  }

  /**
   * Validate GST checksum (simplified version)
   */
  private static validateGSTChecksum(gstin: string): boolean {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const factors = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
    
    let sum = 0;
    for (let i = 0; i < 14; i++) {
      const charIndex = chars.indexOf(gstin[i]);
      if (charIndex === -1) return false;
      
      const product = charIndex * factors[i];
      sum += Math.floor(product / 36) + (product % 36);
    }
    
    const checksum = (36 - (sum % 36)) % 36;
    return chars[checksum] === gstin[14];
  }

  /**
   * Extract state code from GST number
   */
  static getStateCodeFromGSTIN(gstin: string): string | null {
    if (!this.validateGSTIN(gstin).isValid) return null;
    return gstin.substring(0, 2);
  }

  /**
   * Check if transaction is interstate
   */
  static isInterstateTransaction(sellerGSTIN: string, buyerGSTIN: string): boolean {
    const sellerState = this.getStateCodeFromGSTIN(sellerGSTIN);
    const buyerState = this.getStateCodeFromGSTIN(buyerGSTIN);
    
    if (!sellerState || !buyerState) return false;
    return sellerState !== buyerState;
  }
}

// ============ HSN Code Utils ============
export class HSNUtils {
  /**
   * Search HSN codes by description
   */
  static searchByDescription(query: string): HSNCodeEntry[] {
    const searchTerm = query.toLowerCase();
    return HSN_DATABASE.filter(entry => 
      entry.description.toLowerCase().includes(searchTerm) ||
      entry.code.includes(query)
    );
  }

  /**
   * Get HSN entry by code
   */
  static getByCode(code: string): HSNCodeEntry | null {
    return HSN_DATABASE.find(entry => entry.code === code) || null;
  }

  /**
   * Get all HSN codes for a chapter
   */
  static getByChapter(chapter: string): HSNCodeEntry[] {
    return HSN_DATABASE.filter(entry => entry.chapter === chapter);
  }

  /**
   * Validate HSN code format
   */
  static validateHSNCode(code: string): boolean {
    return /^[0-9]{4,8}$/.test(code);
  }

  /**
   * Get suggested HSN codes based on product name
   */
  static getSuggestions(productName: string): HSNCodeEntry[] {
    const keywords = productName.toLowerCase().split(' ');
    const matches = new Set<HSNCodeEntry>();

    keywords.forEach(keyword => {
      HSN_DATABASE.forEach(entry => {
        if (entry.description.toLowerCase().includes(keyword)) {
          matches.add(entry);
        }
      });
    });

    return Array.from(matches);
  }
}

// ============ GST Report Generation ============
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

export class GSTReportGenerator {
  /**
   * Generate GSTR-1 summary data
   */
  static generateGSTR1Summary(data: GSTReportData) {
    const summary = {
      totalTaxableValue: 0,
      totalCGST: 0,
      totalSGST: 0,
      totalIGST: 0,
      totalTax: 0,
      totalInvoiceValue: 0,
      b2bInvoices: 0,
      b2cInvoices: 0
    };

    data.transactions.forEach(transaction => {
      summary.totalTaxableValue += transaction.taxableValue;
      summary.totalCGST += transaction.cgstAmount;
      summary.totalSGST += transaction.sgstAmount;
      summary.totalIGST += transaction.igstAmount;
      summary.totalTax += transaction.totalTax;
      summary.totalInvoiceValue += transaction.totalValue;

      if (transaction.customerGSTIN) {
        summary.b2bInvoices++;
      } else {
        summary.b2cInvoices++;
      }
    });

    return summary;
  }

  /**
   * Generate tax rate wise summary
   */
  static generateTaxRateWiseSummary(data: GSTReportData) {
    const rateWiseSummary = new Map<number, {
      rate: number;
      taxableValue: number;
      cgstAmount: number;
      sgstAmount: number;
      igstAmount: number;
      totalTax: number;
    }>();

    data.transactions.forEach(transaction => {
      const rate = transaction.cgstRate > 0 ? transaction.cgstRate * 2 : transaction.igstRate;
      
      if (!rateWiseSummary.has(rate)) {
        rateWiseSummary.set(rate, {
          rate,
          taxableValue: 0,
          cgstAmount: 0,
          sgstAmount: 0,
          igstAmount: 0,
          totalTax: 0
        });
      }

      const summary = rateWiseSummary.get(rate)!;
      summary.taxableValue += transaction.taxableValue;
      summary.cgstAmount += transaction.cgstAmount;
      summary.sgstAmount += transaction.sgstAmount;
      summary.igstAmount += transaction.igstAmount;
      summary.totalTax += transaction.totalTax;
    });

    return Array.from(rateWiseSummary.values()).sort((a, b) => a.rate - b.rate);
  }

  /**
   * Generate HSN-wise summary
   */
  static generateHSNWiseSummary(data: GSTReportData) {
    const hsnWiseSummary = new Map<string, {
      hsnCode: string;
      description: string;
      quantity: number;
      totalValue: number;
      taxableValue: number;
      totalTax: number;
    }>();

    data.transactions.forEach(transaction => {
      if (!hsnWiseSummary.has(transaction.hsnCode)) {
        const hsnEntry = HSNUtils.getByCode(transaction.hsnCode);
        hsnWiseSummary.set(transaction.hsnCode, {
          hsnCode: transaction.hsnCode,
          description: hsnEntry?.description || 'Unknown',
          quantity: 0,
          totalValue: 0,
          taxableValue: 0,
          totalTax: 0
        });
      }

      const summary = hsnWiseSummary.get(transaction.hsnCode)!;
      summary.quantity += 1; // This should be actual quantity from transaction
      summary.totalValue += transaction.totalValue;
      summary.taxableValue += transaction.taxableValue;
      summary.totalTax += transaction.totalTax;
    });

    return Array.from(hsnWiseSummary.values());
  }
}

// ============ GST Return Filing Utils ============
export class GSTReturnUtils {
  /**
   * Validate return period format (MMYYYY)
   */
  static validateReturnPeriod(period: string): boolean {
    return /^(0[1-9]|1[0-2])[0-9]{4}$/.test(period);
  }

  /**
   * Get due date for GST return filing
   */
  static getReturnDueDate(period: string, returnType: 'GSTR1' | 'GSTR3B'): Date | null {
    if (!this.validateReturnPeriod(period)) return null;

    const month = parseInt(period.substring(0, 2));
    const year = parseInt(period.substring(2));

    // Calculate due date based on return type
    let dueDay: number;
    switch (returnType) {
      case 'GSTR1':
        dueDay = 11; // 11th of following month
        break;
      case 'GSTR3B':
        dueDay = 20; // 20th of following month
        break;
      default:
        return null;
    }

    // Get next month
    let dueMonth = month + 1;
    let dueYear = year;
    if (dueMonth > 12) {
      dueMonth = 1;
      dueYear++;
    }

    return new Date(dueYear, dueMonth - 1, dueDay);
  }

  /**
   * Check if return filing is overdue
   */
  static isReturnOverdue(period: string, returnType: 'GSTR1' | 'GSTR3B'): boolean {
    const dueDate = this.getReturnDueDate(period, returnType);
    if (!dueDate) return false;

    return new Date() > dueDate;
  }
}

// ============ Constants ============
export const GST_CONSTANTS = {
  // Standard GST rates
  GST_RATES: [0, 5, 12, 18, 28] as const,
  
  // State codes for GST
  STATE_CODES: {
    '01': 'Jammu and Kashmir',
    '02': 'Himachal Pradesh',
    '03': 'Punjab',
    '04': 'Chandigarh',
    '05': 'Uttarakhand',
    '06': 'Haryana',
    '07': 'Delhi',
    '08': 'Rajasthan',
    '09': 'Uttar Pradesh',
    '10': 'Bihar',
    '11': 'Sikkim',
    '12': 'Arunachal Pradesh',
    '13': 'Nagaland',
    '14': 'Manipur',
    '15': 'Mizoram',
    '16': 'Tripura',
    '17': 'Meghalaya',
    '18': 'Assam',
    '19': 'West Bengal',
    '20': 'Jharkhand',
    '21': 'Odisha',
    '22': 'Chhattisgarh',
    '23': 'Madhya Pradesh',
    '24': 'Gujarat',
    '25': 'Daman and Diu',
    '26': 'Dadra and Nagar Haveli',
    '27': 'Maharashtra',
    '29': 'Karnataka',
    '30': 'Goa',
    '31': 'Lakshadweep',
    '32': 'Kerala',
    '33': 'Tamil Nadu',
    '34': 'Puducherry',
    '35': 'Andaman and Nicobar Islands',
    '36': 'Telangana',
    '37': 'Andhra Pradesh',
    '38': 'Ladakh'
  } as const,
  
  // Return filing dates
  RETURN_DUE_DATES: {
    GSTR1: 11,
    GSTR3B: 20
  } as const
} as const;
