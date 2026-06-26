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
  ArrowLeft
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

  // Google Popup States
  const [popupRef, setPopupRef] = useState<Window | null>(null);
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
    if (!emailStr || !emailStr.includes('@') || emailStr.toLowerCase() === 'kukukaramjit@gmail.com') return;
    try {
      const stored = localStorage.getItem('recent_emails');
      let emails: string[] = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(emails)) emails = [];
      emails = emails.filter(e => e.toLowerCase() !== emailStr.toLowerCase() && e.toLowerCase() !== 'kukukaramjit@gmail.com');
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
  const handleGoogleLogin = async (selectedEmail: string, winRef: Window | null) => {
    setError('');
    setInfo('');
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
          if (winRef && !winRef.closed) winRef.close();
        } else {
          saveRecentEmail(selectedEmail);
          login(data.token, data.user);
          
          // Close Google popup window after a short delay
          setTimeout(() => {
            if (winRef && !winRef.closed) {
              winRef.close();
            }
          }, 1500);

          const targetRoute = data.user.role === 'ADMIN' ? '/admin' : '/dashboard';
          router.push(targetRoute);
        }
      } else {
        setError(data.error || 'Google login failed');
        if (winRef && !winRef.closed) winRef.close();
      }
    } catch (err) {
      setError('Failed to connect Google authentication');
      if (winRef && !winRef.closed) winRef.close();
    } finally {
      setSubmitting(false);
    }
  };

  const triggerGoogleAuth = () => {
    setError('');
    setInfo('');

    const targetEmail = email.trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      setError('Please enter your Google email address in the Email field first.');
      return;
    }
    
    const width = 500;
    const height = 650;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    const win = window.open(
      'https://accounts.google.com',
      'GoogleAuthPopup',
      `width=${width},height=${height},top=${top},left=${left},status=no,resizable=yes,scrollbars=yes`
    );
    
    setPopupRef(win);
    
    // Log in directly!
    handleGoogleLogin(targetEmail, win);
  };

  // Close popup on unmount
  useEffect(() => {
    return () => {
      if (popupRef && !popupRef.closed) {
        popupRef.close();
      }
    };
  }, [popupRef]);

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

      {/* Google Account Choose Modal removed to support direct login */}

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
