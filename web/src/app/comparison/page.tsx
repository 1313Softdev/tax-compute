'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '../../components/DashboardLayout';
import { useAuth } from '../providers';
import { useLanguage } from '../providers';
import { 
  FileDown, 
  ArrowLeft, 
  CheckCircle,
  HelpCircle,
  Building,
  AlertCircle,
  Pencil
} from 'lucide-react';

import { Suspense } from 'react';

function ComparisonPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, apiUrl } = useAuth();
  const { t } = useLanguage();
  
  const compId = searchParams.get('id');
  const printRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [compData, setCompData] = useState<any>(null);

  useEffect(() => {
    if (!token || !compId) return;

    const fetchDetails = async () => {
      try {
        const res = await fetch(`${apiUrl}/tax/computation/${compId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCompData(data);
        } else {
          router.push('/dashboard');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [token, compId]);


  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64 text-slate-400 font-semibold">
          Compiling comparative tax ledger...
        </div>
      </DashboardLayout>
    );
  }

  if (!compData) {
    return (
      <DashboardLayout>
        <div className="text-center text-red-500 font-semibold p-8">
          Failed to load tax computation details.
        </div>
      </DashboardLayout>
    );
  }

  const inputs = compData.inputs;
  const outputs = compData.outputs;
  const oldReg = outputs.oldRegime;
  const newReg = outputs.newRegime;

  return (
    <DashboardLayout>
      {/* CSS injection for print styling */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* ACTION BAR */}
        <div className="space-y-4 no-print">
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('back')} to Dashboard
          </button>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <button
                onClick={() => router.push(`/computation-wizard?edit=${compId}`)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
                Edit Computation
              </button>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-bold text-slate-400 mr-2">Export Report:</span>
              <a href={`${apiUrl}/reports/${compId}/pdf?regime=both&token=${token}`} target="_blank" rel="noopener noreferrer" className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                <FileDown className="w-4 h-4" /> Full Comparison PDF
              </a>
              <a href={`${apiUrl}/reports/${compId}/pdf?regime=old&token=${token}`} target="_blank" rel="noopener noreferrer" className="px-3.5 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                <FileDown className="w-4 h-4" /> Old Regime PDF
              </a>
              <a href={`${apiUrl}/reports/${compId}/pdf?regime=new&token=${token}`} target="_blank" rel="noopener noreferrer" className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                <FileDown className="w-4 h-4" /> New Regime PDF
              </a>
            </div>
          </div>
        </div>

        {/* ==================== CA COMPUTATION SHEET PRINT AREA ==================== */}
        <div 
          ref={printRef}
          id="print-area" 
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm space-y-8"
        >
          {/* HEADER */}
          <div className="text-center space-y-1.5 border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-xl md:text-2xl font-black text-blue-900 dark:text-blue-500 uppercase tracking-tight">
              Income Tax Computation Sheet
            </h2>
            <p className="text-xs text-slate-400">
              Assessment Year: {compData.assessmentYear} | Generated u/s 115BAC of the Income Tax Act, 1961
            </p>
          </div>

          {/* ASSESSEE PERSONAL BIO BOX */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <p className="text-slate-400">Name of the Assessee:</p>
              <p className="font-extrabold text-slate-800 dark:text-slate-200">{inputs.fullName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-400">Permanent Account Number (PAN):</p>
              <p className="font-extrabold text-slate-800 dark:text-slate-200 uppercase font-mono">{inputs.panNumber}</p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-400">Residential Status:</p>
              <p className="font-semibold text-slate-700 dark:text-slate-300">{inputs.residentialStatus}</p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-400">ITR Form to File / Section Code:</p>
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                {inputs.itrForm || 'ITR-1'} | Section {inputs.filingSection || '139(1)'}
              </p>
            </div>
            <div className="space-y-1 border-t border-slate-100 dark:border-slate-800 pt-3">
              <p className="text-slate-400">Regime Choice Recommendation:</p>
              <span className="inline-flex mt-1 px-2 py-0.5 rounded text-3xs font-black uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400">
                {compData.recommendedRegime === 'New' ? 'New Tax Regime' : 'Old Tax Regime'}
              </span>
            </div>
          </div>

          {/* SIDE-BY-SIDE RECONCILIATION TABLE */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs md:text-sm">
              <thead>
                <tr className="bg-blue-900 text-white font-bold border-b border-blue-950 text-2xs uppercase tracking-wider">
                  <th className="px-5 py-3.5">Particulars of Income / Deductions</th>
                  <th className="px-5 py-3.5 text-right w-36">Old Tax Regime</th>
                  <th className="px-5 py-3.5 text-right w-36">New Tax Regime</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                
                {/* SALARY */}
                <tr>
                  <td className="px-5 py-3">1. Income from Salary (Gross)</td>
                  <td className="px-5 py-3 text-right font-mono">{formatCurrency(oldReg.grossSalary)}</td>
                  <td className="px-5 py-3 text-right font-mono">{formatCurrency(newReg.grossSalary)}</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 text-slate-400">   Less: HRA & Other Exemptions u/s 10</td>
                  <td className="px-5 py-3 text-right font-mono text-slate-500">({formatCurrency(oldReg.exemptionsApplied)})</td>
                  <td className="px-5 py-3 text-right font-mono text-slate-500">({formatCurrency(newReg.exemptionsApplied)})</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 text-slate-400">   Less: Professional Tax u/s 16(iii)</td>
                  <td className="px-5 py-3 text-right font-mono text-slate-500">({formatCurrency(oldReg.regime === 'Old' ? inputs.salary.professionalTax : 0)})</td>
                  <td className="px-5 py-3 text-right font-mono text-slate-500">(₹0)</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 text-slate-400">   Less: Standard Deduction u/s 16(ia)</td>
                  <td className="px-5 py-3 text-right font-mono text-slate-500">({formatCurrency(oldReg.standardDeductionApplied)})</td>
                  <td className="px-5 py-3 text-right font-mono text-slate-500">({formatCurrency(newReg.standardDeductionApplied)})</td>
                </tr>

                {/* HP */}
                <tr>
                  <td className="px-5 py-3">2. Income from House Property</td>
                  <td className="px-5 py-3 text-right font-mono">{formatCurrency(oldReg.grossHouseProperty)}</td>
                  <td className="px-5 py-3 text-right font-mono">{formatCurrency(newReg.grossHouseProperty)}</td>
                </tr>

                {/* BUSINESS */}
                <tr>
                  <td className="px-5 py-3">3. Profits & Gains of Business</td>
                  <td className="px-5 py-3 text-right font-mono">{formatCurrency(oldReg.grossBusiness)}</td>
                  <td className="px-5 py-3 text-right font-mono">{formatCurrency(newReg.grossBusiness)}</td>
                </tr>

                {/* PROFESSIONAL */}
                <tr>
                  <td className="px-5 py-3">4. Profits & Gains of Profession (Sec 44ADA / Others)</td>
                  <td className="px-5 py-3 text-right font-mono">{formatCurrency(oldReg.grossProfessional || 0)}</td>
                  <td className="px-5 py-3 text-right font-mono">{formatCurrency(newReg.grossProfessional || 0)}</td>
                </tr>

                {/* CAPITAL GAINS */}
                <tr>
                  <td className="px-5 py-3">5. Capital Gains (Short + Long Term)</td>
                  <td className="px-5 py-3 text-right font-mono">{formatCurrency(oldReg.grossCapitalGains)}</td>
                  <td className="px-5 py-3 text-right font-mono">{formatCurrency(newReg.grossCapitalGains)}</td>
                </tr>

                {/* OTHER */}
                <tr>
                  <td className="px-5 py-3">6. Income from Other Sources (Interest, Dividends etc.)</td>
                  <td className="px-5 py-3 text-right font-mono">{formatCurrency(oldReg.grossOtherSources)}</td>
                  <td className="px-5 py-3 text-right font-mono">{formatCurrency(newReg.grossOtherSources)}</td>
                </tr>

                {/* GTI */}
                <tr className="bg-slate-50 dark:bg-slate-800/40 font-bold text-slate-900 dark:text-slate-100">
                  <td className="px-5 py-3">GROSS TOTAL INCOME (GTI)</td>
                  <td className="px-5 py-3 text-right font-mono">{formatCurrency(oldReg.totalGrossIncome)}</td>
                  <td className="px-5 py-3 text-right font-mono">{formatCurrency(newReg.totalGrossIncome)}</td>
                </tr>

                {/* DEDUCTIONS */}
                <tr>
                  <td className="px-5 py-3">Less: Chapter VI-A Deductions (80C, 80D etc.)</td>
                  <td className="px-5 py-3 text-right font-mono text-slate-500">({formatCurrency(oldReg.deductionsApplied)})</td>
                  <td className="px-5 py-3 text-right font-mono text-slate-500">({formatCurrency(newReg.deductionsApplied)})</td>
                </tr>

                {/* NET TAXABLE */}
                <tr className="bg-slate-50 dark:bg-slate-800/40 font-bold text-slate-900 dark:text-slate-100 border-t-2">
                  <td className="px-5 py-3">NET TAXABLE INCOME</td>
                  <td className="px-5 py-3 text-right font-mono">{formatCurrency(oldReg.netTaxableIncome)}</td>
                  <td className="px-5 py-3 text-right font-mono">{formatCurrency(newReg.netTaxableIncome)}</td>
                </tr>

                {/* TAX BEFORE REBATE */}
                <tr>
                  <td className="px-5 py-3">Gross Tax Payable (Slab + Special Rates)</td>
                  <td className="px-5 py-3 text-right font-mono">{formatCurrency(oldReg.taxBeforeRebate)}</td>
                  <td className="px-5 py-3 text-right font-mono">{formatCurrency(newReg.taxBeforeRebate)}</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 text-slate-400">   Less: Rebate u/s 87A</td>
                  <td className="px-5 py-3 text-right font-mono text-slate-500">({formatCurrency(oldReg.rebate87A)})</td>
                  <td className="px-5 py-3 text-right font-mono text-slate-500">({formatCurrency(newReg.rebate87A)})</td>
                </tr>

                {/* TAX AFTER REBATE */}
                <tr className="font-semibold text-slate-900 dark:text-slate-100">
                  <td className="px-5 py-3">Tax Liability after Rebate</td>
                  <td className="px-5 py-3 text-right font-mono">{formatCurrency(oldReg.taxAfterRebate)}</td>
                  <td className="px-5 py-3 text-right font-mono">{formatCurrency(newReg.taxAfterRebate)}</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 text-slate-400">   Add: Surcharge</td>
                  <td className="px-5 py-3 text-right font-mono">{formatCurrency(oldReg.surcharge)}</td>
                  <td className="px-5 py-3 text-right font-mono">{formatCurrency(newReg.surcharge)}</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 text-slate-400">   Add: Health & Education Cess (4%)</td>
                  <td className="px-5 py-3 text-right font-mono">{formatCurrency(oldReg.cess)}</td>
                  <td className="px-5 py-3 text-right font-mono">{formatCurrency(newReg.cess)}</td>
                </tr>

                {/* TOTAL */}
                <tr className="bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 font-extrabold text-sm border-t-2">
                  <td className="px-5 py-3.5">TOTAL TAX LIABILITY (u/s 288B)</td>
                  <td className="px-5 py-3.5 text-right font-mono">{formatCurrency(oldReg.totalTaxLiability)}</td>
                  <td className="px-5 py-3.5 text-right font-mono">{formatCurrency(newReg.totalTaxLiability)}</td>
                </tr>

                {/* TAXES PAID */}
                <tr className="text-slate-600 dark:text-slate-400">
                  <td className="px-5 py-3 font-semibold">Less: Total Taxes Deposited / Paid</td>
                  <td className="px-5 py-3 text-right font-mono font-semibold">({formatCurrency(oldReg.totalTaxesPaid || 0)})</td>
                  <td className="px-5 py-3 text-right font-mono font-semibold">({formatCurrency(newReg.totalTaxesPaid || 0)})</td>
                </tr>
                <tr className="text-xs text-slate-500 dark:text-slate-400">
                  <td className="px-5 py-2 pl-8">   - Self-Assessment Tax</td>
                  <td className="px-5 py-2 text-right font-mono">{formatCurrency(oldReg.totalSelfAssessment || 0)}</td>
                  <td className="px-5 py-2 text-right font-mono">{formatCurrency(newReg.totalSelfAssessment || 0)}</td>
                </tr>
                <tr className="text-xs text-slate-500 dark:text-slate-400">
                  <td className="px-5 py-2 pl-8">   - Advance Tax</td>
                  <td className="px-5 py-2 text-right font-mono">{formatCurrency(oldReg.totalAdvanceTax || 0)}</td>
                  <td className="px-5 py-2 text-right font-mono">{formatCurrency(newReg.totalAdvanceTax || 0)}</td>
                </tr>
                <tr className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <td className="px-5 py-2 pl-8">   - TDS Deducted</td>
                  <td className="px-5 py-2 text-right font-mono">{formatCurrency(oldReg.totalTDS || 0)}</td>
                  <td className="px-5 py-2 text-right font-mono">{formatCurrency(newReg.totalTDS || 0)}</td>
                </tr>

                {/* NET PAYABLE / REFUND */}
                <tr className={`font-extrabold text-sm border-t-2 ${
                  newReg.netTaxPayableOrRefund > 0 
                    ? 'text-red-600 dark:text-red-400 bg-red-50/30 dark:bg-red-950/20' 
                    : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20'
                }`}>
                  <td className="px-5 py-3.5">NET TAX PAYABLE / (REFUND)</td>
                  <td className="px-5 py-3.5 text-right font-mono">
                    {oldReg.netTaxPayableOrRefund > 0 
                      ? formatCurrency(oldReg.netTaxPayableOrRefund) 
                      : `(${formatCurrency(Math.abs(oldReg.netTaxPayableOrRefund))})`}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono">
                    {newReg.netTaxPayableOrRefund > 0 
                      ? formatCurrency(newReg.netTaxPayableOrRefund) 
                      : `(${formatCurrency(Math.abs(newReg.netTaxPayableOrRefund))})`}
                  </td>
                </tr>

              </tbody>
            </table>
          </div>

          {/* SAVINGS HIGHLIGHT BOX */}
          <div className="flex items-center gap-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl p-5 text-emerald-800 dark:text-emerald-400 text-xs">
            <CheckCircle className="w-7 h-7 text-emerald-500 shrink-0" />
            <div>
              <h4 className="font-extrabold text-sm">Optimal Tax Strategy Recommendation</h4>
              <p className="mt-0.5 leading-relaxed">
                By choosing the **{compData.recommendedRegime === 'New' ? 'NEW TAX REGIME (u/s 115BAC)' : 'OLD TAX REGIME'}**, you will save a total of **{formatCurrency(compData.taxSaved)}** in taxes for Assessment Year {compData.assessmentYear}. Make sure to select this regime option when filing your returns on the Income Tax e-filing utility portal.
              </p>
            </div>
          </div>


        </div>

      </div>
    </DashboardLayout>
  );
}

export default function ComparisonPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-slate-400 font-semibold">Compiling comparative tax ledger...</div>}>
      <ComparisonPageContent />
    </Suspense>
  );
}
