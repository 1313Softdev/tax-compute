export type EmploymentType = 'Salaried' | 'Business' | 'Professional' | 'Pensioner' | 'Freelancer';

export interface SalaryIncome {
  basicSalary: number;
  hra: number;
  da: number;
  bonus: number;
  commission: number;
  otherAllowances: number;
  perquisites: number;
  professionalTax: number;
}

export interface HousePropertyIncome {
  isSelfOccupied: boolean;
  rentalIncome: number;
  municipalTaxes: number;
  housingLoanInterest: number;
}

export interface BusinessIncome {
  grossReceipts: number;
  expenses: number;
  depreciation: number;
  profitLossOverride?: number; // Optional direct profit/loss override
  isPresumptive44AD?: boolean;
  tradeName?: string;
  businessCode?: string;
  businessNature?: string;
  receiptsCash?: number;
  receiptsBanking?: number;
  receiptsOther?: number;
}

export interface ProfessionalIncome {
  grossReceipts: number;
  expenses: number;
  depreciation: number;
  profitLossOverride?: number;
  isPresumptive44ADA?: boolean;
  tradeName?: string;
  professionCode?: string;
  professionNature?: string;
  receiptsCash?: number;
  receiptsBanking?: number;
}

export interface CapitalGains {
  shortTermStcg: number;
  longTermLtcg: number;
  propertySaleGains: number;
  shareMarketGains: number;
}

export interface OtherSourcesIncome {
  interestSavings: number;
  interestFD: number;
  dividends: number;
  pension: number;
  familyPension: number;
  lotteryIncome: number;
}

export interface ChapterVIADeductions {
  sec80C: number;          // LIC, PPF, ELSS, School fees, Home Loan Principal (limit 1.5L)
  sec80CCD_1B: number;     // NPS (limit 50k)
  sec80D: number;          // Medical Insurance (limit 25k/50k/75k/100k depending on age)
  sec80E: number;          // Education Loan Interest (no limit)
  sec80G: number;          // Donations (50% or 100% depending on category)
  sec80TTA: number;        // Savings Interest for non-seniors (limit 10k)
  sec80TTB: number;        // FD/Savings Interest for seniors (limit 50k)
  otherDeductions: number; // Other section deductions
}

export interface Exemptions {
  hraExemption: number;
  ltaExemption: number;
  agriculturalIncome: number;
  gratuity: number;
  leaveEncashment: number;
  vrsBenefits: number;
  otherExemptions: number;
}

export interface ChallanTaxDeposit {
  id: string;
  type: 'SelfAssessment' | 'AdvanceTax' | 'TDS';
  amount: number;
  bsrCode?: string;
  date?: string; // YYYY-MM-DD
  challanNo?: string;
  bankName?: string;
  deductorName?: string; // For TDS
  deductorTAN?: string; // For TDS
}

export interface TaxComputationInputs {
  assessmentYear: string; // '2024-25' | '2025-26' | '2026-27' | '2027-28'
  fullName: string;
  panNumber: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: 'Male' | 'Female' | 'Other';
  residentialStatus: 'Resident' | 'Non-Resident' | 'RNOR';
  itrForm?: string;
  filingSection?: string;
  salary: SalaryIncome;
  houseProperty: HousePropertyIncome;
  business: BusinessIncome;
  professional?: ProfessionalIncome;
  capitalGains: CapitalGains;
  otherSources: OtherSourcesIncome;
  deductions: ChapterVIADeductions;
  exemptions: Exemptions;
  taxDeposits?: ChallanTaxDeposit[];
}

export interface TaxSlab {
  minLimit: number;
  maxLimit: number | null; // null for no upper limit
  rate: number; // percentage (e.g. 5, 10, 15, 20, 30)
}

export interface TaxRegimeConfig {
  slabs: TaxSlab[];
  standardDeduction: number;
  rebateLimit: number; // Income threshold below which tax is zero (e.g. 5,00,000 or 7,00,000)
  maxRebate: number; // Max rebate amount (e.g. 12,500 or 20,000 or 25,000)
  enableDeductions: boolean; // false for New Regime, true for Old Regime
  hraExemptionAllowed: boolean; // false for New, true for Old
}

export interface TaxCalculationResult {
  regime: 'Old' | 'New';
  grossSalary: number;
  grossHouseProperty: number;
  grossBusiness: number;
  grossProfessional: number;
  grossCapitalGains: number;
  grossOtherSources: number;
  totalGrossIncome: number;
  exemptionsApplied: number;
  deductionsApplied: number;
  netTaxableIncome: number;
  standardDeductionApplied: number;
  taxBeforeRebate: number;
  rebate87A: number;
  taxAfterRebate: number;
  surcharge: number;
  cess: number;
  totalTaxLiability: number;
  totalTaxesPaid: number;
  totalSelfAssessment: number;
  totalAdvanceTax: number;
  totalTDS: number;
  netTaxPayableOrRefund: number;
}

export interface RegimeComparisonResult {
  assessmentYear: string;
  inputs: TaxComputationInputs;
  oldRegime: TaxCalculationResult;
  newRegime: TaxCalculationResult;
  recommendedRegime: 'Old' | 'New';
  taxSaved: number;
}
