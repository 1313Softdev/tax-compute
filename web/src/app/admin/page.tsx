'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '../../components/DashboardLayout';
import { useAuth } from '../providers';
import { useLanguage } from '../providers';
import { 
  Users, 
  Settings, 
  BookOpen, 
  ShieldAlert, 
  UserCheck, 
  Ban, 
  Percent, 
  Plus, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';

function AdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const { user, token, login, apiUrl } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'slabs' | 'cms'>('stats');
  const [analytics, setAnalytics] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // CMS Form States
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [faqCategory, setFaqCategory] = useState('General');
  
  const [blogTitle, setBlogTitle] = useState('');
  const [blogSlug, setBlogSlug] = useState('');
  const [blogContent, setBlogContent] = useState('');

  // Slabs Config form state
  const [slabAY, setSlabAY] = useState('2025-26');
  const [slabRegime, setSlabRegime] = useState('New');
  const [slabConfig, setSlabConfig] = useState('{\n  "standardDeduction": 75000,\n  "rebateLimit": 700000,\n  "maxRebate": 20000\n}');

  // Fetch admin records
  const loadAdminData = async () => {
    if (!token || user?.role !== 'ADMIN') return;
    try {
      // Analytics
      const analRes = await fetch(`${apiUrl}/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (analRes.ok) {
        const analData = await resData(analRes);
        setAnalytics(analData);
      }

      // Users List
      const usersRes = await fetch(`${apiUrl}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (usersRes.ok) {
        const usersData = await resData(usersRes);
        setUsersList(usersData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const resData = async (res: Response) => {
    return await res.json();
  };

  useEffect(() => {
    if (token) {
      if (user?.role !== 'ADMIN') {
        router.push('/dashboard');
      } else {
        loadAdminData();
      }
    }
  }, [token, user]);

  useEffect(() => {
    if (tabParam && ['stats', 'users', 'slabs', 'cms'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [tabParam]);

  // Toggle user suspension
  const handleToggleSuspend = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`${apiUrl}/admin/users/${userId}/suspend`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isSuspended: !currentStatus })
      });
      if (res.ok) {
        setUsersList(prev => prev.map(u => u.id === userId ? { ...u, isSuspended: !currentStatus } : u));
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleImpersonate = async (userId: string) => {
    try {
      const res = await fetch(`${apiUrl}/admin/users/${userId}/impersonate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        // Save admin context to support switching back
        localStorage.setItem('adminToken', token || '');
        localStorage.setItem('adminUser', JSON.stringify(user || {}));
        
        login(data.token, data.user);
        router.push('/dashboard');
      } else {
        const data = await res.json();
        alert(data.error || 'Impersonation failed');
      }
    } catch (e) {
      console.error(e);
      alert('Network error occurred during impersonation');
    }
  };

  // Submit FAQ
  const handleAddFAQ = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/cms/faqs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ question: faqQuestion, answer: faqAnswer, category: faqCategory })
      });

      if (res.ok) {
        setFaqQuestion('');
        setFaqAnswer('');
        alert('FAQ created successfully!');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // Submit Blog
  const handleAddBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/cms/blogs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title: blogTitle, slug: blogSlug, content: blogContent })
      });

      if (res.ok) {
        setBlogTitle('');
        setBlogSlug('');
        setBlogContent('');
        alert('Blog post created successfully!');
      } else {
        const d = await res.json();
        alert(d.error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // Submit Slab Override
  const handleSaveSlabs = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/admin/slabs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          assessmentYear: slabAY,
          regime: slabRegime,
          configJson: slabConfig
        })
      });

      if (res.ok) {
        alert('Tax slab rules saved successfully!');
      } else {
        const d = await res.json();
        alert(d.error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

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
          Authorizing and loading control panel...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in-up">
        {/* Banner */}
        <div className="flex items-center gap-3 bg-slate-900 text-white rounded-2xl p-5 shadow-md">
          <ShieldAlert className="w-8 h-8 text-amber-500 shrink-0" />
          <div>
            <h2 className="text-md font-bold">{t('adminDashboard')}</h2>
            <p className="text-2xs text-slate-400">Manage user profiles, override tax code limits u/s 115BAC, and seed FAQs.</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 gap-1 overflow-x-auto text-xs font-bold">
          {[
            { id: 'stats', label: 'Analytics Stats', icon: Users },
            { id: 'users', label: 'User Directory', icon: UserCheck },
            { id: 'slabs', label: 'Tax slabs Editor', icon: Percent },
            { id: 'cms', label: 'CMS Articles', icon: BookOpen }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ==================== STATS VIEW ==================== */}
        {activeTab === 'stats' && analytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-1">
                <span className="text-3xs font-black text-slate-400 uppercase">Registered Users</span>
                <h3 className="text-3xl font-extrabold text-slate-800 dark:text-slate-200">{analytics.totalUsers}</h3>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-1">
                <span className="text-3xs font-black text-slate-400 uppercase">Calculations Executed</span>
                <h3 className="text-3xl font-extrabold text-slate-800 dark:text-slate-200">{analytics.totalComputations}</h3>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-1">
                <span className="text-3xs font-black text-slate-400 uppercase">Profiles Completed</span>
                <h3 className="text-3xl font-extrabold text-slate-800 dark:text-slate-200">{analytics.activeProfiles}</h3>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-1">
                <span className="text-3xs font-black text-slate-400 uppercase">Total User Tax Saved</span>
                <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(analytics.totalTaxSaved)}</h3>
              </div>
            </div>

            {/* Assessment Year Counts */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Computations by Assessment Year</h3>
              <div className="space-y-2">
                {analytics.ayStats.length === 0 ? (
                  <p className="text-xs text-slate-400">No computation runs recorded yet.</p>
                ) : (
                  analytics.ayStats.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{item.year}</span>
                      <span className="font-bold bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded text-blue-700 dark:text-blue-400">
                        {item.count} Computations
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== USER DIRECTORY ==================== */}
        {activeTab === 'users' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-2xs font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-4">User Email</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Full Name</th>
                    <th className="px-6 py-4">PAN Number</th>
                    <th className="px-6 py-4">Employment</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {usersList.map((usr) => (
                    <tr key={usr.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="px-6 py-4 font-semibold">{usr.email}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded text-3xs font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-600">
                          {usr.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">{usr.profile?.fullName || '-'}</td>
                      <td className="px-6 py-4 font-mono uppercase">{usr.profile?.panNumber || '-'}</td>
                      <td className="px-6 py-4">{usr.profile?.employmentType || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-3xs font-black uppercase ${
                          usr.isSuspended 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {usr.isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {usr.role !== 'ADMIN' ? (
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleImpersonate(usr.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/30 rounded-lg text-3xs font-bold transition-colors cursor-pointer"
                            >
                              Login As
                            </button>
                            <button
                              onClick={() => handleToggleSuspend(usr.id, usr.isSuspended)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-3xs font-bold transition-colors cursor-pointer ${
                                usr.isSuspended 
                                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200' 
                                  : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                              }`}
                            >
                              {usr.isSuspended ? <UserCheck className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                              {usr.isSuspended ? 'Reactivate' : 'Suspend'}
                            </button>
                          </div>
                        ) : (
                          <span className="text-3xs text-slate-400 font-semibold">Admin Lock</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== TAX SLABS EDITOR ==================== */}
        {activeTab === 'slabs' && (
          <form onSubmit={handleSaveSlabs} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
            <h3 className="text-md font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Settings className="w-5.5 h-5.5 text-blue-600" />
              Dynamic Tax slabs Configuration Override
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-500">
              <div className="space-y-1">
                <label className="uppercase">Assessment Year</label>
                <select
                  value={slabAY} onChange={(e) => setSlabAY(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200"
                >
                  <option value="2025-26">AY 2025-26</option>
                  <option value="2026-27">AY 2026-27</option>
                  <option value="2027-28">AY 2027-28</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="uppercase">Tax Regime</label>
                <select
                  value={slabRegime} onChange={(e) => setSlabRegime(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200"
                >
                  <option value="Old">Old Tax Regime</option>
                  <option value="New">New Tax Regime</option>
                </select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="uppercase">Configuration JSON (Standard Deduction / 87A rebate Limits)</label>
                <textarea
                  value={slabConfig} onChange={(e) => setSlabConfig(e.target.value)}
                  rows={6}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono text-xs leading-relaxed"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit" disabled={saving}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm"
              >
                {saving ? 'Saving...' : 'Deploy overrides'}
              </button>
            </div>
          </form>
        )}

        {/* ==================== CMS CONTENT MANAGER ==================== */}
        {activeTab === 'cms' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs font-bold text-slate-500">
            {/* Create FAQ */}
            <form onSubmit={handleAddFAQ} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm border-b border-slate-100 dark:border-slate-800 pb-2.5 flex items-center gap-1.5">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                Add FAQ (Frequently Asked Question)
              </h4>

              <div className="space-y-1">
                <label className="uppercase">Question</label>
                <input
                  type="text" required value={faqQuestion} onChange={(e) => setFaqQuestion(e.target.value)}
                  placeholder="e.g. Can NRIs claim HRA?"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="uppercase">Answer Text</label>
                <textarea
                  required value={faqAnswer} onChange={(e) => setFaqAnswer(e.target.value)}
                  rows={3}
                  placeholder="Enter detailed tax guidance..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="uppercase">FAQ Category</label>
                <select
                  value={faqCategory} onChange={(e) => setFaqCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200"
                >
                  <option value="General">General Questions</option>
                  <option value="Slabs">Tax slabs & Rates</option>
                  <option value="Deductions">Chapter VI-A Deductions</option>
                  <option value="Exemptions">Exemptions</option>
                </select>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit" disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-2xs rounded-lg"
                >
                  {saving ? 'Creating...' : 'Add FAQ'}
                </button>
              </div>
            </form>

            {/* Create Blog */}
            <form onSubmit={handleAddBlog} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm border-b border-slate-100 dark:border-slate-800 pb-2.5 flex items-center gap-1.5">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Publish Tax Planning Article / Blog
              </h4>

              <div className="space-y-1">
                <label className="uppercase">Article Title</label>
                <input
                  type="text" required value={blogTitle} onChange={(e) => setBlogTitle(e.target.value)}
                  placeholder="e.g. Budget 2024: New Slab Analysis"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="uppercase">Unique Slug</label>
                <input
                  type="text" required value={blogSlug} onChange={(e) => setBlogSlug(e.target.value)}
                  placeholder="budget-2024-slabs-analysis"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="uppercase">Markdown Content</label>
                <textarea
                  required value={blogContent} onChange={(e) => setBlogContent(e.target.value)}
                  rows={4}
                  placeholder="Support markdown styles like headers, bullets..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 text-xs font-medium"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit" disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-2xs rounded-lg"
                >
                  {saving ? 'Publishing...' : 'Publish Article'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center h-64 text-slate-400 font-semibold">
          Authorizing and loading control panel...
        </div>
      </DashboardLayout>
    }>
      <AdminDashboardContent />
    </Suspense>
  );
}
