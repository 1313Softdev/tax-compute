'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/navigation';
import { useAuth } from '../providers';
import { useLanguage } from '../providers';
import { 
  Calculator, 
  Mail, 
  Lock, 
  Phone, 
  ShieldCheck, 
  Sparkles,
  ArrowLeft,
  Chrome
} from 'lucide-react';

import { Suspense } from 'react';

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, apiUrl } = useAuth();
  const { t } = useLanguage();

  const [isRegister, setIsRegister] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  
  // Input fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  
  // States
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showEmailVerify, setShowEmailVerify] = useState(false);
  const [emailVerificationCode, setEmailVerificationCode] = useState('');

  // Google Modal States
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [showCustomEmailInput, setShowCustomEmailInput] = useState(false);
  const [recentEmails, setRecentEmails] = useState<string[]>([]);

  // Load recent emails on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('recent_emails');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentEmails(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load recent emails', e);
    }
  }, []);

  const saveRecentEmail = (emailStr: string) => {
    if (!emailStr || !emailStr.includes('@')) return;
    try {
      const stored = localStorage.getItem('recent_emails');
      let emails: string[] = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(emails)) emails = [];
      emails = emails.filter(e => e.toLowerCase() !== emailStr.toLowerCase());
      emails.unshift(emailStr);
      emails = emails.slice(0, 5);
      localStorage.setItem('recent_emails', JSON.stringify(emails));
      setRecentEmails(emails);
    } catch (e) {
      console.error('Failed to save recent email', e);
    }
  };

  // Sync mode with query params
  useEffect(() => {
    if (searchParams.get('register') === 'true') {
      setIsRegister(true);
    } else {
      setIsRegister(false);
    }
  }, [searchParams]);

  // 1. EMAIL/PASSWORD LOGIN & REGISTER
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setSubmitting(true);

    const endpoint = isRegister ? '/auth/register' : '/auth/login';

    try {
      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.requiresVerification) {
          setShowEmailVerify(true);
          setEmail(data.email);
          setError(data.error || '');
        } else {
          setError(data.error || 'Authentication failed');
        }
      } else {
        if (data.requiresVerification) {
          setShowEmailVerify(true);
          setEmail(data.email);
          setInfo(data.message || 'Verification code sent to your email.');
        } else {
          saveRecentEmail(email);
          login(data.token, data.user);
          const targetRoute = data.user.role === 'ADMIN' ? '/admin' : '/dashboard';
          router.push(targetRoute);
        }
      }
    } catch (err) {
      setError('Connection to backend failed');
    } finally {
      setSubmitting(false);
    }
  };

  // 1.5. VERIFY EMAIL
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailVerificationCode) {
      setError('Please enter the verification code');
      return;
    }
    setError('');
    setInfo('');
    setSubmitting(true);

    try {
      const res = await fetch(`${apiUrl}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: emailVerificationCode })
      });

      const data = await res.json();
      if (res.ok) {
        saveRecentEmail(email);
        login(data.token, data.user);
        const targetRoute = data.user.role === 'ADMIN' ? '/admin' : '/dashboard';
        router.push(targetRoute);
      } else {
        setError(data.error || 'Email verification failed');
      }
    } catch (err) {
      setError('Failed to verify email');
    } finally {
      setSubmitting(false);
    }
  };

  // 2. SEND OTP
  const handleSendOTP = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setInfo('');
    setSubmitting(true);

    try {
      const res = await fetch(`${apiUrl}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });

      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        setInfo('OTP code triggered! Check your terminal console to copy the code.');
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Failed to contact OTP service');
    } finally {
      setSubmitting(false);
    }
  };

  // 3. VERIFY OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setError('Please enter the verification code');
      return;
    }
    setError('');
    setInfo('');
    setSubmitting(true);

    try {
      const res = await fetch(`${apiUrl}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp })
      });

      const data = await res.json();
      if (res.ok) {
        if (data.user?.email) {
          saveRecentEmail(data.user.email);
        }
        login(data.token, data.user);
        const targetRoute = data.user.role === 'ADMIN' ? '/admin' : '/dashboard';
        router.push(targetRoute);
      } else {
        setError(data.error || 'Verification failed');
      }
    } catch (err) {
      setError('Failed to verify OTP');
    } finally {
      setSubmitting(false);
    }
  };

  // 4. MOCK GOOGLE LOGIN
  const handleGoogleLogin = async (selectedEmail: string) => {
    setError('');
    setInfo('');
    setShowGoogleModal(false);
    setSubmitting(true);

    try {
      const res = await fetch(`${apiUrl}/auth/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: selectedEmail,
          name: selectedEmail.split('@')[0],
          googleToken: 'mock-google-token-xyz'
        })
      });

      const data = await res.json();
      if (res.ok) {
        if (data.requiresVerification) {
          setShowEmailVerify(true);
          setEmail(data.email);
          setInfo(data.message || 'Verification code sent to your Google email.');
        } else {
          saveRecentEmail(selectedEmail);
          login(data.token, data.user);
          const targetRoute = data.user.role === 'ADMIN' ? '/admin' : '/dashboard';
          router.push(targetRoute);
        }
      } else {
        setError(data.error || 'Google login failed');
      }
    } catch (err) {
      setError('Failed to connect Google authentication');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-8 space-y-6 transition-colors duration-300">
        
        {/* Back Link */}
        <button 
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('back')} to Home
        </button>

        {/* Branding header */}
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center mx-auto shadow-md">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            {isRegister ? 'Create Assessee Account' : 'Secure CA Portal Login'}
          </h2>
          <p className="text-xs text-slate-400">
            {isRegister ? 'Manage filings & generate computation sheets u/s 115BAC.' : 'Sign in to access your computations & dashboard.'}
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-semibold p-3 rounded-lg border border-red-200 dark:border-red-900/35">
            {error}
          </div>
        )}
        {info && (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold p-3 rounded-lg border border-emerald-200 dark:border-emerald-900/35">
            {info}
          </div>
        )}

        {/* Toggle Login Method (Only for Login screen, hidden if email verification is active) */}
        {!isRegister && !showEmailVerify && (
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 text-xs">
            <button
              onClick={() => { setLoginMethod('password'); setError(''); }}
              className={`flex-1 py-1.5 text-center font-bold rounded-md transition-all ${
                loginMethod === 'password' ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Email & Password
            </button>
            <button
              onClick={() => { setLoginMethod('otp'); setError(''); }}
              className={`flex-1 py-1.5 text-center font-bold rounded-md transition-all ${
                loginMethod === 'otp' ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Mobile OTP Code
            </button>
          </div>
        )}

        {/* FORM DRAWER */}
        {showEmailVerify ? (
          // Email Verification Form
          <form onSubmit={handleVerifyEmail} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="verifyEmail" className="block text-2xs font-bold text-slate-500 uppercase">Verification Code Sent To</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  id="verifyEmail" type="email" disabled
                  value={email}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-sm text-slate-500 dark:text-slate-400"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="emailCode" className="block text-2xs font-bold text-slate-500 uppercase">Verification Code (6-Digit OTP)</label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  id="emailCode" type="text" required maxLength={6}
                  value={emailVerificationCode} onChange={(e) => setEmailVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-blue-500 rounded-lg outline-none text-sm text-slate-800 dark:text-slate-200 font-mono"
                />
              </div>
            </div>

            <button
              type="submit" disabled={submitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-lg text-sm transition-colors shadow-md"
            >
              {submitting ? 'Verifying...' : 'Verify & Sign In'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowEmailVerify(false);
                  setError('');
                  setInfo('');
                  setEmailVerificationCode('');
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
              >
                Back to Login / Registration
              </button>
            </div>
          </form>
        ) : isRegister || loginMethod === 'password' ? (
          // Email/Password Form
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="email" className="block text-2xs font-bold text-slate-500 uppercase">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  id="email" type="email" required autoComplete="username"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-blue-500 rounded-lg outline-none text-sm text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="block text-2xs font-bold text-slate-500 uppercase">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  id="password" type="password" required 
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-blue-500 rounded-lg outline-none text-sm text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <button
              type="submit" disabled={submitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-lg text-sm transition-colors shadow-md"
            >
              {submitting ? 'Please wait...' : isRegister ? 'Register & Continue' : 'Sign In Now'}
            </button>
          </form>
        ) : (
          // OTP Login Form
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="phone" className="block text-2xs font-bold text-slate-500 uppercase">Mobile Number</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    id="phone" type="tel" required maxLength={10} autoComplete="tel"
                    value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9999999999"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-sm text-slate-800 dark:text-slate-200"
                  />
                </div>
                <button
                  type="button" onClick={handleSendOTP} disabled={submitting}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                >
                  {otpSent ? 'Resend' : 'Send code'}
                </button>
              </div>
            </div>

            {otpSent && (
              <div className="space-y-1 animate-fade-in-up">
                <label htmlFor="otp" className="block text-2xs font-bold text-slate-500 uppercase">Verification Code (OTP)</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    id="otp" type="text" required maxLength={6}
                    value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-sm text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            )}

            {otpSent && (
              <button
                type="submit" disabled={submitting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-lg text-sm transition-colors shadow-md"
              >
                {submitting ? 'Verifying...' : 'Verify & Sign In'}
              </button>
            )}
          </form>
        )}

        {/* GOOGLE SIGN-IN DIVIDER (hidden if email verification is active) */}
        {!showEmailVerify && (
          <>
            <div className="flex items-center justify-between text-2xs font-bold text-slate-400">
              <hr className="w-1/3 border-slate-200 dark:border-slate-800" />
              <span>OR SIGN IN WITH</span>
              <hr className="w-1/3 border-slate-200 dark:border-slate-800" />
            </div>

            <button
              onClick={() => {
                setError('');
                setInfo('');
                setShowCustomEmailInput(false);
                setCustomGoogleEmail('');
                setShowGoogleModal(true);
              }}
              disabled={submitting}
              className="flex items-center justify-center gap-3 w-full py-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors bg-white dark:bg-slate-900 cursor-pointer"
            >
              <Chrome className="w-5 h-5 text-red-500" />
              Google Account Sign-In
            </button>
          </>
        )}

        {/* FOOTER SWITCH LINK (hidden if email verification is active) */}
        {!showEmailVerify && (
          <div className="text-center pt-2">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
                setInfo('');
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
            >
              {isRegister ? 'Already have an account? Sign In' : 'New to TaxCompute? Register here'}
            </button>
          </div>
        )}


        <div className="flex items-center justify-center gap-1.5 text-2xs text-slate-400 text-center justify-self-center pt-2">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          Secured with JWT and AES Data Masking
        </div>

      </div>

      {/* Google Account Choose Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full overflow-hidden p-6 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <svg className="w-8 h-8" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100">Choose an account</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">to continue to TaxCompute</p>
            </div>

            {/* List of Accounts */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {/* Option 1: Currently entered email (if valid) */}
              {email.trim() && email.includes('@') && (
                <button
                  onClick={() => handleGoogleLogin(email.trim())}
                  className="flex items-center gap-3 w-full p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm uppercase">
                    {email.trim().charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{email.trim()}</p>
                    <p className="text-3xs text-blue-500 font-bold uppercase tracking-wider">Currently Entered</p>
                  </div>
                </button>
              )}

              {/* Option 2: Recent Emails (excluding currently entered if already listed) */}
              {recentEmails
                .filter(e => e.toLowerCase() !== email.trim().toLowerCase())
                .map((e, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleGoogleLogin(e)}
                    className="flex items-center gap-3 w-full p-2.5 rounded-lg border border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-semibold text-sm uppercase">
                      {e.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{e}</p>
                      <p className="text-3xs text-slate-400">Signed in recently</p>
                    </div>
                  </button>
                ))}

              {/* Option 3: Default test email (if not already listed in input or recent) */}
              {email.trim().toLowerCase() !== 'kukukaramjit@gmail.com' && 
               !recentEmails.some(e => e.toLowerCase() === 'kukukaramjit@gmail.com') && (
                <button
                  onClick={() => handleGoogleLogin('kukukaramjit@gmail.com')}
                  className="flex items-center gap-3 w-full p-2.5 rounded-lg border border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-sm uppercase">
                    K
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">kukukaramjit@gmail.com</p>
                    <p className="text-3xs text-slate-400">Default Test Account</p>
                  </div>
                </button>
              )}

              {/* Use Another Account Form inline */}
              {showCustomEmailInput ? (
                <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2 mt-2 bg-slate-50 dark:bg-slate-900/50">
                  <label htmlFor="customGoogleEmail" className="block text-3xs font-bold text-slate-500 uppercase">Google Email</label>
                  <input
                    id="customGoogleEmail" type="email" required
                    value={customGoogleEmail} onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md outline-none text-xs text-slate-800 dark:text-slate-200 focus:border-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customGoogleEmail.trim().includes('@')) {
                        handleGoogleLogin(customGoogleEmail.trim());
                      }
                    }}
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button" onClick={() => setShowCustomEmailInput(false)}
                      className="px-2.5 py-1 text-3xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="button" disabled={!customGoogleEmail.trim().includes('@')}
                      onClick={() => handleGoogleLogin(customGoogleEmail.trim())}
                      className="px-2.5 py-1 text-3xs font-bold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded"
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowCustomEmailInput(true)}
                  className="flex items-center gap-3 w-full p-2.5 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg">+</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">Use another account</p>
                  </div>
                </button>
              )}
            </div>

            {/* Footer Consent Notice */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-3xs text-slate-400 dark:text-slate-500 leading-relaxed text-center">
                To continue, Google will share your name, email address, and profile picture with TaxCompute.
              </p>
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-400 font-semibold">Loading authentication portal...</div>}>
      <AuthPageContent />
    </Suspense>
  );
}
