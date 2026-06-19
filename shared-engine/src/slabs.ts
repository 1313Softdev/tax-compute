import { TaxRegimeConfig, TaxSlab } from './types';

// Helper to determine age of a person as of the end of the financial year
export function calculateAge(dobString: string, assessmentYear: string): number {
  if (!dobString) return 30; // Default fallback age
  
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return 30;

  // For AY 2024-25, the FY ends on March 31, 2024
  const ayStartYear = parseInt(assessmentYear.split('-')[0], 10);
  const fyEndYear = ayStartYear - 1; // e.g. 2024 for AY 2024-25
  const fyEndDate = new Date(fyEndYear, 2, 31); // March 31 of fyEndYear

  let age = fyEndDate.getFullYear() - dob.getFullYear();
  const m = fyEndDate.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && fyEndDate.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

// Generates Old Regime config dynamically based on user's age
export function getOldRegimeConfig(age: number): TaxRegimeConfig {
  let basicExemption = 250000;
  let slabs: TaxSlab[] = [];

  if (age >= 80) {
    // Super Senior Citizen (80+)
    basicExemption = 500000;
    slabs = [
      { minLimit: 0, maxLimit: 500000, rate: 0 },
      { minLimit: 500000, maxLimit: 1000000, rate: 20 },
      { minLimit: 1000000, maxLimit: null, rate: 30 }
    ];
  } else if (age >= 60) {
    // Senior Citizen (60-79)
    basicExemption = 300000;
    slabs = [
      { minLimit: 0, maxLimit: 300000, rate: 0 },
      { minLimit: 300000, maxLimit: 500000, rate: 5 },
      { minLimit: 500000, maxLimit: 1000000, rate: 20 },
      { minLimit: 1000000, maxLimit: null, rate: 30 }
    ];
  } else {
    // Individual (<60)
    basicExemption = 250000;
    slabs = [
      { minLimit: 0, maxLimit: 250000, rate: 0 },
      { minLimit: 250000, maxLimit: 500000, rate: 5 },
      { minLimit: 500000, maxLimit: 1000000, rate: 20 },
      { minLimit: 1000000, maxLimit: null, rate: 30 }
    ];
  }

  return {
    slabs,
    standardDeduction: 50000,
    rebateLimit: 500000,
    maxRebate: 12500,
    enableDeductions: true,
    hraExemptionAllowed: true
  };
}

// New Regime configs for different Assessment Years
export function getNewRegimeConfig(assessmentYear: string): TaxRegimeConfig {
  if (assessmentYear === '2024-25') {
    // AY 2024-25 New Regime slabs (FY 2023-24)
    return {
      slabs: [
        { minLimit: 0, maxLimit: 300000, rate: 0 },
        { minLimit: 300000, maxLimit: 600000, rate: 5 },
        { minLimit: 600000, maxLimit: 900000, rate: 10 },
        { minLimit: 900000, maxLimit: 1200000, rate: 15 },
        { minLimit: 1200000, maxLimit: 1500000, rate: 20 },
        { minLimit: 1500000, maxLimit: null, rate: 30 }
      ],
      standardDeduction: 50000,
      rebateLimit: 700000,
      maxRebate: 25000, // For 7L income in AY 24-25, tax is: 3-6L @ 5% (15k) + 6-7L @ 10% (10k) = 25k. Rebate u/s 87A = 25k.
      enableDeductions: false,
      hraExemptionAllowed: false
    };
  } else if (assessmentYear === '2025-26') {
    // AY 2025-26 New Regime slabs (Budget 2024 revisions for FY 2024-25)
    // Slabs: 0-3L (0%), 3-7L (5%), 7-10L (10%), 10-12L (15%), 12-15L (20%), >15L (30%)
    return {
      slabs: [
        { minLimit: 0, maxLimit: 300000, rate: 0 },
        { minLimit: 300000, maxLimit: 700000, rate: 5 },
        { minLimit: 700000, maxLimit: 1000000, rate: 10 },
        { minLimit: 1000000, maxLimit: 1200000, rate: 15 },
        { minLimit: 1200000, maxLimit: 1500000, rate: 20 },
        { minLimit: 1500000, maxLimit: null, rate: 30 }
      ],
      standardDeduction: 75000, // Raised to 75,000 in Budget 2024
      rebateLimit: 700000,
      maxRebate: 20000, // For 7L income: 3-7L @ 5% = 20k.
      enableDeductions: false,
      hraExemptionAllowed: false
    };
  } else {
    // AY 2026-27 and later New Regime slabs (Budget 2025 revisions for FY 2025-26)
    // Slabs: 0-4L (0%), 4-8L (5%), 8-12L (10%), 12-16L (15%), 16-20L (20%), 20-24L (25%), >24L (30%)
    return {
      slabs: [
        { minLimit: 0, maxLimit: 400000, rate: 0 },
        { minLimit: 400000, maxLimit: 800000, rate: 5 },
        { minLimit: 800000, maxLimit: 1200000, rate: 10 },
        { minLimit: 1200000, maxLimit: 1600000, rate: 15 },
        { minLimit: 1600000, maxLimit: 2000000, rate: 20 },
        { minLimit: 2000000, maxLimit: 2400000, rate: 25 },
        { minLimit: 2400000, maxLimit: null, rate: 30 }
      ],
      standardDeduction: 75000, // Maintained at 75,000 in Budget 2025
      rebateLimit: 1200000,     // Rebate limit raised to 12L in Budget 2025
      maxRebate: 60000,         // For 12L income: 4-8L @ 5% (20k) + 8-12L @ 10% (40k) = 60k
      enableDeductions: false,
      hraExemptionAllowed: false
    };
  }
}

// Calculate surcharge based on net taxable income and regime
export function calculateSurcharge(netTaxableIncome: number, regime: 'Old' | 'New'): number {
  // Surcharge slabs:
  // Income 50L - 1Cr: 10%
  // Income 1Cr - 2Cr: 15%
  // Income 2Cr - 5Cr: Old Regime = 25%, New Regime = 25%
  // Income > 5Cr: Old Regime = 37%, New Regime = 25% (Capped at 25% under New Regime)
  
  if (netTaxableIncome <= 5000000) return 0;
  
  if (netTaxableIncome > 5000000 && netTaxableIncome <= 10000000) {
    return 0.10;
  }
  if (netTaxableIncome > 10000000 && netTaxableIncome <= 20000000) {
    return 0.15;
  }
  if (netTaxableIncome > 20000000 && netTaxableIncome <= 50000000) {
    return 0.25;
  }
  
  // Above 5 Crore
  if (regime === 'New') {
    return 0.25; // Capped at 25% in new regime u/s 115BAC
  } else {
    return 0.37;
  }
}
