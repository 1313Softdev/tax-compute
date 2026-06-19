import { 
  TaxComputationInputs, 
  TaxCalculationResult, 
  RegimeComparisonResult, 
  TaxRegimeConfig,
  ChapterVIADeductions,
  Exemptions
} from './types';
import { calculateAge, getOldRegimeConfig, getNewRegimeConfig, calculateSurcharge } from './slabs';

// Helper to format numbers to 2 decimal places or round to nearest integer (Indian tax is rounded to nearest Rs 10 u/s 288B)
export function roundTax(amount: number): number {
  return Math.round(amount / 10) * 10;
}

// HRA Exemption Calculator u/s 10(13A)
export function calculateHRAExemption(
  basicSalary: number,
  da: number,
  hraReceived: number,
  rentPaid: number,
  isMetro: boolean = false
): number {
  if (hraReceived <= 0 || rentPaid <= 0) return 0;
  
  const salaryForHra = basicSalary + da;
  const cond1 = hraReceived;
  const cond2 = Math.max(0, rentPaid - (0.10 * salaryForHra));
  const cond3 = isMetro ? (0.50 * salaryForHra) : (0.40 * salaryForHra);
  
  return Math.min(cond1, cond2, cond3);
}

// Compute individual regime tax details
export function calculateRegimeTax(
  inputs: TaxComputationInputs,
  regime: 'Old' | 'New'
): TaxCalculationResult {
  const age = calculateAge(inputs.dateOfBirth, inputs.assessmentYear);
  const isSenior = age >= 60;
  
  // Get regime configuration
  const config = regime === 'Old' ? getOldRegimeConfig(age) : getNewRegimeConfig(inputs.assessmentYear);

  // 1. SALARY INCOME
  let grossSalary = 
    inputs.salary.basicSalary +
    inputs.salary.hra +
    inputs.salary.da +
    inputs.salary.bonus +
    inputs.salary.commission +
    inputs.salary.otherAllowances +
    inputs.salary.perquisites;

  // Apply exemptions (HRA, LTA, etc.)
  let exemptionsApplied = 0;
  if (config.hraExemptionAllowed) {
    // If HRA exemption is entered manually, use it; otherwise compute it.
    let computedHraExemp = inputs.exemptions.hraExemption;
    if (computedHraExemp === 0 && inputs.salary.hra > 0) {
      // Guessing rent paid is roughly HRA received + 10% of salary for calculation if not specified, or just HRA received
      // Let's assume user inputs exemption directly, or default to HRA received if rent paid is not explicit
      computedHraExemp = Math.min(inputs.salary.hra, inputs.exemptions.hraExemption || 0);
    }
    
    exemptionsApplied = 
      computedHraExemp +
      inputs.exemptions.ltaExemption +
      inputs.exemptions.gratuity +
      inputs.exemptions.leaveEncashment +
      inputs.exemptions.vrsBenefits +
      inputs.exemptions.otherExemptions;
  } else {
    // In new regime, agricultural income is exempt, others are taxable
    exemptionsApplied = inputs.exemptions.agriculturalIncome;
  }

  // Professional Tax deduction u/s 16(iii) - Only in Old Regime
  const profTaxDeduction = regime === 'Old' ? inputs.salary.professionalTax : 0;
  
  // Standard Deduction u/s 16(ia) - Applies only if there is salary income
  let standardDeduction = 0;
  if (grossSalary > 0) {
    standardDeduction = Math.min(grossSalary - exemptionsApplied - profTaxDeduction, config.standardDeduction);
  }

  const netSalaryIncome = Math.max(0, grossSalary - exemptionsApplied - profTaxDeduction - standardDeduction);

  // 2. HOUSE PROPERTY INCOME
  let grossHouseProperty = 0;
  if (inputs.houseProperty.isSelfOccupied) {
    // Self Occupied
    if (regime === 'Old') {
      // Interest on borrowing u/s 24(b) capped at 2,00,000
      grossHouseProperty = -Math.min(200000, inputs.houseProperty.housingLoanInterest);
    } else {
      // Under New Regime, interest on self-occupied property is Nil (no loss allowed)
      grossHouseProperty = 0;
    }
  } else {
    // Let Out
    const nav = Math.max(0, inputs.houseProperty.rentalIncome - inputs.houseProperty.municipalTaxes);
    const standardDeductionHP = 0.30 * nav; // 30% u/s 24(a)
    const interestHP = inputs.houseProperty.housingLoanInterest;
    const hpNet = nav - standardDeductionHP - interestHP;
    
    if (regime === 'Old') {
      grossHouseProperty = hpNet;
    } else {
      // New regime allows interest deduction for let-out property, but overall HP loss cannot be set off against other heads.
      // We will compute net HP income. If it is a loss, we don't offset it against other heads (limit offset to 0).
      grossHouseProperty = hpNet;
    }
  }

  // 3. BUSINESS INCOME
  // Profit/Loss = Receipts - Expenses - Depreciation
  const grossBusiness = inputs.business.profitLossOverride !== undefined 
    ? inputs.business.profitLossOverride 
    : (inputs.business.grossReceipts - inputs.business.expenses - inputs.business.depreciation);

  // 3b. PROFESSIONAL INCOME
  let grossProfessional = 0;
  if (inputs.professional) {
    if (inputs.professional.isPresumptive44ADA) {
      const cash = inputs.professional.receiptsCash || 0;
      const banking = inputs.professional.receiptsBanking || 0;
      grossProfessional = Math.round((cash + banking) * 0.5);
    } else {
      grossProfessional = inputs.professional.profitLossOverride !== undefined
        ? inputs.professional.profitLossOverride
        : (inputs.professional.grossReceipts - inputs.professional.expenses - inputs.professional.depreciation);
    }
    if (grossProfessional < 0) {
      grossProfessional = 0;
    }
  }

  // 4. CAPITAL GAINS
  const grossCapitalGains = 
    inputs.capitalGains.shortTermStcg +
    inputs.capitalGains.longTermLtcg +
    inputs.capitalGains.propertySaleGains +
    inputs.capitalGains.shareMarketGains;

  // 5. OTHER SOURCES INCOME
  const grossOtherSources = 
    inputs.otherSources.interestSavings +
    inputs.otherSources.interestFD +
    inputs.otherSources.dividends +
    inputs.otherSources.pension +
    inputs.otherSources.familyPension +
    inputs.otherSources.lotteryIncome;

  // 6. GROSS TOTAL INCOME (GTI)
  // House Property Loss Offset logic:
  // Old regime: HP loss offset capped at 2,00,000 against other heads.
  // New regime: HP loss offset is 0 against other heads.
  let hpOffset = grossHouseProperty;
  if (hpOffset < 0) {
    if (regime === 'Old') {
      hpOffset = -Math.min(200000, Math.abs(hpOffset));
    } else {
      hpOffset = 0; // Not allowed to offset against other heads in new regime
    }
  }

  const otherHeadsSum = netSalaryIncome + grossBusiness + grossProfessional + grossCapitalGains + grossOtherSources;
  const totalGrossIncome = Math.max(0, otherHeadsSum + hpOffset);

  // 7. CHAPTER VI-A DEDUCTIONS
  let deductionsApplied = 0;
  if (config.enableDeductions) {
    // 80C Limit 1,50,000
    const d80C = Math.min(150000, inputs.deductions.sec80C);
    
    // 80CCD(1B) Limit 50,000
    const d80CCD = Math.min(50000, inputs.deductions.sec80CCD_1B);
    
    // 80D (Medical): Limit 25k (general), 50k (seniors). Max up to 1,00,000 if individual + parents are seniors.
    // Let's implement age-based limits:
    const limit80D = isSenior ? 50000 : 25000;
    const d80D = Math.min(limit80D + 50000, inputs.deductions.sec80D); // Assuming parents could add another 50k
    
    // 80E: no limit
    const d80E = inputs.deductions.sec80E;
    
    // 80G: donations
    const d80G = inputs.deductions.sec80G;
    
    // 80TTA / 80TTB:
    let dTTA_TTB = 0;
    if (isSenior) {
      // 80TTB up to 50k for FD + Savings interest
      const seniorInterest = inputs.otherSources.interestSavings + inputs.otherSources.interestFD;
      dTTA_TTB = Math.min(50000, Math.min(seniorInterest, inputs.deductions.sec80TTB || 50000));
    } else {
      // 80TTA up to 10k for Savings interest only
      const savingsInterest = inputs.otherSources.interestSavings;
      dTTA_TTB = Math.min(10000, Math.min(savingsInterest, inputs.deductions.sec80TTA || 10000));
    }

    const otherD = inputs.deductions.otherDeductions;

    const totalDeductionsClaimed = d80C + d80CCD + d80D + d80E + d80G + dTTA_TTB + otherD;
    
    // Deductions cannot exceed Gross Total Income (excluding capital gains and special incomes which don't allow deductions)
    const baseForDeductions = Math.max(0, totalGrossIncome - grossCapitalGains - inputs.otherSources.lotteryIncome);
    deductionsApplied = Math.min(totalDeductionsClaimed, baseForDeductions);
  }

  // 8. NET TAXABLE INCOME
  const netTaxableIncome = Math.max(0, totalGrossIncome - deductionsApplied);

  // 9. TAX CALCULATION (Slab-wise + Special Incomes)
  // In India, capital gains and lottery are taxed at special rates.
  // Lottery: 30% u/s 115BB
  // STCG Equity (111A): 15% (AY 24-25) or 20% (AY 25-26+)
  // LTCG Equity (112A): 10% on amount exceeding exemption limit
  // LTCG Others (112): 20%
  // Let's separate these special incomes from the slabs.
  const isBudget2024Rev = inputs.assessmentYear !== '2024-25';
  
  const lotteryIncomeVal = inputs.otherSources.lotteryIncome;
  const stcgVal = inputs.capitalGains.shareMarketGains; // Short term equity gains
  const ltcgVal = inputs.capitalGains.longTermLtcg; // Long term equity gains
  const otherCapitalGains = inputs.capitalGains.shortTermStcg + inputs.capitalGains.propertySaleGains;

  const specialIncomesTotal = lotteryIncomeVal + stcgVal + ltcgVal + otherCapitalGains;
  
  // Normal income taxed at slab rates
  const normalTaxableIncome = Math.max(0, netTaxableIncome - specialIncomesTotal);
  
  let slabTax = 0;
  let remainingIncomeForSlabs = normalTaxableIncome;
  
  for (const slab of config.slabs) {
    const min = slab.minLimit;
    const max = slab.maxLimit;
    const rate = slab.rate / 100;
    
    if (remainingIncomeForSlabs > min) {
      const taxableInThisSlab = max === null 
        ? remainingIncomeForSlabs - min 
        : Math.min(remainingIncomeForSlabs - min, max - min);
      slabTax += taxableInThisSlab * rate;
    }
  }

  // Special Taxes
  const taxOnLottery = lotteryIncomeVal * 0.30;
  
  // STCG rate: 15% in AY 24-25, 20% in AY 25-26+
  const stcgRate = isBudget2024Rev ? 0.20 : 0.15;
  const taxOnSTCG = stcgVal * stcgRate;

  // LTCG rate: 10% above exemption (1L in AY 24-25, 1.25L in AY 25-26+)
  const ltcgExemption = isBudget2024Rev ? 125000 : 100000;
  const taxableLtcg = Math.max(0, ltcgVal - ltcgExemption);
  const taxOnLTCG = taxableLtcg * 0.10;

  // Other capital gains taxed at normal slab rate (or 20% flat for other LTCG properties).
  // Let's tax other capital gains at flat 20% for simplicity and CA-compliance.
  const taxOnOtherGains = otherCapitalGains * 0.20;

  const totalSpecialTax = taxOnLottery + taxOnSTCG + taxOnLTCG + taxOnOtherGains;
  const taxBeforeRebate = slabTax + totalSpecialTax;

  // 10. REBATE U/S 87A
  let rebate87A = 0;
  if (netTaxableIncome <= config.rebateLimit) {
    // Eligible for full rebate up to maxRebate or taxBeforeRebate
    rebate87A = Math.min(taxBeforeRebate, config.maxRebate);
  } else if (regime === 'New' && netTaxableIncome > config.rebateLimit) {
    // Marginal relief u/s 87A for New Tax Regime
    // Taxable income slightly exceeds rebateLimit. 
    // Tax payable should not exceed (Taxable Income - rebateLimit)
    const excessIncome = netTaxableIncome - config.rebateLimit;
    if (taxBeforeRebate > excessIncome) {
      rebate87A = taxBeforeRebate - excessIncome;
    }
  }

  const taxAfterRebate = Math.max(0, taxBeforeRebate - rebate87A);

  // 11. SURCHARGE
  const surchargeRate = calculateSurcharge(netTaxableIncome, regime);
  const surcharge = taxAfterRebate * surchargeRate;

  // 12. HEALTH & EDUCATION CESS (4%)
  const cess = (taxAfterRebate + surcharge) * 0.04;

  // 13. TOTAL TAX PAYABLE (rounded u/s 288B)
  const totalTaxLiability = roundTax(taxAfterRebate + surcharge + cess);

  // 14. TAXES DEPOSITED (Self-Assessment, Advance Tax, TDS)
  let totalSelfAssessment = 0;
  let totalAdvanceTax = 0;
  let totalTDS = 0;
  if (inputs.taxDeposits && inputs.taxDeposits.length > 0) {
    inputs.taxDeposits.forEach(d => {
      if (d.type === 'SelfAssessment') totalSelfAssessment += d.amount;
      else if (d.type === 'AdvanceTax') totalAdvanceTax += d.amount;
      else if (d.type === 'TDS') totalTDS += d.amount;
    });
  } else {
    // Fallback to legacy fields
    totalSelfAssessment = (inputs.business as any)?.selfAssessmentTax || 0;
  }
  const totalTaxesPaid = totalSelfAssessment + totalAdvanceTax + totalTDS;
  const netTaxPayableOrRefund = totalTaxLiability - totalTaxesPaid;

  return {
    regime,
    grossSalary,
    grossHouseProperty,
    grossBusiness,
    grossProfessional,
    grossCapitalGains,
    grossOtherSources,
    totalGrossIncome,
    exemptionsApplied,
    deductionsApplied,
    netTaxableIncome,
    standardDeductionApplied: standardDeduction,
    taxBeforeRebate,
    rebate87A,
    taxAfterRebate,
    surcharge,
    cess,
    totalTaxLiability,
    totalTaxesPaid,
    totalSelfAssessment,
    totalAdvanceTax,
    totalTDS,
    netTaxPayableOrRefund
  };
}

// Compare Old vs New and return recommendation
export function compareRegimes(inputs: TaxComputationInputs): RegimeComparisonResult {
  const oldRegime = calculateRegimeTax(inputs, 'Old');
  const newRegime = calculateRegimeTax(inputs, 'New');

  const oldTotal = oldRegime.totalTaxLiability;
  const newTotal = newRegime.totalTaxLiability;

  let recommendedRegime: 'Old' | 'New' = 'New';
  let taxSaved = 0;

  if (oldTotal < newTotal) {
    recommendedRegime = 'Old';
    taxSaved = newTotal - oldTotal;
  } else {
    recommendedRegime = 'New';
    taxSaved = oldTotal - newTotal;
  }

  return {
    assessmentYear: inputs.assessmentYear,
    inputs,
    oldRegime,
    newRegime,
    recommendedRegime,
    taxSaved
  };
}
