import { test } from 'node:test';
import assert from 'node:assert';
import { calculateRegimeTax, compareRegimes } from '../src/calculations';
import { TaxComputationInputs } from '../src/types';

// Helper to create a base mock input
function createMockInput(overrides: Partial<TaxComputationInputs> = {}): TaxComputationInputs {
  return {
    assessmentYear: '2024-25',
    fullName: 'Jane Doe',
    panNumber: 'ABCDE1234F',
    dateOfBirth: '1990-01-01', // Age 34 u/s FY 2023-24
    gender: 'Female',
    residentialStatus: 'Resident',
    salary: {
      basicSalary: 0,
      hra: 0,
      da: 0,
      bonus: 0,
      commission: 0,
      otherAllowances: 0,
      perquisites: 0,
      professionalTax: 0
    },
    houseProperty: {
      isSelfOccupied: true,
      rentalIncome: 0,
      municipalTaxes: 0,
      housingLoanInterest: 0
    },
    business: {
      grossReceipts: 0,
      expenses: 0,
      depreciation: 0
    },
    capitalGains: {
      shortTermStcg: 0,
      longTermLtcg: 0,
      propertySaleGains: 0,
      shareMarketGains: 0
    },
    otherSources: {
      interestSavings: 0,
      interestFD: 0,
      dividends: 0,
      pension: 0,
      familyPension: 0,
      lotteryIncome: 0
    },
    deductions: {
      sec80C: 0,
      sec80CCD_1B: 0,
      sec80D: 0,
      sec80E: 0,
      sec80G: 0,
      sec80TTA: 0,
      sec80TTB: 0,
      otherDeductions: 0
    },
    exemptions: {
      hraExemption: 0,
      ltaExemption: 0,
      agriculturalIncome: 0,
      gratuity: 0,
      leaveEncashment: 0,
      vrsBenefits: 0,
      otherExemptions: 0
    },
    ...overrides
  };
}

test('Slab calculation - Zero income yields zero tax', () => {
  const inputs = createMockInput();
  const oldResult = calculateRegimeTax(inputs, 'Old');
  const newResult = calculateRegimeTax(inputs, 'New');

  assert.strictEqual(oldResult.totalTaxLiability, 0);
  assert.strictEqual(newResult.totalTaxLiability, 0);
});

test('AY 2024-25 New Regime - Income 7,50,000 (after Standard Deduction 50k = 7,00,000) is rebate eligible u/s 87A (Nil Tax)', () => {
  const inputs = createMockInput({
    assessmentYear: '2024-25',
    salary: {
      basicSalary: 750000,
      hra: 0,
      da: 0,
      bonus: 0,
      commission: 0,
      otherAllowances: 0,
      perquisites: 0,
      professionalTax: 0
    }
  });

  const result = calculateRegimeTax(inputs, 'New');
  
  // Gross = 750,000
  // Net Taxable = 750,000 - 50,000 (Standard Deduction) = 700,000
  // Slab Tax on 700,000 u/s AY 2024-25:
  // 0-3L @ 0% = 0
  // 3-6L @ 5% = 15,000
  // 6-7L @ 10% = 10,000
  // Total Tax Before Rebate = 25,000
  // Since Net Taxable Income is exactly 7L, Rebate u/s 87A is 25,000.
  // Final Tax = 0
  assert.strictEqual(result.netTaxableIncome, 700000);
  assert.strictEqual(result.taxBeforeRebate, 25000);
  assert.strictEqual(result.rebate87A, 25000);
  assert.strictEqual(result.totalTaxLiability, 0);
});

test('AY 2025-26 New Regime - Income 7,75,000 (after Standard Deduction 75k = 7,00,000) is rebate eligible u/s 87A (Nil Tax)', () => {
  const inputs = createMockInput({
    assessmentYear: '2025-26',
    salary: {
      basicSalary: 775000,
      hra: 0,
      da: 0,
      bonus: 0,
      commission: 0,
      otherAllowances: 0,
      perquisites: 0,
      professionalTax: 0
    }
  });

  const result = calculateRegimeTax(inputs, 'New');
  
  // Gross = 775,000
  // Net Taxable = 775,000 - 75,000 (Standard Deduction in Budget 2024) = 700,000
  // Slab Tax on 700,000 u/s AY 2025-26:
  // 0-3L @ 0% = 0
  // 3-7L @ 5% = 20,000 (since 3-7L is 4,00,000 @ 5%)
  // Total Tax Before Rebate = 20,000
  // Since Net Taxable Income <= 7L, Rebate u/s 87A is 20,000.
  // Final Tax = 0
  assert.strictEqual(result.netTaxableIncome, 700000);
  assert.strictEqual(result.taxBeforeRebate, 20000);
  assert.strictEqual(result.rebate87A, 20000);
  assert.strictEqual(result.totalTaxLiability, 0);
});

