'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Calculator, 
  ArrowRight, 
  Percent, 
  HelpCircle, 
  TrendingUp, 
  BookOpen,
  CheckCircle,
  Building,
  UserCheck,
  Bot
} from 'lucide-react';
import { useLanguage } from './providers';

export default function HomePage() {
  const { language, setLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'hra' | 'tds' | 'advance'>('hra');
  const [faqs, setFaqs] = useState<any[]>([]);

  // 1. HRA CALCULATOR STATE
  const [hraBasic, setHraBasic] = useState(50000);
  const [hraReceived, setHraReceived] = useState(20000);
  const [hraRent, setHraRent] = useState(15000);
  const [hraMetro, setHraMetro] = useState(false);

  // 2. TDS CALCULATOR STATE
  const [tdsCategory, setTdsCategory] = useState<'194C' | '194J' | '194I' | '192'>('194J');
  const [tdsAmount, setTdsAmount] = useState(100000);

  // 3. ADVANCE TAX STATE
  const [advIncome, setAdvIncome] = useState(800000);
  const [advDeductions, setAdvDeductions] = useState(150000);

  // Fetch FAQs from API on mount
  useEffect(() => {
    fetch('/api/cms/faqs')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error();
      })
      .then(data => setFaqs(data))
      .catch(() => {
        // Fallback FAQs
        setFaqs([
          {
            id: 1,
            question: "Which tax regime is better: Old or New?",
            answer: "The New Regime has lower rates but disallows most deductions. Generally, if you claim deductions (like 80C, 80D, HRA) exceeding ₹2.5-3 Lakhs, the Old Regime may be better.",
            category: "General"
          },
          {
            id: 2,
            question: "What is the standard deduction for AY 2025-26?",
            answer: "For AY 2025-26 (Budget 2024), standard deduction for salaried individuals is ₹50,000 under the Old Regime and ₹75,000 under the New Regime.",
            category: "Deductions"
          }
        ]);
      });
  }, []);

  // Compute HRA Exemption
  const getHRAExemption = () => {
    const excessRent = Math.max(0, hraRent - (0.10 * hraBasic));
    const cap = hraMetro ? (0.50 * hraBasic) : (0.40 * hraBasic);
    const exempt = Math.min(hraReceived, excessRent, cap);
    const taxable = Math.max(0, hraReceived - exempt);
    return { exempt, taxable };
  };

  // Compute TDS
  const getTdsDetails = () => {
    let rate = 0;
    let section = '';
    let categoryName = '';
    
    if (tdsCategory === '194C') {
      rate = 2; // 2% for company contracts
      section = 'Section 194C';
      categoryName = 'Contractors / Sub-contractors';
    } else if (tdsCategory === '194J') {
      rate = 10; // 10% for professional services
      section = 'Section 194J';
      categoryName = 'Professional / Technical Fees';
    } else if (tdsCategory === '194I') {
      rate = 10; // 10% for Rent on land/building
      section = 'Section 194I';
      categoryName = 'Rent (Land, Building or Furniture)';
    } else {
      rate = 15; // Average slab rate simulation
      section = 'Section 192';
      categoryName = 'Salary (Estimated TDS rate)';
    }

    const payable = (tdsAmount * rate) / 100;
    return { rate, section, categoryName, payable };
  };

  // Compute Advance Tax Liability
  const getAdvanceTaxTimeline = () => {
    // Basic Slab simulation (Resident individual under 60, Old Regime)
    const netTaxable = Math.max(0, advIncome - advDeductions);
    let tax = 0;
    if (netTaxable > 1000000) {
      tax = 112500 + (netTaxable - 1000000) * 0.30;
    } else if (netTaxable > 500000) {
      tax = 12500 + (netTaxable - 500000) * 0.20;
    } else if (netTaxable > 250000) {
      tax = (netTaxable - 250000) * 0.05;
    }

    // Apply 87A rebate
    if (netTaxable <= 500000) {
      tax = 0;
    }

    const cess = tax * 0.04;
    const totalTax = tax + cess;

    return {
      totalTax,
      june15: totalTax * 0.15,
      sept15: totalTax * 0.45,
      dec15: totalTax * 0.75,
      march15: totalTax * 1.00
    };
  };

  const hraExemp = getHRAExemption();
  const tdsInfo = getTdsDetails();
  const advTax = getAdvanceTaxTimeline();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 transition-colors">
      {/* -------------------- NAVBAR -------------------- */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="TaxCompute.in" className="w-9 h-9 rounded-lg object-cover shadow-sm" />
          <span className="text-xl font-black bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent tracking-tight">
            TaxCompute<span className="text-blue-600 font-semibold">.in</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            className="text-xs bg-slate-100 border border-slate-200 rounded-lg px-2 py-1.5 outline-none cursor-pointer"
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
            <option value="pa">ਪੰਜਾਬੀ</option>
          </select>

          <Link href="/auth" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">
            {t('login')}
          </Link>
          
          <Link href="/auth?register=true" className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm">
            {t('register')}
          </Link>
        </div>
      </nav>

      {/* -------------------- HERO SECTION -------------------- */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-white to-slate-50 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            Compliant with AY 2024-25 through AY 2027-28
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            {t('homeTitle')}
          </h1>
          <p className="text-md md:text-lg text-slate-600 max-w-2xl mx-auto">
            {t('homeSub')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link 
              href="/auth?register=true" 
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transform hover:-translate-y-0.5 transition-all"
            >
              {t('getStarted')}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a 
              href="#calculators"
              className="px-6 py-3 rounded-lg text-sm font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 transition-all"
            >
              Try Quick Calculators
            </a>
          </div>
        </div>
      </section>

      {/* -------------------- INTERACTIVE CALCULATORS -------------------- */}
      <section id="calculators" className="max-w-5xl mx-auto w-full px-6 py-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800">Quick Tools</h2>
          <p className="text-slate-500 text-sm">Calculate allowances, withholding taxes and installments instantly.</p>
        </div>

        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 mb-8 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('hra')}
            className={`flex-1 py-3 text-center text-sm font-semibold transition-all ${
              activeTab === 'hra' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            HRA Exemption
          </button>
          <button
            onClick={() => setActiveTab('tds')}
            className={`flex-1 py-3 text-center text-sm font-semibold transition-all ${
              activeTab === 'tds' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            TDS Calculator
          </button>
          <button
            onClick={() => setActiveTab('advance')}
            className={`flex-1 py-3 text-center text-sm font-semibold transition-all ${
              activeTab === 'advance' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Advance Tax
          </button>
        </div>

        {/* Tab Content Cards */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
          {activeTab === 'hra' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Form Input */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Building className="w-5 h-5 text-blue-500" />
                  House Rent Allowance (HRA) Parameters
                </h3>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">BASIC SALARY + DA (Monthly)</label>
                  <input
                    type="range" min="10000" max="200000" step="5000"
                    value={hraBasic} onChange={(e) => setHraBasic(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs font-bold text-slate-700 mt-1">
                    <span>₹10,000</span>
                    <span className="text-blue-600">₹{hraBasic.toLocaleString('en-IN')}</span>
                    <span>₹2,00,000</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">ACTUAL HRA RECEIVED (Monthly)</label>
                  <input
                    type="range" min="2000" max="100000" step="1000"
                    value={hraReceived} onChange={(e) => setHraReceived(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs font-bold text-slate-700 mt-1">
                    <span>₹2,000</span>
                    <span className="text-blue-600">₹{hraReceived.toLocaleString('en-IN')}</span>
                    <span>₹1,00,000</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">ACTUAL RENT PAID (Monthly)</label>
                  <input
                    type="range" min="2000" max="100000" step="1000"
                    value={hraRent} onChange={(e) => setHraRent(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs font-bold text-slate-700 mt-1">
                    <span>₹2,000</span>
                    <span className="text-blue-600">₹{hraRent.toLocaleString('en-IN')}</span>
                    <span>₹1,00,000</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <input
                    type="checkbox" id="metro-check" checked={hraMetro}
                    onChange={(e) => setHraMetro(e.target.checked)}
                    className="w-4.5 h-4.5 text-blue-600 border-slate-300 rounded"
                  />
                  <label htmlFor="metro-check" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Lives in a Metro City (Delhi, Mumbai, Chennai, Kolkata)
                  </label>
                </div>
              </div>

              {/* Display Result */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col justify-center text-center space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500">EXEMPT HRA (Monthly Exemption)</p>
                  <h4 className="text-3xl font-extrabold text-emerald-600">₹{hraExemp.exempt.toLocaleString('en-IN')}</h4>
                </div>
                <div className="border-t border-slate-200 pt-4">
                  <p className="text-xs font-semibold text-slate-500">TAXABLE HRA (Monthly Add-on)</p>
                  <h4 className="text-2xl font-bold text-rose-500">₹{hraExemp.taxable.toLocaleString('en-IN')}</h4>
                </div>
                <p className="text-2xs text-slate-400">
                  *Exemption calculated u/s 10(13A). Exempt HRA can only be claimed in the Old Tax Regime.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'tds' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Form Input */}
              <div className="space-y-6">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Percent className="w-5 h-5 text-blue-500" />
                  Tax Deducted at Source (TDS) Selector
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">SELECT CATEGORY OF PAYMENT</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: '194J', label: '194J - Professional' },
                      { id: '194I', label: '194I - House Rent' },
                      { id: '194C', label: '194C - Contract' },
                      { id: '192', label: '192 - Salary Info' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setTdsCategory(item.id as any)}
                        className={`px-3 py-2 text-xs font-semibold border rounded-lg transition-all ${
                          tdsCategory === item.id 
                            ? 'border-blue-600 bg-blue-50 text-blue-600' 
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">BILL / PAYMENT AMOUNT (Gross)</label>
                  <input
                    type="range" min="5000" max="1000000" step="5000"
                    value={tdsAmount} onChange={(e) => setTdsAmount(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs font-bold text-slate-700 mt-1">
                    <span>₹5,000</span>
                    <span className="text-blue-600">₹{tdsAmount.toLocaleString('en-IN')}</span>
                    <span>₹10,00,000</span>
                  </div>
                </div>
              </div>

              {/* Display Result */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col justify-center text-center space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500">{tdsInfo.section} - {tdsInfo.categoryName}</p>
                  <h4 className="text-md font-bold text-slate-700">TDS Rate: {tdsInfo.rate}%</h4>
                </div>
                <div className="border-t border-slate-200 pt-4">
                  <p className="text-xs font-semibold text-slate-500">ESTIMATED TDS AMOUNT</p>
                  <h4 className="text-3xl font-extrabold text-blue-600">₹{tdsInfo.payable.toLocaleString('en-IN')}</h4>
                </div>
                <p className="text-2xs text-slate-400">
                  *Computed values are approximate. Surcharge and cess might apply if thresholds are crossed.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'advance' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Form Input */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  Advance Tax Computation
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">ESTIMATED ANNUAL INCOME</label>
                  <input
                    type="range" min="100000" max="3000000" step="50000"
                    value={advIncome} onChange={(e) => setAdvIncome(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs font-bold text-slate-700 mt-1">
                    <span>₹1,00,000</span>
                    <span className="text-blue-600">₹{advIncome.toLocaleString('en-IN')}</span>
                    <span>₹30,00,000</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">CLAIMED INVESTMENTS (Deductions)</label>
                  <input
                    type="range" min="0" max="300000" step="10000"
                    value={advDeductions} onChange={(e) => setAdvDeductions(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs font-bold text-slate-700 mt-1">
                    <span>₹0</span>
                    <span className="text-blue-600">₹{advDeductions.toLocaleString('en-IN')}</span>
                    <span>₹3,00,000</span>
                  </div>
                </div>
              </div>

              {/* Display Result */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                <div className="text-center pb-2 border-b border-slate-200">
                  <span className="text-2xs font-bold text-slate-400">TOTAL ESTIMATED ANNUAL TAX</span>
                  <h4 className="text-xl font-extrabold text-slate-800">₹{advTax.totalTax.toLocaleString('en-IN')}</h4>
                </div>
                
                <p className="text-2xs font-bold text-slate-400 uppercase">Instalment Schedule u/s 211:</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between py-1 bg-white px-2.5 rounded border border-slate-150">
                    <span className="text-slate-500">15% by June 15:</span>
                    <span className="font-bold text-slate-800">₹{advTax.june15.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1 bg-white px-2.5 rounded border border-slate-150">
                    <span className="text-slate-500">45% by Sept 15:</span>
                    <span className="font-bold text-slate-800">₹{advTax.sept15.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1 bg-white px-2.5 rounded border border-slate-150">
                    <span className="text-slate-500">75% by Dec 15:</span>
                    <span className="font-bold text-slate-800">₹{advTax.dec15.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1 bg-white px-2.5 rounded border border-slate-150">
                    <span className="text-slate-500">100% by March 15:</span>
                    <span className="font-bold text-slate-800">₹{advTax.march15.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* -------------------- DYNAMIC FAQS / CMS -------------------- */}
      <section className="bg-white border-t border-slate-200 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold text-slate-900 flex items-center justify-center gap-2">
              <HelpCircle className="w-6 h-6 text-blue-600" />
              Frequently Asked Questions (FAQs)
            </h2>
            <p className="text-slate-500 text-sm mt-1">Get instant answers regarding Indian Tax Slabs, Exemptions, and filings.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq, idx) => (
              <div key={faq.id || idx} className="p-5 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors">
                <span className="text-2xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                  {faq.category || 'Tax Info'}
                </span>
                <h4 className="font-bold text-slate-800 mt-2 text-sm">{faq.question}</h4>
                <p className="text-slate-600 text-xs mt-1.5 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------- FOOTER -------------------- */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6 border-t border-slate-800 mt-auto text-center text-xs">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-center gap-2.5">
            <img src="/logo.png" alt="TaxCompute.in" className="w-6 h-6 rounded-md object-cover shadow-xs" />
            <span className="font-black text-white text-sm tracking-tight">
              TaxCompute<span className="text-blue-500">.in</span>
            </span>
          </div>
          <p>© 2026 TaxCompute Portal. Developed strictly under Indian Income Tax Act guidelines. All Rights Reserved.</p>
          <div className="flex justify-center gap-6">
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">CA Verification API</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
