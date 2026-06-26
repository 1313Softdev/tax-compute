'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '../../components/DashboardLayout';
import { useAuth } from '../providers';
import { useLanguage } from '../providers';
import { 
  Plus, 
  FileText, 
  TrendingUp, 
  FileDown, 
  Trash2, 
  AlertCircle,
  Newspaper,
  FileJson,
  Lock
} from 'lucide-react';

export default function UserDashboard() {
  const router = useRouter();
  const { token, profile, apiUrl } = useAuth();
  const { t } = useLanguage();

  const [computations, setComputations] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Change Password States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setUpdatingPassword(true);
    try {
      const res = await fetch(`${apiUrl}/auth/change-password`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordSuccess('Password updated successfully!');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(data.error || 'Failed to update password');
      }
    } catch (err) {
      setPasswordError('Failed to connect to the server');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const [selectedComp, setSelectedComp] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [selectedRegime, setSelectedRegime] = useState<'old' | 'new'>('new');

  const generateITRJson = (detail: any, regime: 'old' | 'new', userProfile: any) => {
    const inputs = detail.inputs;
    const outputs = detail.outputs;
    const activeRegimeOutput = regime === 'new' ? outputs.newRegime : outputs.oldRegime;

    const pan = userProfile?.panNumber || inputs.panNumber || 'ABCDE1234F';
    const aadhaar = userProfile?.aadhaarNumber || inputs.aadhaarNumber || '123456789012';
    const name = userProfile?.fullName || inputs.fullName || 'Assessee';
    
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Taxpayer';
    const surName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
    const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';

    const dob = userProfile?.dateOfBirth || inputs.dateOfBirth || '1990-01-01';
    const gender = userProfile?.gender || inputs.gender || 'Male';
    const mobile = userProfile?.phone || inputs.phone || '9999999999';
    const email = userProfile?.email || inputs.email || 'name@company.com';

    const ayYear = detail.assessmentYear.split('-')[0];
    const section115BAC = regime === 'new' ? 'N' : 'Y';

    const sectionMapping: Record<string, string> = {
      '139(1)': '11',
      '139(4)': '12',
      '139(5)': '13',
      '139(9)': '14',
      '119(2)(b)': '15'
    };
    const sectionCode = sectionMapping[inputs.filingSection] || '11';
    const formType = (inputs.itrForm || 'ITR-1').replace('-', '');

    const bizInfo = inputs.business && inputs.business.isPresumptive44AD ? {
      TradeName: inputs.business.tradeName || name,
      BusinessNature: inputs.business.businessNature || 'Other services',
      BusinessCode: inputs.business.businessCode || '06002',
      ReceiptsCash: inputs.business.receiptsCash || 0,
      ReceiptsBanking: inputs.business.receiptsBanking || 0,
      ReceiptsOther: inputs.business.receiptsOther || 0,
      PresumptiveIncome: activeRegimeOutput.grossBusiness || 0
    } : null;

    const profInfo = inputs.professional && inputs.professional.isPresumptive44ADA ? {
      TradeName: inputs.professional.tradeName || name,
      ProfessionNature: inputs.professional.professionNature || 'Other services',
      ProfessionCode: inputs.professional.professionCode || '16013',
      ReceiptsCash: inputs.professional.receiptsCash || 0,
      ReceiptsBanking: inputs.professional.receiptsBanking || 0,
      PresumptiveIncome: activeRegimeOutput.grossProfessional || 0
    } : null;

    const body: any = {
      PersonalInfo: {
        AssesseeName: {
          FirstName: firstName,
          MiddleName: middleName,
          SurName: surName
        },
        PAN: pan.toUpperCase(),
        AadhaarCardNo: aadhaar,
        DOB: dob,
        Gender: gender === 'Male' ? 'M' : 'F',
        Address: {
          FlatRoadLoc: userProfile?.address || inputs.address || 'Address Line 1',
          CityDist: userProfile?.city || inputs.city || 'City',
          StateCode: userProfile?.state || inputs.state || 'Delhi',
          PinCode: userProfile?.pinCode || inputs.pinCode || '110001'
        },
        ContactInfo: {
          MobileNo: mobile,
          EmailID: email
        }
      },
      FilingStatus: {
        AssessmentYear: ayYear,
        SectionCode: sectionCode,
        OptingOut3F: section115BAC
      },
      GrossTotIncome: {
        Salary: activeRegimeOutput.grossSalary || 0,
        IncomeFromHP: activeRegimeOutput.grossHouseProperty || 0,
        IncomeBusinessProfession: (activeRegimeOutput.grossBusiness || 0) + (activeRegimeOutput.grossProfessional || 0),
        CapitalGains: activeRegimeOutput.grossCapitalGains || 0,
        IncomeOthSrc: activeRegimeOutput.grossOtherSources || 0
      },
      ComputationSummary: {
        "Salary Income (Net)": (activeRegimeOutput.grossSalary || 0) - (activeRegimeOutput.exemptionsApplied || 0) - (regime === 'old' ? (inputs.salary?.professionalTax || 0) : 0) - (activeRegimeOutput.standardDeductionApplied || 0),
        "Income from House Property": activeRegimeOutput.grossHouseProperty || 0,
        "Business and Profession": (activeRegimeOutput.grossBusiness || 0) + (activeRegimeOutput.grossProfessional || 0),
        "Capital Gains": activeRegimeOutput.grossCapitalGains || 0,
        "Gross Total Income": activeRegimeOutput.totalGrossIncome || 0,
        "Net Taxable Income": activeRegimeOutput.netTaxableIncome || 0,
        "Total Tax Payable": activeRegimeOutput.totalTaxLiability || 0
      },
      Deductions: regime === 'old' ? {
        Section80C: inputs.deductions?.sec80C || 0,
        Section80D: inputs.deductions?.sec80D || 0,
        Section80TTA: inputs.deductions?.sec80TTA || 0,
        Section80G: inputs.deductions?.sec80G || 0,
        TotalDeductions: activeRegimeOutput.deductionsApplied || 0
      } : {
        TotalDeductions: activeRegimeOutput.deductionsApplied || 0
      },
      TaxComputation: {
        GrossTax: activeRegimeOutput.taxBeforeRebate || 0,
        Rebate87A: activeRegimeOutput.rebate87A || 0,
        Cess: activeRegimeOutput.cess || 0,
        Surcharge: activeRegimeOutput.surcharge || 0,
        TotalTaxLiability: activeRegimeOutput.totalTaxLiability || 0
      },
      TaxesPaid: {
        TCS: 0,
        TDS: 0,
        SelfAssessmentTax: inputs.business?.selfAssessmentTax || 0
      },
      Refund: {
        BankAccounts: {
          BankAccount: {
            BankName: userProfile?.bankName || inputs.business?.bankName || 'N/A',
            AccountNumber: userProfile?.accountNumber || inputs.business?.accountNumber || 'N/A',
            IFSCCode: userProfile?.ifscCode || inputs.business?.ifscCode || 'N/A'
          }
        }
      }
    };

    if (formType === 'ITR4' || formType === 'ITR3' || formType === 'ITR5') {
      body.BusinessDetails = bizInfo;
      if (profInfo) {
        body.ProfessionalDetails = profInfo;
      }
    }

    return {
      ITR: {
        [formType]: body
      }
    };
  };

  const handleOpenJsonModal = async (item: any) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`${apiUrl}/tax/computation/${item.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedComp(data);
        setSelectedRegime(data.recommendedRegime === 'New' ? 'new' : 'old');
        setShowJsonModal(true);
      } else {
        alert('Failed to load computation details');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to backend server');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDownloadJson = () => {
    if (!selectedComp) return;
    
    const itrJson = generateITRJson(selectedComp, selectedRegime, profile);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(itrJson, null, 2));
    
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    
    const pan = profile?.panNumber || selectedComp.inputs.panNumber || 'PAN';
    const ay = selectedComp.assessmentYear;
    downloadAnchor.setAttribute(
      'download',
      `ITR_Upload_${pan.toUpperCase()}_AY${ay}_${selectedRegime}.json`
    );
    
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    
    setShowJsonModal(false);
  };

  // Load Saved Computations and CMS Blogs
  useEffect(() => {
    if (!token) return;

    const loadData = async () => {
      try {
        // Computations
        const compRes = await fetch(`${apiUrl}/tax/computation`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (compRes.ok) {
          const comps = await compRes.json();
          setComputations(comps);
        }

        // Blogs/News
        const newsRes = await fetch(`${apiUrl}/cms/blogs`);
        if (newsRes.ok) {
          const articles = await newsRes.json();
          setNews(articles);
        }
      } catch (err) {
        console.error('Failed to load dashboard statistics', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token]);

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tax computation record?')) return;
    setActionLoading(id);

    try {
      const res = await fetch(`${apiUrl}/tax/computation/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setComputations(prev => prev.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  // Format Currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Compute Total Tax Saved
  const totalTaxSaved = computations.reduce((sum, curr) => sum + curr.taxSaved, 0);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64 text-slate-400 font-semibold">
          Loading dashboard data...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in-up">
        {/* WELCOME BANNER & CALL TO ACTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-700 to-sky-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-extrabold">Welcome back, {profile?.fullName || 'Assessee'}!</h2>
            <p className="text-xs text-blue-100">Quickly calculate and compare tax regimens to file your AY returns u/s 115BAC.</p>
          </div>
          <button
            onClick={() => router.push('/computation-wizard')}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-blue-700 hover:bg-slate-50 font-bold text-sm rounded-xl shadow-sm transition-all transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            Create Computation
          </button>
        </div>

        {/* PROFILE COMPLETION WARNING */}
        {profile && !profile.completed && (
          <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl p-4 text-amber-800 dark:text-amber-400">
            <AlertCircle className="w-5.5 h-5.5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Complete Your Tax Profile</h4>
              <p className="text-xs mt-0.5">Please fill out your personal, bank, and professional details in the profile wizard. This information is needed to compile formal CA-style computation sheets.</p>
              <button 
                onClick={() => router.push('/profile-wizard')}
                className="text-xs font-bold underline mt-2 hover:text-amber-900 block"
              >
                Launch Profile Wizard &rarr;
              </button>
            </div>
          </div>
        )}

        {/* METRICS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="space-y-1">
              <span className="text-2xs font-bold text-slate-400 uppercase">Total Calculations Run</span>
              <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-200">{computations.length}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="space-y-1">
              <span className="text-2xs font-bold text-slate-400 uppercase">Accumulated Tax Saved</span>
              <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalTaxSaved)}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="space-y-1">
              <span className="text-2xs font-bold text-slate-400 uppercase">Active Filing Profiles</span>
              <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-200">1</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Plus className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* COMPUTATION LIST TABLE */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 dark:text-slate-200">{t('activeComputations')}</h3>
          </div>

          {computations.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-3">
              <p className="text-sm font-medium">No tax computations saved yet.</p>
              <button
                onClick={() => router.push('/computation-wizard')}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg"
              >
                Run Calculator
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-2xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-4">Assessment Year</th>
                    <th className="px-6 py-4">Recommendation</th>
                    <th className="px-6 py-4">Tax Payable</th>
                    <th className="px-6 py-4">Tax Saved</th>
                    <th className="px-6 py-4">Generated On</th>
                    <th className="px-6 py-4 text-center">Export / Report</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {computations.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 text-slate-700 dark:text-slate-300">
                      <td className="px-6 py-4.5 font-semibold text-slate-900 dark:text-slate-100">
                        {item.assessmentYear}
                      </td>
                      <td className="px-6 py-4.5">
                        <span className={`inline-flex px-2 py-0.5 text-2xs font-bold rounded ${
                          item.recommendedRegime === 'New' 
                            ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400' 
                            : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                        }`}>
                          {item.recommendedRegime === 'New' ? 'New Regime Recommended' : 'Old Regime Recommended'}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 font-bold">
                        {formatCurrency(item.totalTaxPayable)}
                      </td>
                      <td className="px-6 py-4.5 text-emerald-600 dark:text-emerald-400 font-medium">
                        {formatCurrency(item.taxSaved)}
                      </td>
                      <td className="px-6 py-4.5 text-xs text-slate-400">
                        {new Date(item.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4.5 text-center">
                        <div className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg">
                          {/* PDF */}
                          <a
                            href={`${apiUrl}/reports/${item.id}/pdf?token=${token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Export PDF Ledger"
                            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition-colors"
                          >
                            <FileDown className="w-4 h-4" />
                          </a>
                          {/* JSON */}
                          <button
                            onClick={() => handleOpenJsonModal(item)}
                            title="Download ITR JSON Upload Utility"
                            className="p-1 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded transition-colors cursor-pointer"
                          >
                            <FileJson className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4.5 text-center">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/comparison?id=${item.id}`)}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            View Sheet
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={actionLoading === item.id}
                            className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* CMS / BLOGS NEWS BANNER */}
        {news.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Newspaper className="w-5.5 h-5.5 text-blue-600" />
              Latest Tax Insights & Budget Updates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {news.map((item) => (
                <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-3">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{item.title}</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-xs line-clamp-3 leading-relaxed">
                    {item.content}
                  </p>
                  <div className="flex items-center justify-between text-2xs font-semibold text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span>Published: {new Date(item.createdAt).toLocaleDateString('en-IN')}</span>
                    <button 
                      onClick={() => alert(`Full article content:\n\n${item.content}`)}
                      className="text-blue-600 hover:underline"
                    >
                      Read Full Article
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ACCOUNT SECURITY CARD */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs max-w-xl">
          <div className="space-y-1 mb-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600" />
              Account Security
            </h3>
            <p className="text-2xs text-slate-400">Change or reset your password directly from your dashboard.</p>
          </div>

          {passwordError && (
            <div className="mb-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-2xs font-semibold p-3 rounded-lg border border-red-200 dark:border-red-900/35">
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="mb-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-2xs font-semibold p-3 rounded-lg border border-emerald-200 dark:border-emerald-900/35">
              {passwordSuccess}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-2xs font-bold text-slate-500 uppercase">New Password</label>
                <input
                  type="password" required
                  value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-blue-500 rounded-lg outline-none text-xs text-slate-800 dark:text-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-2xs font-bold text-slate-500 uppercase">Confirm Password</label>
                <input
                  type="password" required
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-blue-500 rounded-lg outline-none text-xs text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <button
              type="submit" disabled={updatingPassword}
              className="py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-lg text-xs transition-colors shadow-xs cursor-pointer"
            >
              {updatingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>

      {/* ITR JSON EXPORT MODAL */}
      {showJsonModal && selectedComp && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden p-6 space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-amber-50 dark:bg-amber-950/40 rounded-lg flex items-center justify-center text-amber-600">
                  <FileJson className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Download ITR JSON Utility</h3>
                  <p className="text-3xs text-slate-400">Generate Income Tax Department upload compliant schema</p>
                </div>
              </div>
              <button 
                onClick={() => setShowJsonModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold p-1 rounded-md text-lg"
              >
                &times;
              </button>
            </div>

            {/* Assessee Details Summary */}
            <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50 rounded-xl p-4 grid grid-cols-2 gap-4 text-2xs">
              <div>
                <span className="text-slate-400 font-semibold block uppercase">Assessee Name</span>
                <span className="font-bold text-slate-700 dark:text-slate-300 truncate block">
                  {profile?.fullName || selectedComp.inputs.fullName || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block uppercase">Assessment Year</span>
                <span className="font-bold text-slate-700 dark:text-slate-300 block">
                  {selectedComp.assessmentYear}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block uppercase">PAN Number</span>
                <span className="font-bold text-slate-700 dark:text-slate-300 font-mono uppercase block">
                  {profile?.panNumber || selectedComp.inputs.panNumber || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block uppercase">Recommended Regime</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                  {selectedComp.recommendedRegime === 'New' ? 'New Regime' : 'Old Regime'}
                </span>
              </div>
            </div>

            {/* Regime Selector */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-500 uppercase block">Select Filing Regime</label>
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 text-xs">
                <button
                  onClick={() => setSelectedRegime('old')}
                  className={`flex-1 py-2 text-center font-bold rounded-md transition-all cursor-pointer ${
                    selectedRegime === 'old'
                      ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-slate-100'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  }`}
                >
                  Old Tax Regime (With Deductions)
                </button>
                <button
                  onClick={() => setSelectedRegime('new')}
                  className={`flex-1 py-2 text-center font-bold rounded-md transition-all cursor-pointer ${
                    selectedRegime === 'new'
                      ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-slate-100'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  }`}
                >
                  New Tax Regime (u/s 115BAC)
                </button>
              </div>
            </div>

            {/* Financial Summary Preview */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden text-xs">
              <div className="flex justify-between p-3 bg-slate-50/50 dark:bg-slate-800/20 text-slate-500 font-semibold">
                <span>Particulars</span>
                <span>Amount (INR)</span>
              </div>
              <div className="flex justify-between p-3 text-slate-700 dark:text-slate-300">
                <span>Gross Total Income</span>
                <span className="font-bold">
                  {formatCurrency(
                    selectedRegime === 'new'
                      ? selectedComp.outputs.newRegime.totalGrossIncome
                      : selectedComp.outputs.oldRegime.totalGrossIncome
                  )}
                </span>
              </div>
              <div className="flex justify-between p-3 text-slate-700 dark:text-slate-300">
                <span>Total Deductions Applied</span>
                <span className="font-bold text-red-500">
                  -{formatCurrency(
                    selectedRegime === 'new'
                      ? selectedComp.outputs.newRegime.deductionsApplied
                      : selectedComp.outputs.oldRegime.deductionsApplied
                  )}
                </span>
              </div>
              <div className="flex justify-between p-3 text-slate-700 dark:text-slate-300">
                <span>Net Taxable Income</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatCurrency(
                    selectedRegime === 'new'
                      ? selectedComp.outputs.newRegime.netTaxableIncome
                      : selectedComp.outputs.oldRegime.netTaxableIncome
                  )}
                </span>
              </div>
              <div className="flex justify-between p-3 bg-blue-50/30 dark:bg-blue-950/10 text-blue-700 dark:text-blue-400 font-bold">
                <span>Final Tax Liability</span>
                <span>
                  {formatCurrency(
                    selectedRegime === 'new'
                      ? selectedComp.outputs.newRegime.totalTaxLiability
                      : selectedComp.outputs.oldRegime.totalTaxLiability
                  )}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowJsonModal(false)}
                className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDownloadJson}
                className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-md shadow-amber-500/10 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                Download JSON File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading details overlay */}
      {detailLoading && (
        <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-2xs z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-lg shadow-md flex items-center gap-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
            Generating ITR details...
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