test('AY 2025-26 New Regime - Marginal Relief u/s 87A for Income 7,15,000 (Taxable)', () => {
  const inputs = createMockInput({
    assessmentYear: '2025-26',
    otherSources: {
      interestFD: 715000, // No standard deduction for interest
      interestSavings: 0,
      dividends: 0,
      pension: 0,
      familyPension: 0,
      lotteryIncome: 0
    }
  });

  const result = calculateRegimeTax(inputs, 'New');
  
  // Taxable Income = 715,000 (which is > 7,00,000)
  // Slabs:
  // 0 - 3L = 0
  // 3 - 7L @ 5% = 20,000
  // 7 - 7.15L @ 10% = 1,500
  // Tax Before Rebate = 21,500
  // Excess income above 7L = 15,000
  // Under Marginal Relief, tax cannot exceed excess income (15,000)
  // Rebate = 21,500 - 15,000 = 6,500
  // Tax After Rebate = 15,000
  // Cess (4%) = 600
  // Total Tax = 15,600
  assert.strictEqual(result.netTaxableIncome, 715000);
  assert.strictEqual(result.taxBeforeRebate, 21500);
  assert.strictEqual(result.rebate87A, 6500);
  assert.strictEqual(result.totalTaxLiability, 15600);
});

test('Old Regime - Chapter VI-A deductions are applied correctly', () => {
  const inputs = createMockInput({
    assessmentYear: '2024-25',
    salary: {
      basicSalary: 600000,
      hra: 0,
      da: 0,
      bonus: 0,
      commission: 0,
      otherAllowances: 0,
      perquisites: 0,
      professionalTax: 0
    },
    deductions: {
      sec80C: 150000,
      sec80CCD_1B: 0,
      sec80D: 25000,
      sec80E: 0,
      sec80G: 0,
      sec80TTA: 0,
      sec80TTB: 0,
      otherDeductions: 0
    }
  });

  const oldResult = calculateRegimeTax(inputs, 'Old');
  
  // Gross = 600,000
  // Standard Deduction = 50,000 -> 550,000
  // Deductions = 150,000 (80C) + 25,000 (80D) = 175,000
  // Net Taxable Income = 375,000
  // Tax: 0-2.5L (0%) + 2.5-3.75L (5% of 1.25L = 6,250)
  // Total Tax = 6,250
  // Rebate u/s 87A: Eligible since taxable income <= 5L. Max rebate = 12,500. Rebate applied = 6,250.
  // Final Tax = 0
  assert.strictEqual(oldResult.netTaxableIncome, 375000);
  assert.strictEqual(oldResult.deductionsApplied, 175000);
  assert.strictEqual(oldResult.taxBeforeRebate, 6250);
  assert.strictEqual(oldResult.rebate87A, 6250);
  assert.strictEqual(oldResult.totalTaxLiability, 0);
});

test('Compare regimes and select the best one', () => {
  const inputs = createMockInput({
    assessmentYear: '2024-25',
    salary: {
      basicSalary: 1200000,
      hra: 0,
      da: 0,
      bonus: 0,
      commission: 0,
      otherAllowances: 0,
      perquisites: 0,
      professionalTax: 0
    },
    deductions: {
      sec80C: 150000,
      sec80CCD_1B: 50000,
      sec80D: 25000,
      sec80E: 0,
      sec80G: 0,
      sec80TTA: 0,
      sec80TTB: 0,
      otherDeductions: 0
    }
  });

  const comparison = compareRegimes(inputs);
  
  // Old regime:
  // Gross = 1,200,000
  // Std Ded = 50,000 -> 1,150,000
  // Deductions = 1.5L + 50k + 25k = 2,25,000
  // Net Taxable = 9,25,000
  // Tax: 0-2.5L (0) + 2.5-5L (12.5k) + 5-9.25L (20% of 4.25L = 85k) = 97,500
  // Cess (4%) = 3,900
  // Total Old Tax = 1,01,400
  
  // New regime:
  // Gross = 1,200,000
  // Std Ded = 50,000 -> 1,150,000
  // Deductions = 0
  // Net Taxable = 1,150,000
  // Tax: 0-3L (0) + 3-6L (15k) + 6-9L (30k) + 9-11.5L (15% of 2.5L = 37.5k) = 82,500
  // Cess (4%) = 3,300
  // Total New Tax = 85,800
  
  // New Regime should be recommended
  assert.strictEqual(comparison.recommendedRegime, 'New');
  assert.strictEqual(comparison.newRegime.totalTaxLiability, 85800);
  assert.strictEqual(comparison.oldRegime.totalTaxLiability, 101400);
  assert.strictEqual(comparison.taxSaved, 15600);
});

test('AY 2026-27 New Regime - Tax calculation matches Income Tax Department for gross 14,65,500 (standard deduction 75k, taxable 13,90,500)', () => {
  const inputs = createMockInput({
    assessmentYear: '2026-27',
    salary: {
      basicSalary: 1465500,
      hra: 0,
      da: 0,
      bonus: 0,
      commission: 0,
      otherAllowances: 0,
      perquisites: 0,
      professionalTax: 0
    }
  });

  const result = calculateRegimeTax(inputs, 'New');
  
  // Gross = 1,465,500
  // Standard Deduction = 75,000
  // Net Taxable = 1,390,500
  // Slab Tax on 1,390,500 u/s AY 2026-27 (Budget 2025):
  // 0 - 4L @ 0% = 0
  // 4 - 8L @ 5% = 20,000
  // 8 - 12L @ 10% = 40,000
  // 12 - 13.905L @ 15% = 28,575
  // Base Tax = 88,575
  // Cess (4%) = 3,543
  // Total Tax = 92,118
  assert.strictEqual(result.netTaxableIncome, 1390500);
  assert.strictEqual(result.standardDeductionApplied, 75000);
  assert.strictEqual(result.taxBeforeRebate, 88575);
  assert.strictEqual(result.cess, 3543);
  assert.strictEqual(result.totalTaxLiability, 92120); // Rounded to nearest 10 u/s 288B (exact: 92,118)
});

