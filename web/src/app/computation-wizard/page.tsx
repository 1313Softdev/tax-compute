'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '../../components/DashboardLayout';
import { useAuth } from '../providers';
import { useLanguage } from '../providers';
import { compareRegimes, taxBusinessCodes } from 'shared-engine';
import { 
  Calculator, 
  Settings, 
  Banknote, 
  Building2, 
  TrendingUp, 
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Check,
  Plus,
  Trash2,
  FileText,
  Upload,
  FileCheck
} from 'lucide-react';

function ComputationWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { token, profile, apiUrl } = useAuth();
  const { t } = useLanguage();

  const [activeSubTab, setActiveSubTab] = useState<'info' | 'salary' | 'property' | 'business' | 'professional' | 'deductions' | 'taxDeposited'>('info');
  const [submitting, setSubmitting] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalTarget, setModalTarget] = useState<'business' | 'professional'>('business');

  // -------------------------------------------------------------
  // FULL TAX COMPUTATION STATE
  // -------------------------------------------------------------
  const [assessmentYear, setAssessmentYear] = useState('2024-25');
  const [residentialStatus, setResidentialStatus] = useState<'Resident' | 'Non-Resident' | 'RNOR'>('Resident');
  const [itrForm, setItrForm] = useState('ITR-1');
  const [filingSection, setFilingSection] = useState('139(1)');

  // Salary
  const [basicSalary, setBasicSalary] = useState(0);
  const [salaryHRA, setSalaryHRA] = useState(0);
  const [salaryDA, setSalaryDA] = useState(0);
  const [salaryBonus, setSalaryBonus] = useState(0);
  const [salaryComm, setSalaryComm] = useState(0);
  const [salaryAllow, setSalaryAllow] = useState(0);
  const [salaryPerq, setSalaryPerq] = useState(0);
  const [profTax, setProfTax] = useState(0);

  // House Property
  const [isSelfOccupied, setIsSelfOccupied] = useState(true);
  const [rentalIncome, setRentalIncome] = useState(0);
  const [municipalTaxes, setMunicipalTaxes] = useState(0);
  const [housingLoanInterest, setHousingLoanInterest] = useState(0);

  // Business
  const [businessReceipts, setBusinessReceipts] = useState(0);
  const [businessExpenses, setBusinessExpenses] = useState(0);
  const [businessDepr, setBusinessDepr] = useState(0);

  // Presumptive Business Details (ITR4 / 44AD)
  const [isPresumptive44AD, setIsPresumptive44AD] = useState(false);
  const [tradeName, setTradeName] = useState('');
  const [businessCode, setBusinessCode] = useState('06002');
  const [businessNature, setBusinessNature] = useState('Building of complete constructions or parts- civil contractors');
  const [receiptsCash, setReceiptsCash] = useState(0);
  const [receiptsBanking, setReceiptsBanking] = useState(0);
  const [receiptsOther, setReceiptsOther] = useState(0);
  
  // Financial Particulars
  const [sundryDebtors, setSundryDebtors] = useState(0);
  const [sundryCreditors, setSundryCreditors] = useState(0);
  const [stockInTrade, setStockInTrade] = useState(0);
  const [cashBalance, setCashBalance] = useState(0);

  // Professional Details (Sec 44ADA)
  const [isPresumptive44ADA, setIsPresumptive44ADA] = useState(false);
  const [profTradeName, setProfTradeName] = useState('');
  const [profCode, setProfCode] = useState('16013');
  const [profNature, setProfNature] = useState('Software development');
  const [profReceiptsCash, setProfReceiptsCash] = useState(0);
  const [profReceiptsBanking, setProfReceiptsBanking] = useState(0);
  const [profNormalReceipts, setProfNormalReceipts] = useState(0);
  const [profNormalExpenses, setProfNormalExpenses] = useState(0);
  const [profNormalDepr, setProfNormalDepr] = useState(0);

  // Challan / Late Fee details
  const [hasChallan, setHasChallan] = useState(false);
  const [bsrCode, setBsrCode] = useState('');
  const [challanNo, setChallanNo] = useState('');
  const [challanDate, setChallanDate] = useState('');
  const [selfAssessmentTax, setSelfAssessmentTax] = useState(0);
  const [fee234F, setFee234F] = useState(0);

  // Capital Gains
  const [stcgGeneral, setStcgGeneral] = useState(0);
  const [stcgEquity, setStcgEquity] = useState(0); // shareMarketGains
  const [ltcgEquity, setLtcgEquity] = useState(0); // longTermLtcg
  const [ltcgProperty, setLtcgProperty] = useState(0); // propertySaleGains

  // Other Sources
  const [interestSavings, setInterestSavings] = useState(0);
  const [interestFD, setInterestFD] = useState(0);
  const [dividends, setDividends] = useState(0);
  const [pension, setPension] = useState(0);
  const [familyPension, setFamilyPension] = useState(0);
  const [lotteryIncome, setLotteryIncome] = useState(0);

  // Deductions
  const [sec80C, setSec80C] = useState(0);
  const [sec80CCD_1B, setSec80CCD_1B] = useState(0);
  const [sec80D, setSec80D] = useState(0);
  const [sec80E, setSec80E] = useState(0);
  const [sec80G, setSec80G] = useState(0);
  const [sec80TTA, setSec80TTA] = useState(0);
  const [sec80TTB, setSec80TTB] = useState(0);
  const [otherDeductions, setOtherDeductions] = useState(0);

  // Exemptions
  const [hraExemption, setHraExemption] = useState(0);
  const [ltaExemption, setLtaExemption] = useState(0);
  const [agriculturalIncome, setAgriculturalIncome] = useState(0);
  const [gratuity, setGratuity] = useState(0);
  const [leaveEncashment, setLeaveEncashment] = useState(0);
  const [vrsBenefits, setVrsBenefits] = useState(0);
  const [otherExemptions, setOtherExemptions] = useState(0);

  // Tax Deposited states
  const [taxDeposits, setTaxDeposits] = useState<any[]>([]);
  const [depType, setDepType] = useState<'SelfAssessment' | 'AdvanceTax' | 'TDS'>('SelfAssessment');
  const [depAmount, setDepAmount] = useState('');
  const [depBsr, setDepBsr] = useState('');
  const [depDate, setDepDate] = useState('');
  const [depChallanNo, setDepChallanNo] = useState('');
  const [depBank, setDepBank] = useState('');
  const [depDeductorName, setDepDeductorName] = useState('');
  const [depDeductorTan, setDepDeductorTan] = useState('');
  const [raw26ASText, setRaw26ASText] = useState('');
  const [show26ASUpload, setShow26ASUpload] = useState(false);

  // Real-time Preview outputs
  const [liveOutput, setLiveOutput] = useState<any>(null);

  // Load existing computation in edit mode
  useEffect(() => {
    if (!token || !editId || !apiUrl) return;

    const fetchComputation = async () => {
      try {
        const res = await fetch(`${apiUrl}/tax/computation/${editId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const inputs = data.inputs;
          if (inputs) {
            setAssessmentYear(inputs.assessmentYear || '2024-25');
            setResidentialStatus(inputs.residentialStatus || 'Resident');
            setItrForm(inputs.itrForm || 'ITR-1');
            setFilingSection(inputs.filingSection || '139(1)');
            
            // Salary
            if (inputs.salary) {
              setBasicSalary(inputs.salary.basicSalary || 0);
              setSalaryHRA(inputs.salary.hra || 0);
              setSalaryDA(inputs.salary.da || 0);
              setSalaryBonus(inputs.salary.bonus || 0);
              setSalaryComm(inputs.salary.commission || 0);
              setSalaryAllow(inputs.salary.otherAllowances || 0);
              setSalaryPerq(inputs.salary.perquisites || 0);
              setProfTax(inputs.salary.professionalTax || 0);
            }

            // House Property
            if (inputs.houseProperty) {
              setIsSelfOccupied(inputs.houseProperty.isSelfOccupied !== false);
              setRentalIncome(inputs.houseProperty.rentalIncome || 0);
              setMunicipalTaxes(inputs.houseProperty.municipalTaxes || 0);
              setHousingLoanInterest(inputs.houseProperty.housingLoanInterest || 0);
            }

            // Business
            if (inputs.business) {
              setBusinessReceipts(inputs.business.grossReceipts || 0);
              setBusinessExpenses(inputs.business.expenses || 0);
              setBusinessDepr(inputs.business.depreciation || 0);
              
              setIsPresumptive44AD(inputs.business.isPresumptive44AD || false);
              setTradeName(inputs.business.tradeName || '');
              setBusinessCode(inputs.business.businessCode || '06002');
              setBusinessNature(inputs.business.businessNature || 'Building of complete constructions or parts- civil contractors');
              setReceiptsCash(inputs.business.receiptsCash || 0);
              setReceiptsBanking(inputs.business.receiptsBanking || 0);
              setReceiptsOther(inputs.business.receiptsOther || 0);
              
              setSundryDebtors(inputs.business.sundryDebtors || 0);
              setSundryCreditors(inputs.business.sundryCreditors || 0);
              setStockInTrade(inputs.business.stockInTrade || 0);
              setCashBalance(inputs.business.cashBalance || 0);
              
              setHasChallan(inputs.business.hasChallan || false);
              setBsrCode(inputs.business.bsrCode || '');
              setChallanNo(inputs.business.challanNo || '');
              setChallanDate(inputs.business.challanDate || '');
              setSelfAssessmentTax(inputs.business.selfAssessmentTax || 0);
              setFee234F(inputs.business.fee234F || 0);
            }

            // Professional
            if (inputs.professional) {
              setIsPresumptive44ADA(inputs.professional.isPresumptive44ADA || false);
              setProfTradeName(inputs.professional.tradeName || '');
              setProfCode(inputs.professional.professionCode || '16013');
              setProfNature(inputs.professional.professionNature || 'Software development');
              setProfReceiptsCash(inputs.professional.receiptsCash || 0);
              setProfReceiptsBanking(inputs.professional.receiptsBanking || 0);
              setProfNormalReceipts(inputs.professional.grossReceipts || 0);
              setProfNormalExpenses(inputs.professional.expenses || 0);
              setProfNormalDepr(inputs.professional.depreciation || 0);
            }

            // Capital Gains
            if (inputs.capitalGains) {
              setStcgGeneral(inputs.capitalGains.shortTermStcg || 0);
              setStcgEquity(inputs.capitalGains.shareMarketGains || 0);
              setLtcgEquity(inputs.capitalGains.longTermLtcg || 0);
              setLtcgProperty(inputs.capitalGains.propertySaleGains || 0);
            }

            // Other Sources
            if (inputs.otherSources) {
              setInterestSavings(inputs.otherSources.interestSavings || 0);
              setInterestFD(inputs.otherSources.interestFD || 0);
              setDividends(inputs.otherSources.dividends || 0);
              setPension(inputs.otherSources.pension || 0);
              setFamilyPension(inputs.otherSources.familyPension || 0);
              setLotteryIncome(inputs.otherSources.lotteryIncome || 0);
            }

            // Deductions
            if (inputs.deductions) {
              setSec80C(inputs.deductions.sec80C || 0);
              setSec80CCD_1B(inputs.deductions.sec80CCD_1B || 0);
              setSec80D(inputs.deductions.sec80D || 0);
              setSec80E(inputs.deductions.sec80E || 0);
              setSec80G(inputs.deductions.sec80G || 0);
              setSec80TTA(inputs.deductions.sec80TTA || 0);
              setSec80TTB(inputs.deductions.sec80TTB || 0);
              setOtherDeductions(inputs.deductions.otherDeductions || 0);
            }

            // Exemptions
            if (inputs.exemptions) {
              setHraExemption(inputs.exemptions.hraExemption || 0);
              setLtaExemption(inputs.exemptions.ltaExemption || 0);
              setAgriculturalIncome(inputs.exemptions.agriculturalIncome || 0);
              setGratuity(inputs.exemptions.gratuity || 0);
              setLeaveEncashment(inputs.exemptions.leaveEncashment || 0);
              setVrsBenefits(inputs.exemptions.vrsBenefits || 0);
              setOtherExemptions(inputs.exemptions.otherExemptions || 0);
            }

            if (inputs.taxDeposits) {
              setTaxDeposits(inputs.taxDeposits);
            } else {
              setTaxDeposits([]);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load computation details for editing', err);
      }
    };

    fetchComputation();
  }, [token, editId, apiUrl]);

  // Assemble full inputs for computation engine
  const assembleInputs = () => {
    return {
      assessmentYear,
      fullName: profile?.fullName || 'Assessee',
      panNumber: profile?.panNumber || 'ABCDE1234F',
      dateOfBirth: (profile as any)?.dateOfBirth || '1990-01-01',
      gender: ((profile as any)?.gender || 'Male') as any,
      residentialStatus,
      itrForm,
      filingSection,
      salary: {
        basicSalary,
        hra: salaryHRA,
        da: salaryDA,
        bonus: salaryBonus,
        commission: salaryComm,
        otherAllowances: salaryAllow,
        perquisites: salaryPerq,
        professionalTax: profTax
      },
      houseProperty: {
        isSelfOccupied,
        rentalIncome,
        municipalTaxes,
        housingLoanInterest
      },
      business: {
        grossReceipts: isPresumptive44AD ? (receiptsCash + receiptsBanking + receiptsOther) : businessReceipts,
        expenses: isPresumptive44AD ? 0 : businessExpenses,
        depreciation: isPresumptive44AD ? 0 : businessDepr,
        profitLossOverride: isPresumptive44AD ? Math.round(receiptsCash * 0.08 + receiptsBanking * 0.06 + receiptsOther * 0.08) : undefined,
        
        isPresumptive44AD,
        tradeName,
        businessCode,
        businessNature,
        receiptsCash,
        receiptsBanking,
        receiptsOther,
        sundryDebtors,
        sundryCreditors,
        stockInTrade,
        cashBalance,
        hasChallan,
        bsrCode,
        challanNo,
        challanDate,
        selfAssessmentTax,
        fee234F
      },
      professional: {
        grossReceipts: isPresumptive44ADA ? (profReceiptsCash + profReceiptsBanking) : profNormalReceipts,
        expenses: isPresumptive44ADA ? 0 : profNormalExpenses,
        depreciation: isPresumptive44ADA ? 0 : profNormalDepr,
        isPresumptive44ADA,
        tradeName: profTradeName,
        professionCode: profCode,
        professionNature: profNature,
        receiptsCash: profReceiptsCash,
        receiptsBanking: profReceiptsBanking,
        profitLossOverride: isPresumptive44ADA ? Math.round((profReceiptsCash + profReceiptsBanking) * 0.5) : undefined
      },
      capitalGains: {
        shortTermStcg: stcgGeneral,
        longTermLtcg: ltcgEquity,
        propertySaleGains: ltcgProperty,
        shareMarketGains: stcgEquity
      },
      otherSources: {
        interestSavings,
        interestFD,
        dividends,
        pension,
        familyPension,
        lotteryIncome
      },
      deductions: {
        sec80C,
        sec80CCD_1B,
        sec80D,
        sec80E,
        sec80G,
        sec80TTA,
        sec80TTB,
        otherDeductions
      },
      exemptions: {
        hraExemption,
        ltaExemption,
        agriculturalIncome,
        gratuity,
        leaveEncashment,
        vrsBenefits,
        otherExemptions
      },
      taxDeposits
    };
  };

  // Run local live computation on input change
  useEffect(() => {
    try {
      const inputs = assembleInputs();
      const output = compareRegimes(inputs);
      setLiveOutput(output);
    } catch (e) {
      console.error(e);
    }
  }, [
    assessmentYear, residentialStatus, itrForm, filingSection,
    basicSalary, salaryHRA, salaryDA, salaryBonus, salaryComm, salaryAllow, salaryPerq, profTax,
    isSelfOccupied, rentalIncome, municipalTaxes, housingLoanInterest,
    businessReceipts, businessExpenses, businessDepr,
    isPresumptive44AD, tradeName, businessCode, businessNature, receiptsCash, receiptsBanking, receiptsOther,
    isPresumptive44ADA, profTradeName, profCode, profNature, profReceiptsCash, profReceiptsBanking, profNormalReceipts, profNormalExpenses, profNormalDepr,
    stcgGeneral, stcgEquity, ltcgEquity, ltcgProperty,
    interestSavings, interestFD, dividends, pension, familyPension, lotteryIncome,
    sec80C, sec80CCD_1B, sec80D, sec80E, sec80G, sec80TTA, sec80TTB, otherDeductions,
    hraExemption, ltaExemption, agriculturalIncome, gratuity, leaveEncashment, vrsBenefits, otherExemptions,
    taxDeposits
  ]);

  // Parser and Handlers for Tax Deposits & Form 26AS
  const parse26ASText = (text: string) => {
    const deposits: any[] = [];
    const lines = text.split('\n');
    const tanRegex = /\b([A-Z]{4}[0-9]{5}[A-Z])\b/i;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const tanMatch = line.match(tanRegex);
      if (tanMatch) {
        const tan = tanMatch[1].toUpperCase();
        let name = 'Deductor u/s ' + tan;
        if (line.includes(tan)) {
          const parts = line.split(tan);
          if (parts[0].trim().length > 5) {
            name = parts[0].replace(/^[0-9\s|.\-]+/, '').trim();
          } else if (parts[1] && parts[1].trim().length > 5) {
            name = parts[1].split(/[0-9,\s]/)[0].trim();
          }
        }
        
        const amounts = line.match(/\b([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]+)?)\b/g);
        let taxAmount = 0;
        if (amounts && amounts.length >= 2) {
          const parsedAmts = amounts.map(a => parseFloat(a.replace(/,/g, '')));
          taxAmount = parsedAmts[parsedAmts.length - 1];
        } else {
          for (let j = 1; j <= 2; j++) {
            if (lines[i+j]) {
              const nextAmts = lines[i+j].match(/\b([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]+)?)\b/g);
              if (nextAmts && nextAmts.length > 0) {
                taxAmount = parseFloat(nextAmts[nextAmts.length - 1].replace(/,/g, ''));
                break;
              }
            }
          }
        }
        
        if (taxAmount > 0) {
          deposits.push({
            id: '26as-' + Math.random().toString(36).substr(2, 9),
            type: 'TDS',
            amount: taxAmount,
            deductorName: name,
            deductorTAN: tan,
            bankName: 'N/A',
            bsrCode: '',
            date: new Date().toISOString().split('T')[0],
            challanNo: ''
          });
        }
      }
    }
    
    if (deposits.length > 0) {
      setTaxDeposits(prev => [...prev, ...deposits]);
      alert(`Successfully parsed and added ${deposits.length} TDS entries from Form 26AS!`);
    } else {
      alert("Could not automatically parse any TDS entries. Make sure it contains valid TANs and Tax Deducted values, or enter them manually.");
    }
  };

  const handleJsonUpload = (fileContent: string) => {
    try {
      const obj = JSON.parse(fileContent);
      const parsedDeposits: any[] = [];
      
      const findTds = (val: any) => {
        if (!val || typeof val !== 'object') return;
        
        if (Array.isArray(val)) {
          val.forEach(item => {
            if (item && typeof item === 'object') {
              const tan = item.tan || item.TAN || item.deductorTan || item.deductorTAN;
              const amt = item.taxDeducted || item.tds || item.taxAmount || item.amount;
              if (tan && amt) {
                parsedDeposits.push({
                  id: '26as-' + Math.random().toString(36).substr(2, 9),
                  type: 'TDS',
                  amount: Number(amt),
                  deductorName: item.deductorName || item.name || 'Deductor u/s ' + tan,
                  deductorTAN: String(tan).toUpperCase(),
                  bankName: 'N/A',
                  bsrCode: '',
                  date: item.date || item.transactionDate || new Date().toISOString().split('T')[0],
                  challanNo: ''
                });
              } else {
                findTds(item);
              }
            }
          });
        } else {
          Object.keys(val).forEach(key => {
            findTds(val[key]);
          });
        }
      };
      
      findTds(obj);
      
      if (parsedDeposits.length > 0) {
        setTaxDeposits(prev => [...prev, ...parsedDeposits]);
        alert(`Successfully imported ${parsedDeposits.length} TDS entries from JSON file!`);
      } else {
        alert("Could not locate any valid TDS entries in the JSON structure. Please enter manually.");
      }
    } catch (e) {
      alert("Invalid JSON file format.");
    }
  };

  const handleAddDeposit = () => {
    const amt = parseFloat(depAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid deposit amount.');
      return;
    }
    
    if (depType === 'TDS') {
      if (!depDeductorTan || !/^[A-Z]{4}[0-9]{5}[A-Z]$/i.test(depDeductorTan.trim())) {
        alert('Please enter a valid 10-digit deductor TAN (e.g. DELM12345C).');
        return;
      }
    } else {
      if (depBsr && !/^[0-9A-Z]{5,7}$/i.test(depBsr.trim())) {
        alert('BSR Code must be 5 to 7 characters.');
        return;
      }
      if (depChallanNo && !/^[0-9]{1,7}$/i.test(depChallanNo.trim())) {
        alert('Challan number must be a valid number.');
        return;
      }
    }
    
    const newDep = {
      id: 'dep-' + Math.random().toString(36).substr(2, 9),
      type: depType,
      amount: amt,
      bsrCode: depBsr ? depBsr.trim().toUpperCase() : undefined,
      date: depDate || undefined,
      challanNo: depChallanNo ? depChallanNo.trim() : undefined,
      bankName: depBank ? depBank.trim() : undefined,
      deductorName: depType === 'TDS' ? (depDeductorName.trim() || 'Deductor') : undefined,
      deductorTAN: depType === 'TDS' ? depDeductorTan.trim().toUpperCase() : undefined
    };
    
    setTaxDeposits(prev => [...prev, newDep]);
    
    setDepAmount('');
    setDepBsr('');
    setDepDate('');
    setDepChallanNo('');
    setDepBank('');
    setDepDeductorName('');
    setDepDeductorTan('');
  };

  const handleDeleteDeposit = (id: string) => {
    setTaxDeposits(prev => prev.filter(d => d.id !== id));
  };

  const handleTextParse = () => {
    if (!raw26ASText.trim()) {
      alert('Please paste some text from Form 26AS first.');
      return;
    }
    parse26ASText(raw26ASText);
    setRaw26ASText('');
    setShow26ASUpload(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (file.name.endsWith('.json')) {
        handleJsonUpload(content);
      } else {
        parse26ASText(content);
      }
    };
    reader.readAsText(file);
  };

  // Save Computation to Server
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const inputs = assembleInputs();
      const url = editId 
        ? `${apiUrl}/tax/computation/${editId}` 
        : `${apiUrl}/tax/computation`;
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(inputs)
      });

      const data = await res.json();
      if (res.ok) {
        router.push(`/comparison?id=${data.computation.id}`);
      } else {
        alert(data.error || 'Failed to compile tax details');
      }
    } catch (err) {
      alert('Error contacting computation api');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row gap-8 items-start animate-fade-in-up">
        
        {/* ==================== WIZARD FORM VIEWPORT ==================== */}
        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs w-full">
          
          {/* Subtabs controls */}
          <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-2 overflow-x-auto gap-1">
            {[
              { id: 'info', label: '1. Settings', icon: Settings },
              { id: 'salary', label: '2. Salary Head', icon: Banknote },
              { id: 'property', label: '3. House Property', icon: Building2 },
              { id: 'business', label: '4. Business & Capital', icon: TrendingUp },
              { id: 'professional', label: '5. Professional Head', icon: Sparkles },
              { id: 'deductions', label: '6. Deductions', icon: Calculator },
              { id: 'taxDeposited', label: '7. Tax Deposited', icon: FileCheck }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                    activeSubTab === tab.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-6 md:p-8 space-y-6">
            
            {/* TAB 1: BASIC SETTINGS */}
            {activeSubTab === 'info' && (
              <div className="space-y-6">
                <h3 className="text-md font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3">
                  Assessment Year & Residency Slabs
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-bold text-slate-500">
                  <div className="space-y-1">
                    <label className="uppercase">Select Assessment Year</label>
                    <select
                      value={assessmentYear}
                      onChange={(e) => setAssessmentYear(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200"
                    >
                      <option value="2024-25">AY 2024-25 (FY 2023-24)</option>
                      <option value="2025-26">AY 2025-26 (FY 2024-25)</option>
                      <option value="2026-27">AY 2026-27 (FY 2025-26)</option>
                      <option value="2027-28">AY 2027-28 (FY 2026-27)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="uppercase">Residential Status</label>
                    <select
                      value={residentialStatus}
                      onChange={(e) => setResidentialStatus(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200"
                    >
                      <option value="Resident">Ordinary Resident (ROR)</option>
                      <option value="Non-Resident">Non-Resident (NRI)</option>
                      <option value="RNOR">Resident but Not Ordinary Resident</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="uppercase">Form No to file</label>
                    <select
                      value={itrForm}
                      onChange={(e) => setItrForm(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200"
                    >
                      <option value="ITR-1">ITR-1 (Sahaj)</option>
                      <option value="ITR-2">ITR-2</option>
                      <option value="ITR-3">ITR-3</option>
                      <option value="ITR-4">ITR-4 (Sugam)</option>
                      <option value="ITR-5">ITR-5</option>
                      <option value="ITR-6">ITR-6</option>
                      <option value="ITR-7">ITR-7</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="uppercase">Section to file under</label>
                    <select
                      value={filingSection}
                      onChange={(e) => setFilingSection(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200"
                    >
                      <option value="139(1)">Section 139(1) - On or before due date</option>
                      <option value="139(4)">Section 139(4) - Belated Return</option>
                      <option value="139(5)">Section 139(5) - Revised Return</option>
                      <option value="139(9)">Section 139(9) - In response to defective notice</option>
                      <option value="119(2)(b)">Section 119(2)(b) - Condonation of delay</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setActiveSubTab('salary')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm"
                  >
                    Next Tab
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: SALARY INCOME */}
            {activeSubTab === 'salary' && (
              <div className="space-y-6">
                <h3 className="text-md font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3">
                  Salary Head Inclusions & Exemptions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-500">
                  {[
                    { label: 'Basic Salary (Annual)', val: basicSalary, set: setBasicSalary },
                    { label: 'House Rent Allowance (HRA)', val: salaryHRA, set: setSalaryHRA },
                    { label: 'Dearness Allowance (DA)', val: salaryDA, set: setSalaryDA },
                    { label: 'Bonus / Incentives', val: salaryBonus, set: setSalaryBonus },
                    { label: 'Commission Received', val: salaryComm, set: setSalaryComm },
                    { label: 'Other Special Allowances', val: salaryAllow, set: setSalaryAllow },
                    { label: 'Perquisites Value', val: salaryPerq, set: setSalaryPerq },
                    { label: 'Professional Tax u/s 16(iii)', val: profTax, set: setProfTax }
                  ].map((field, idx) => (
                    <div key={idx} className="space-y-1">
                      <label className="uppercase">{field.label}</label>
                      <input
                        type="number"
                        value={field.val || ''}
                        onChange={(e) => field.set(Math.max(0, Number(e.target.value)))}
                        placeholder="₹ 0"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono text-sm"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => setActiveSubTab('info')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-lg border border-slate-200 dark:border-slate-800"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    onClick={() => setActiveSubTab('property')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm"
                  >
                    Next Tab
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: HOUSE PROPERTY */}
            {activeSubTab === 'property' && (
              <div className="space-y-6">
                <h3 className="text-md font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3">
                  House Property Particulars
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center gap-6 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
                    <span className="text-slate-500 uppercase">Property Status:</span>
                    <label className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="radio" name="hp_status" checked={isSelfOccupied}
                        onChange={() => setIsSelfOccupied(true)}
                        className="w-4 h-4"
                      />
                      Self Occupied
                    </label>
                    <label className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="radio" name="hp_status" checked={!isSelfOccupied}
                        onChange={() => setIsSelfOccupied(false)}
                        className="w-4 h-4"
                      />
                      Let Out (Rented)
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-500">
                    {!isSelfOccupied && (
                      <>
                        <div className="space-y-1">
                          <label className="uppercase">Gross Annual Rental Income</label>
                          <input
                            type="number"
                            value={rentalIncome || ''}
                            onChange={(e) => setRentalIncome(Math.max(0, Number(e.target.value)))}
                            placeholder="₹ 0"
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="uppercase">Municipal Taxes Paid</label>
                          <input
                            type="number"
                            value={municipalTaxes || ''}
                            onChange={(e) => setMunicipalTaxes(Math.max(0, Number(e.target.value)))}
                            placeholder="₹ 0"
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono text-sm"
                          />
                        </div>
                      </>
                    )}
                    <div className="space-y-1">
                      <label className="uppercase">Housing Loan Interest Paid u/s 24(b)</label>
                      <input
                        type="number"
                        value={housingLoanInterest || ''}
                        onChange={(e) => setHousingLoanInterest(Math.max(0, Number(e.target.value)))}
                        placeholder="₹ 0"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => setActiveSubTab('salary')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-lg border border-slate-200 dark:border-slate-800"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    onClick={() => setActiveSubTab('business')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm"
                  >
                    Next Tab
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: BUSINESS & CAPITAL GAINS */}
            {activeSubTab === 'business' && (
              <div className="space-y-6">
                
                {/* Business */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h4 className="font-bold text-slate-700 dark:text-slate-200 text-xs">Business Profits</h4>
                    <label className="flex items-center gap-1.5 font-bold text-3xs text-blue-600 dark:text-blue-400 cursor-pointer uppercase">
                      <input 
                        type="checkbox"
                        checked={isPresumptive44AD}
                        onChange={(e) => setIsPresumptive44AD(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500"
                      />
                      Presumptive Taxation (Sec 44AD)
                    </label>
                  </div>

                  {!isPresumptive44AD ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold text-slate-500 animate-fade-in-up">
                      <div className="space-y-1">
                        <label className="uppercase">Gross Receipts</label>
                        <input
                          type="number"
                          value={businessReceipts || ''}
                          onChange={(e) => setBusinessReceipts(Math.max(0, Number(e.target.value)))}
                          placeholder="₹ 0"
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="uppercase">Operational Expenses</label>
                        <input
                          type="number"
                          value={businessExpenses || ''}
                          onChange={(e) => setBusinessExpenses(Math.max(0, Number(e.target.value)))}
                          placeholder="₹ 0"
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="uppercase">Depreciation claimed</label>
                        <input
                          type="number"
                          value={businessDepr || ''}
                          onChange={(e) => setBusinessDepr(Math.max(0, Number(e.target.value)))}
                          placeholder="₹ 0"
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono text-sm"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-1 animate-fade-in-up text-xs font-bold text-slate-500">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-4">
                        <div className="space-y-1 md:col-span-2">
                          <div className="flex items-center justify-between">
                            <label className="uppercase">Select Business / Profession Code</label>
                            <button
                              type="button"
                              onClick={() => {
                                setModalTarget('business');
                                setShowSearchModal(true);
                              }}
                              className="text-blue-600 dark:text-blue-400 text-3xs font-extrabold hover:underline uppercase flex items-center gap-1"
                            >
                              🔍 Search All Codes
                            </button>
                          </div>
                          <select
                            value={businessCode}
                            onChange={(e) => {
                              const selected = taxBusinessCodes.find(b => b.code === e.target.value);
                              if (selected) {
                                setBusinessCode(selected.code);
                                setBusinessNature(selected.nature);
                              }
                            }}
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-medium"
                          >
                            <option value="" disabled>-- Select a code to auto-populate description --</option>
                            {taxBusinessCodes.map(b => (
                              <option key={b.code} value={b.code}>
                                {b.code} - {b.nature}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="uppercase">Business Nature Description</label>
                          <input
                            type="text"
                            value={businessNature}
                            onChange={(e) => setBusinessNature(e.target.value)}
                            placeholder="e.g. Civil Contractors"
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="uppercase">Business Code</label>
                          <input
                            type="text"
                            value={businessCode}
                            onChange={(e) => setBusinessCode(e.target.value)}
                            placeholder="e.g. 06002"
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono"
                          />
                        </div>

                        {businessCode === '06004' && (
                          <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl p-4 text-2xs text-slate-600 dark:text-slate-300 font-medium space-y-1.5 animate-fade-in-up md:col-span-2">
                            <p className="font-bold text-xs text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              Construction Code Selected: 06004 (Building completion activities)
                            </p>
                            <p>
                              Under Income Tax rules, the construction sector codes are:
                            </p>
                            <ul className="list-disc pl-4 space-y-0.5 font-mono text-3xs">
                              {taxBusinessCodes.filter(b => b.code.startsWith('06')).map(b => (
                                <li key={b.code} className={b.code === '06004' ? 'font-bold text-blue-600 dark:text-blue-400' : ''}>
                                  {b.code}: {b.nature}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="uppercase">Cash Receipts (8% taxable)</label>
                          <input
                            type="number"
                            value={receiptsCash || ''}
                            onChange={(e) => setReceiptsCash(Math.max(0, Number(e.target.value)))}
                            placeholder="₹ 0"
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="uppercase">Banking Receipts (6% taxable)</label>
                          <input
                            type="number"
                            value={receiptsBanking || ''}
                            onChange={(e) => setReceiptsBanking(Math.max(0, Number(e.target.value)))}
                            placeholder="₹ 0"
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="uppercase">Other Mode Receipts (8% taxable)</label>
                          <input
                            type="number"
                            value={receiptsOther || ''}
                            onChange={(e) => setReceiptsOther(Math.max(0, Number(e.target.value)))}
                            placeholder="₹ 0"
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono text-sm"
                          />
                        </div>
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-1">
                        <h5 className="font-bold text-slate-700 dark:text-slate-200 text-3xs uppercase mb-2">Financial Particulars (as on 31st March)</h5>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="space-y-1">
                            <label className="uppercase">Sundry Debtors</label>
                            <input
                              type="number"
                              value={sundryDebtors || ''}
                              onChange={(e) => setSundryDebtors(Math.max(0, Number(e.target.value)))}
                              placeholder="₹ 0"
                              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="uppercase">Sundry Creditors</label>
                            <input
                              type="number"
                              value={sundryCreditors || ''}
                              onChange={(e) => setSundryCreditors(Math.max(0, Number(e.target.value)))}
                              placeholder="₹ 0"
                              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="uppercase">Stock-in-trade</label>
                            <input
                              type="number"
                              value={stockInTrade || ''}
                              onChange={(e) => setStockInTrade(Math.max(0, Number(e.target.value)))}
                              placeholder="₹ 0"
                              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="uppercase">Cash Balance</label>
                            <input
                              type="number"
                              value={cashBalance || ''}
                              onChange={(e) => setCashBalance(Math.max(0, Number(e.target.value)))}
                              placeholder="₹ 0"
                              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Capital Gains */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-700 dark:text-slate-200 text-xs border-b border-slate-100 dark:border-slate-800 pb-2">Capital Gains</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-500">
                    <div className="space-y-1">
                      <label className="uppercase">STCG (Short Term Gains - General)</label>
                      <input
                        type="number"
                        value={stcgGeneral || ''}
                        onChange={(e) => setStcgGeneral(Math.max(0, Number(e.target.value)))}
                        placeholder="₹ 0"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="uppercase">STCG Equity Share Market u/s 111A</label>
                      <input
                        type="number"
                        value={stcgEquity || ''}
                        onChange={(e) => setStcgEquity(Math.max(0, Number(e.target.value)))}
                        placeholder="₹ 0"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="uppercase">LTCG Equity Share Market u/s 112A</label>
                      <input
                        type="number"
                        value={ltcgEquity || ''}
                        onChange={(e) => setLtcgEquity(Math.max(0, Number(e.target.value)))}
                        placeholder="₹ 0"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="uppercase">LTCG Land / Property Sale Gains</label>
                      <input
                        type="number"
                        value={ltcgProperty || ''}
                        onChange={(e) => setLtcgProperty(Math.max(0, Number(e.target.value)))}
                        placeholder="₹ 0"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => setActiveSubTab('property')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-lg border border-slate-200 dark:border-slate-800"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    onClick={() => setActiveSubTab('professional')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm"
                  >
                    Next Tab
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 5: PROFESSIONAL INCOME */}
            {activeSubTab === 'professional' && (
              <div className="space-y-6">
                
                {/* Professional */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h4 className="font-bold text-slate-700 dark:text-slate-200 text-xs">Professional Profits</h4>
                    <label className="flex items-center gap-1.5 font-bold text-3xs text-blue-600 dark:text-blue-400 cursor-pointer uppercase">
                      <input 
                        type="checkbox"
                        checked={isPresumptive44ADA}
                        onChange={(e) => setIsPresumptive44ADA(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500"
                      />
                      Presumptive Taxation (Sec 44ADA)
                    </label>
                  </div>

                  {!isPresumptive44ADA ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold text-slate-500 animate-fade-in-up">
                      <div className="space-y-1">
                        <label className="uppercase">Gross Receipts</label>
                        <input
                          type="number"
                          value={profNormalReceipts || ''}
                          onChange={(e) => setProfNormalReceipts(Math.max(0, Number(e.target.value)))}
                          placeholder="₹ 0"
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="uppercase">Operational Expenses</label>
                        <input
                          type="number"
                          value={profNormalExpenses || ''}
                          onChange={(e) => setProfNormalExpenses(Math.max(0, Number(e.target.value)))}
                          placeholder="₹ 0"
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="uppercase">Depreciation claimed</label>
                        <input
                          type="number"
                          value={profNormalDepr || ''}
                          onChange={(e) => setProfNormalDepr(Math.max(0, Number(e.target.value)))}
                          placeholder="₹ 0"
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono text-sm"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-1 animate-fade-in-up text-xs font-bold text-slate-500">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-4">
                        <div className="space-y-1 md:col-span-2">
                          <div className="flex items-center justify-between">
                            <label className="uppercase">Select Profession Code</label>
                            <button
                              type="button"
                              onClick={() => {
                                setModalTarget('professional');
                                setShowSearchModal(true);
                              }}
                              className="text-blue-600 dark:text-blue-400 text-3xs font-extrabold hover:underline uppercase flex items-center gap-1"
                            >
                              🔍 Search All Codes
                            </button>
                          </div>
                          <select
                            value={profCode}
                            onChange={(e) => {
                              const selected = taxBusinessCodes.find(b => b.code === e.target.value);
                              if (selected) {
                                setProfCode(selected.code);
                                setProfNature(selected.nature);
                              }
                            }}
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-medium"
                          >
                            <option value="" disabled>-- Select a code to auto-populate description --</option>
                            {taxBusinessCodes.filter(b => b.code.startsWith('16')).map(b => (
                              <option key={b.code} value={b.code}>
                                {b.code} - {b.nature}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="uppercase">Profession Description</label>
                          <input
                            type="text"
                            value={profNature}
                            onChange={(e) => setProfNature(e.target.value)}
                            placeholder="e.g. Software Development"
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="uppercase">Profession Code</label>
                          <input
                            type="text"
                            value={profCode}
                            onChange={(e) => setProfCode(e.target.value)}
                            placeholder="e.g. 16013"
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="uppercase">Cash Receipts</label>
                          <input
                            type="number"
                            value={profReceiptsCash || ''}
                            onChange={(e) => setProfReceiptsCash(Math.max(0, Number(e.target.value)))}
                            placeholder="₹ 0"
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="uppercase">Digital / Banking Receipts</label>
                          <input
                            type="number"
                            value={profReceiptsBanking || ''}
                            onChange={(e) => setProfReceiptsBanking(Math.max(0, Number(e.target.value)))}
                            placeholder="₹ 0"
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono text-sm"
                          />
                        </div>
                      </div>

                      <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-3.5 text-center text-2xs font-medium text-slate-600 dark:text-slate-300">
                        <span className="font-bold text-blue-600 dark:text-blue-400">Presumptive Income u/s 44ADA (50% of receipts):</span>{' '}
                        <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100 font-mono">
                          ₹ {Math.round((profReceiptsCash + profReceiptsBanking) * 0.5).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => setActiveSubTab('business')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-lg border border-slate-200 dark:border-slate-800"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    onClick={() => setActiveSubTab('deductions')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm"
                  >
                    Next Tab
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}


            {/* TAB 5: OTHER INCOME AND DEDUCTIONS */}
            {activeSubTab === 'deductions' && (
              <div className="space-y-6">
                
                {/* Other Sources */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-700 dark:text-slate-200 text-xs border-b border-slate-100 dark:border-slate-800 pb-2">Other Sources Income</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-500">
                    <div className="space-y-1">
                      <label className="uppercase">Savings Account Bank Interest</label>
                      <input
                        type="number"
                        value={interestSavings || ''}
                        onChange={(e) => setInterestSavings(Math.max(0, Number(e.target.value)))}
                        placeholder="₹ 0"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="uppercase">FD / Term Deposit Bank Interest</label>
                      <input
                        type="number"
                        value={interestFD || ''}
                        onChange={(e) => setInterestFD(Math.max(0, Number(e.target.value)))}
                        placeholder="₹ 0"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="uppercase">Dividend Income</label>
                      <input
                        type="number"
                        value={dividends || ''}
                        onChange={(e) => setDividends(Math.max(0, Number(e.target.value)))}
                        placeholder="₹ 0"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="uppercase">Lottery / Winning u/s 115BB</label>
                      <input
                        type="number"
                        value={lotteryIncome || ''}
                        onChange={(e) => setLotteryIncome(Math.max(0, Number(e.target.value)))}
                        placeholder="₹ 0"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-700 dark:text-slate-200 text-xs border-b border-slate-100 dark:border-slate-800 pb-2">Chapter VI-A Deductions (Old Regime Only)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-500">
                    <div className="space-y-1">
                      <label className="uppercase">Section 80C (LIC, PPF, ELSS, School Fees)</label>
                      <input
                        type="number"
                        value={sec80C || ''}
                        onChange={(e) => setSec80C(Math.max(0, Number(e.target.value)))}
                        placeholder="₹ 0"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="uppercase">Section 80CCD(1B) - NPS Pension</label>
                      <input
                        type="number"
                        value={sec80CCD_1B || ''}
                        onChange={(e) => setSec80CCD_1B(Math.max(0, Number(e.target.value)))}
                        placeholder="₹ 0"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="uppercase">Section 80D - Health Insurance Premium</label>
                      <input
                        type="number"
                        value={sec80D || ''}
                        onChange={(e) => setSec80D(Math.max(0, Number(e.target.value)))}
                        placeholder="₹ 0"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="uppercase">Section 80E - Education Loan Interest</label>
                      <input
                        type="number"
                        value={sec80E || ''}
                        onChange={(e) => setSec80E(Math.max(0, Number(e.target.value)))}
                        placeholder="₹ 0"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Taxes Paid & Late Fees */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 font-bold text-xs text-slate-700 dark:text-slate-200 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={hasChallan}
                        onChange={(e) => setHasChallan(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      Add Taxes Paid & Late Fees (Challan Details)
                    </label>
                  </div>

                  {hasChallan && (
                    <div className="space-y-4 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 animate-fade-in-up">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold text-slate-500">
                        <div className="space-y-1">
                          <label className="uppercase">BSR Code</label>
                          <input
                            type="text"
                            value={bsrCode}
                            onChange={(e) => setBsrCode(e.target.value)}
                            placeholder="e.g. 0180002"
                            className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="uppercase">Challan Number</label>
                          <input
                            type="text"
                            value={challanNo}
                            onChange={(e) => setChallanNo(e.target.value)}
                            placeholder="e.g. 00175"
                            className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="uppercase">Challan Date</label>
                          <input
                            type="date"
                            value={challanDate}
                            onChange={(e) => setChallanDate(e.target.value)}
                            className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-sans"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-500">
                        <div className="space-y-1">
                          <label className="uppercase">Self-Assessment Tax Paid</label>
                          <input
                            type="number"
                            value={selfAssessmentTax || ''}
                            onChange={(e) => setSelfAssessmentTax(Math.max(0, Number(e.target.value)))}
                            placeholder="₹ 0"
                            className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="uppercase">Late Fee u/s 234F (Interest/Fees)</label>
                          <input
                            type="number"
                            value={fee234F || ''}
                            onChange={(e) => setFee234F(Math.max(0, Number(e.target.value)))}
                            placeholder="₹ 0"
                            className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => setActiveSubTab('professional')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-lg border border-slate-200 dark:border-slate-800"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    onClick={() => setActiveSubTab('taxDeposited')}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-md cursor-pointer"
                  >
                    Next Step
                    <ChevronRight className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
            )}

            {activeSubTab === 'taxDeposited' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
                  <h3 className="text-md font-bold text-slate-800 dark:text-slate-200">
                    7. Tax Deposited / TDS Details
                  </h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShow26ASUpload(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold text-xs rounded-lg border border-blue-200 dark:border-blue-800/80 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Import Form 26AS
                    </button>
                  </div>
                </div>

                {show26ASUpload && (
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 animate-fade-in-up">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                        Upload or Paste Form 26AS (TDS)
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShow26ASUpload(false)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-4 flex flex-col items-center justify-center bg-white dark:bg-slate-900 text-center space-y-2">
                        <Upload className="w-8 h-8 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Upload Form 26AS JSON or TXT file
                        </span>
                        <input
                          type="file"
                          accept=".json,.txt"
                          onChange={handleFileUpload}
                          className="text-[10px] text-slate-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-slate-800 dark:file:text-slate-300"
                        />
                      </div>

                      <div className="space-y-2 flex flex-col">
                        <textarea
                          placeholder="Or paste raw text from Form 26AS here... (e.g. TAN, Deductor Name, Tax Deducted amount)"
                          value={raw26ASText}
                          onChange={(e) => setRaw26ASText(e.target.value)}
                          className="flex-1 w-full min-h-[100px] p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono text-xs"
                        />
                        <button
                          type="button"
                          onClick={handleTextParse}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg cursor-pointer"
                        >
                          Parse & Import TDS
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                    Add Tax Deposit Details (Manual Entry)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold text-slate-500">
                    <div className="space-y-1">
                      <label className="uppercase">Deposit Type</label>
                      <select
                        value={depType}
                        onChange={(e) => setDepType(e.target.value as any)}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-sans"
                      >
                        <option value="SelfAssessment">Self-Assessment Tax</option>
                        <option value="AdvanceTax">Advance Tax</option>
                        <option value="TDS">TDS (Tax Deducted at Source)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="uppercase">Amount (₹)</label>
                      <input
                        type="number"
                        value={depAmount}
                        onChange={(e) => setDepAmount(e.target.value)}
                        placeholder="₹ Amount"
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="uppercase">Deposit / Transaction Date</label>
                      <input
                        type="date"
                        value={depDate}
                        onChange={(e) => setDepDate(e.target.value)}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-sans"
                      />
                    </div>
                  </div>

                  {depType === 'TDS' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-500 animate-fade-in-up">
                      <div className="space-y-1">
                        <label className="uppercase">Deductor Name</label>
                        <input
                          type="text"
                          value={depDeductorName}
                          onChange={(e) => setDepDeductorName(e.target.value)}
                          placeholder="e.g. Acme Corp / Bank"
                          className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-sans"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="uppercase">Deductor TAN</label>
                        <input
                          type="text"
                          value={depDeductorTan}
                          onChange={(e) => setDepDeductorTan(e.target.value)}
                          placeholder="e.g. DELM12345C"
                          className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold text-slate-500 animate-fade-in-up">
                      <div className="space-y-1">
                        <label className="uppercase">Bank Name</label>
                        <input
                          type="text"
                          value={depBank}
                          onChange={(e) => setDepBank(e.target.value)}
                          placeholder="e.g. BRB Bank"
                          className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-sans"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="uppercase">BSR Code</label>
                        <input
                          type="text"
                          value={depBsr}
                          onChange={(e) => setDepBsr(e.target.value)}
                          placeholder="e.g. 0180002"
                          className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="uppercase">Challan Number</label>
                        <input
                          type="text"
                          value={depChallanNo}
                          onChange={(e) => setDepChallanNo(e.target.value)}
                          placeholder="e.g. 00175"
                          className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddDeposit}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer"
                    >
                      Add Deposit Record
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center justify-between">
                    <span>Deposited Tax Ledger</span>
                    <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded text-[10px]">
                      {taxDeposits.length} Records
                    </span>
                  </h4>

                  {taxDeposits.length === 0 ? (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                      No tax deposit or TDS records added yet. Use the manual form above or import from 26AS.
                    </div>
                  ) : (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                              <th className="p-3">Type</th>
                              <th className="p-3">Source / Bank</th>
                              <th className="p-3">BSR / TAN</th>
                              <th className="p-3">Challan / Date</th>
                              <th className="p-3 text-right">Amount</th>
                              <th className="p-3 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                            {taxDeposits.map((dep) => (
                              <tr key={dep.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                                <td className="p-3">
                                  <span className={`inline-flex px-2 py-0.5 rounded font-bold text-[10px] ${
                                    dep.type === 'TDS'
                                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                                      : dep.type === 'AdvanceTax'
                                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300'
                                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                  }`}>
                                    {dep.type === 'SelfAssessment' ? 'Self-Assessment' : dep.type === 'AdvanceTax' ? 'Advance Tax' : 'TDS'}
                                  </span>
                                </td>
                                <td className="p-3 font-sans">
                                  {dep.type === 'TDS' ? (dep.deductorName || 'Deductor') : (dep.bankName || 'BRB Bank')}
                                </td>
                                <td className="p-3 font-mono">
                                  {dep.type === 'TDS' ? dep.deductorTAN : (dep.bsrCode || 'N/A')}
                                </td>
                                <td className="p-3">
                                  {dep.type === 'TDS' 
                                    ? dep.date 
                                    : `${dep.challanNo || 'N/A'} (${dep.date || 'N/A'})`}
                                </td>
                                <td className="p-3 text-right font-mono font-bold text-slate-800 dark:text-slate-100">
                                  {formatCurrency(dep.amount)}
                                </td>
                                <td className="p-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteDeposit(dep.id)}
                                    className="p-1 hover:bg-red-50 dark:hover:bg-red-950/30 rounded text-red-600 dark:text-red-400 cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/20 p-3 flex justify-between items-center border-t border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span>Total Tax Deposited:</span>
                        <span className="font-mono text-sm text-blue-600 dark:text-blue-400">
                          {formatCurrency(taxDeposits.reduce((sum, d) => sum + d.amount, 0))}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('deductions')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleSubmit({ preventDefault: () => {} } as any)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-md cursor-pointer disabled:opacity-55"
                  >
                    {submitting ? 'Submitting...' : 'Save & Calculate tax'}
                    <ChevronRight className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ==================== REAL-TIME OVERLAY BAR ==================== */}
        <div className="w-full lg:w-80 shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-5 lg:sticky lg:top-24">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-blue-500" />
              Live Optimization Panel
            </h4>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          {liveOutput ? (
            <div className="space-y-4">
              
              {/* Slabs Side-by-Side */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-3xs font-bold text-slate-400 uppercase">Old Regime</span>
                  <p className="text-xs font-semibold text-slate-500 mt-1">Tax Payable</p>
                  <h5 className="font-extrabold text-sm text-slate-700 dark:text-slate-200">
                    {formatCurrency(liveOutput.oldRegime.totalTaxLiability)}
                  </h5>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-3xs font-bold text-slate-400 uppercase font-sans">New Regime</span>
                  <p className="text-xs font-semibold text-slate-500 mt-1">Tax Payable</p>
                  <h5 className="font-extrabold text-sm text-slate-700 dark:text-slate-200">
                    {formatCurrency(liveOutput.newRegime.totalTaxLiability)}
                  </h5>
                </div>
              </div>

              {/* Recommendation card */}
              <div className="bg-gradient-to-tr from-blue-50 to-sky-50 dark:from-blue-950/20 dark:to-sky-950/20 rounded-xl p-4 border border-blue-100 dark:border-blue-900/30 text-center space-y-2">
                <span className="text-3xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Recommended Regimen</span>
                <h4 className="text-md font-extrabold text-blue-800 dark:text-blue-300">
                  {liveOutput.recommendedRegime === 'New' ? 'NEW TAX REGIME (u/s 115BAC)' : 'OLD TAX REGIME'}
                </h4>
                
                <div className="border-t border-blue-200/55 dark:border-blue-900/40 pt-2 flex justify-between text-xs items-center">
                  <span className="text-slate-500 dark:text-slate-400">Total Tax Savings:</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(liveOutput.taxSaved)}
                  </span>
                </div>
              </div>

              {/* Custom SVG gauge showing savings fraction */}
              {/* Income Heads Breakdown */}
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-200/60 dark:border-slate-800 text-2xs space-y-2 text-left">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-3xs">Income Heads Summary (Old Regime)</span>
                <div className="space-y-1.5 font-medium text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span>Salary Income:</span>
                    <span className="font-semibold font-mono">{formatCurrency(liveOutput.oldRegime.grossSalary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>House Property:</span>
                    <span className="font-semibold font-mono">{formatCurrency(liveOutput.oldRegime.grossHouseProperty)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Business Income:</span>
                    <span className="font-semibold font-mono">{formatCurrency(liveOutput.oldRegime.grossBusiness)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Professional Income:</span>
                    <span className="font-semibold font-mono">{formatCurrency(liveOutput.oldRegime.grossProfessional)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Capital Gains:</span>
                    <span className="font-semibold font-mono">{formatCurrency(liveOutput.oldRegime.grossCapitalGains)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Other Sources:</span>
                    <span className="font-semibold font-mono">{formatCurrency(liveOutput.oldRegime.grossOtherSources)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 dark:border-slate-700/60 pt-1.5 font-bold text-slate-800 dark:text-slate-100">
                    <span>Gross Total Income:</span>
                    <span className="font-mono">{formatCurrency(liveOutput.oldRegime.totalGrossIncome)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center py-2">
                <svg width="120" height="60" viewBox="0 0 100 50" className="overflow-visible">
                  <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#e2e8f0" strokeWidth="10" strokeLinecap="round" />
                  {/* Active Savings Arc */}
                  <path 
                    d="M 10 50 A 40 40 0 0 1 90 50" fill="none" 
                    stroke="#0284c7" strokeWidth="10" strokeLinecap="round"
                    strokeDasharray="126"
                    // If savings is 0, dashoffset is 126, if high it covers up.
                    strokeDashoffset={Math.max(0, 126 - (liveOutput.taxSaved > 0 ? (Math.min(100, (liveOutput.taxSaved / Math.max(1, liveOutput.newRegime.totalTaxLiability)) * 100) / 100) * 126 : 0))}
                  />
                  <text x="50" y="44" textAnchor="middle" className="fill-slate-700 dark:fill-slate-300 text-3xs font-extrabold">LIVE PREVIEW</text>
                </svg>
              </div>

            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center">Fill out basic settings to view dynamic calculations u/s 115BAC.</p>
          )}

        </div>

      </div>

      {/* SEARCH BUSINESS CODES MODAL */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-2xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <div className="text-left">
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
                  Income Tax Department - Business & Profession Codes
                </h3>
                <p className="text-3xs font-semibold text-slate-400 uppercase mt-0.5">
                  Select a nature of {modalTarget === 'business' ? 'business' : 'profession'} code to auto-populate
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSearchModal(false);
                  setSearchQuery('');
                }}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 transition-colors text-xs font-bold"
              >
                Close
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50">
              <input
                type="text"
                placeholder="Search by code (e.g. 06004) or keyword (e.g. contractor, software)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-medium text-xs shadow-inner"
                autoFocus
              />
            </div>

            {/* Codes List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[50vh] text-left">
              {/* Grouped by category */}
              {Object.entries(
                taxBusinessCodes
                  .filter(b => {
                    // If searching professional, only show 16xxx codes
                    if (modalTarget === 'professional') {
                      return b.code.startsWith('16');
                    }
                    return true;
                  })
                  .filter(b => {
                    const query = searchQuery.toLowerCase().trim();
                    if (!query) return true;
                    return b.code.includes(query) || b.nature.toLowerCase().includes(query) || b.category.toLowerCase().includes(query);
                  })
                  .reduce((groups, item) => {
                    const cat = item.category;
                    if (!groups[cat]) groups[cat] = [];
                    groups[cat].push(item);
                    return groups;
                  }, {} as Record<string, typeof taxBusinessCodes>)
              ).map(([cat, codes]) => (
                <div key={cat} className="space-y-2">
                  <h4 className="text-3xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1">
                    {cat}
                  </h4>
                  <div className="grid grid-cols-1 gap-1.5">
                    {codes.map(b => (
                      <button
                        key={b.code}
                        type="button"
                        onClick={() => {
                          if (modalTarget === 'business') {
                            setBusinessCode(b.code);
                            setBusinessNature(b.nature);
                          } else {
                            setProfCode(b.code);
                            setProfNature(b.nature);
                          }
                          setShowSearchModal(false);
                          setSearchQuery('');
                        }}
                        className="flex items-center text-left p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-all text-xs text-slate-700 dark:text-slate-300 font-medium gap-3 group"
                      >
                        <span className="font-bold font-mono text-blue-600 dark:text-blue-400 group-hover:underline w-12 shrink-0">
                          {b.code}
                        </span>
                        <span className="flex-1">
                          {b.nature}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {taxBusinessCodes.filter(b => {
                if (modalTarget === 'professional') return b.code.startsWith('16');
                return true;
              }).filter(b => {
                const query = searchQuery.toLowerCase().trim();
                if (!query) return true;
                return b.code.includes(query) || b.nature.toLowerCase().includes(query) || b.category.toLowerCase().includes(query);
              }).length === 0 && (
                <div className="text-center py-8 text-slate-400 font-bold text-xs">
                  No matching business codes found. Try another search term.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

import { Suspense } from 'react';

export default function ComputationWizard() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center h-64 text-slate-400 font-semibold">
          Loading tax computation wizard...
        </div>
      </DashboardLayout>
    }>
      <ComputationWizardContent />
    </Suspense>
  );
}
