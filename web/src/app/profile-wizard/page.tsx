'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '../../components/DashboardLayout';
import { useAuth } from '../providers';
import { useLanguage } from '../providers';
import { 
  User, 
  CreditCard, 
  Briefcase, 
  FileCheck, 
  Upload, 
  Trash2, 
  CheckCircle,
  EyeOff,
  Eye
} from 'lucide-react';

// Verhoeff algorithm multiplication table
const verhoeffD = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];

// Verhoeff algorithm permutation table
const verhoeffP = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];

// Indian major cities selection list
const indianCities = [
  { city: 'Mumbai', state: 'Maharashtra', pinCode: '400001' },
  { city: 'Delhi', state: 'Delhi', pinCode: '110001' },
  { city: 'Bengaluru', state: 'Karnataka', pinCode: '560001' },
  { city: 'Hyderabad', state: 'Telangana', pinCode: '500001' },
  { city: 'Ahmedabad', state: 'Gujarat', pinCode: '380001' },
  { city: 'Chennai', state: 'Tamil Nadu', pinCode: '600001' },
  { city: 'Kolkata', state: 'West Bengal', pinCode: '700001' },
  { city: 'Pune', state: 'Maharashtra', pinCode: '411001' },
  { city: 'Jaipur', state: 'Rajasthan', pinCode: '302001' },
  { city: 'Lucknow', state: 'Uttar Pradesh', pinCode: '226001' },
  { city: 'Patna', state: 'Bihar', pinCode: '800001' },
  { city: 'Bhopal', state: 'Madhya Pradesh', pinCode: '462001' },
  { city: 'Indore', state: 'Madhya Pradesh', pinCode: '452001' },
  { city: 'Vadodara', state: 'Gujarat', pinCode: '390001' },
  { city: 'Surat', state: 'Gujarat', pinCode: '395003' },
  { city: 'Nagpur', state: 'Maharashtra', pinCode: '440001' },
  { city: 'Visakhapatnam', state: 'Andhra Pradesh', pinCode: '530001' },
  { city: 'Coimbatore', state: 'Tamil Nadu', pinCode: '641001' },
  { city: 'Kochi', state: 'Kerala', pinCode: '682001' },
  { city: 'Thiruvananthapuram', state: 'Kerala', pinCode: '695001' },
  { city: 'Chandigarh', state: 'Chandigarh', pinCode: '160017' },
  { city: 'Guwahati', state: 'Assam', pinCode: '781001' },
  { city: 'Bhubaneswar', state: 'Odisha', pinCode: '751001' },
  { city: 'Dehradun', state: 'Uttarakhand', pinCode: '248001' },
  { city: 'Ranchi', state: 'Jharkhand', pinCode: '834001' },
  { city: 'Raipur', state: 'Chhattisgarh', pinCode: '492001' },
  { city: 'Srinagar', state: 'Jammu & Kashmir', pinCode: '190001' }
];

export default function ProfileWizard() {
  const router = useRouter();
  const { token, profile, fetchProfile, apiUrl } = useAuth();
  const { t } = useLanguage();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [docType, setDocType] = useState('PAN');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Unmasking & Toggling States
  const [panMasked, setPanMasked] = useState(true);
  const [aadhaarMasked, setAadhaarMasked] = useState(true);
  const [panFocused, setPanFocused] = useState(false);
  const [aadhaarFocused, setAadhaarFocused] = useState(false);

  // Validation States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingPincode, setLoadingPincode] = useState(false);

  const validatePANValue = (pan: string): string => {
    if (!pan) return 'PAN number is required';
    const cleaned = pan.trim().toUpperCase();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleaned)) {
      return 'Invalid PAN format (expected 5 letters, 4 numbers, 1 letter, e.g., ABCDE1234F)';
    }
    return '';
  };

  const validateAadhaarValue = (aadhaar: string): string => {
    if (!aadhaar) return 'Aadhaar number is required';
    const cleaned = aadhaar.trim().replace(/[-\s]/g, '');
    if (!/^\d{12}$/.test(cleaned)) {
      return 'Aadhaar number must be exactly 12 digits';
    }
    if (!/^[2-9]/.test(cleaned)) {
      return 'Aadhaar number cannot start with 0 or 1';
    }
    
    // Verhoeff checksum
    let c = 0;
    for (let i = 0; i < cleaned.length; i++) {
      const idx = cleaned.length - 1 - i;
      const digit = parseInt(cleaned.charAt(idx), 10);
      c = verhoeffD[c][verhoeffP[i % 8][digit]];
    }
    if (c !== 0) {
      return 'Invalid Aadhaar number (checksum failed)';
    }
    return '';
  };

  const fetchPincodeDetails = async (pincode: string) => {
    setLoadingPincode(true);
    setErrors(prev => ({ ...prev, pinCode: '' }));
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      if (!response.ok) {
        throw new Error('API request failed');
      }
      const data = await response.json();
      if (data && data[0] && data[0].Status === 'Success') {
        const postOfficeList = data[0].PostOffice;
        if (postOfficeList && postOfficeList.length > 0) {
          const firstOffice = postOfficeList[0];
          setFormData(prev => ({
            ...prev,
            city: firstOffice.District || firstOffice.Block || prev.city,
            state: firstOffice.State || prev.state
          }));
        }
      } else {
        setErrors(prev => ({ ...prev, pinCode: 'Invalid PIN Code' }));
      }
    } catch (error) {
      console.error('Pincode fetch error:', error);
    } finally {
      setLoadingPincode(false);
    }
  };

  const maskPAN = (pan: string): string => {
    if (!pan) return '';
    const cleaned = pan.trim().toUpperCase();
    if (cleaned.length !== 10) return cleaned;
    return `XXXXX${cleaned.substring(5, 9)}${cleaned.charAt(9)}`;
  };

  const maskAadhaar = (aadhaar: string): string => {
    if (!aadhaar) return '';
    const cleaned = aadhaar.trim().replace(/[-\s]/g, '');
    if (cleaned.length !== 12) return cleaned;
    return `XXXX-XXXX-${cleaned.substring(8)}`;
  };

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    fatherName: '',
    dateOfBirth: '',
    gender: 'Male',
    panNumber: '',
    aadhaarNumber: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pinCode: '',
    
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: '',

    employmentType: 'Salaried',
    employerName: '',
    gstNumber: ''
  });

  // Load profile values on mount
  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        fatherName: (profile as any).fatherName || '',
        dateOfBirth: (profile as any).dateOfBirth || '',
        gender: (profile as any).gender || 'Male',
        panNumber: (profile as any).panNumber || '',
        aadhaarNumber: (profile as any).aadhaarNumber || '',
        phone: (profile as any).phone || '',
        address: (profile as any).address || '',
        city: (profile as any).city || '',
        state: (profile as any).state || '',
        pinCode: (profile as any).pinCode || '',
        
        bankName: (profile as any).bankName || '',
        accountNumber: (profile as any).accountNumber || '',
        ifscCode: (profile as any).ifscCode || '',
        branchName: (profile as any).branchName || '',

        employmentType: profile.employmentType || 'Salaried',
        employerName: (profile as any).employerName || '',
        gstNumber: (profile as any).gstNumber || ''
      });
      setLoading(false);
    }
  }, [profile]);

  // Load uploaded documents
  const loadDocuments = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${apiUrl}/documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (token) {
      loadDocuments();
    }
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Run validation or side effects outside of the state updater function
    if (name === 'panNumber') {
      const error = validatePANValue(value);
      setErrors(prevErr => ({ ...prevErr, panNumber: error }));
    } else if (name === 'aadhaarNumber') {
      const error = validateAadhaarValue(value);
      setErrors(prevErr => ({ ...prevErr, aadhaarNumber: error }));
    } else if (name === 'pinCode') {
      const cleanedPin = value.trim();
      if (cleanedPin.length === 6 && /^\d{6}$/.test(cleanedPin)) {
        fetchPincodeDetails(cleanedPin);
      } else {
        setErrors(prevErr => ({ ...prevErr, pinCode: cleanedPin.length === 6 ? '' : 'PIN Code must be 6 digits' }));
      }
    }
  };

  // Save profile updates
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // If saving step 1, validate inputs first
    if (step === 1) {
      const panErr = validatePANValue(formData.panNumber);
      const aadhaarErr = validateAadhaarValue(formData.aadhaarNumber);
      const pinErr = formData.pinCode.length === 6 && /^\d{6}$/.test(formData.pinCode) ? '' : 'PIN Code must be 6 digits';
      
      if (panErr || aadhaarErr || pinErr) {
        setErrors({
          panNumber: panErr,
          aadhaarNumber: aadhaarErr,
          pinCode: pinErr
        });
        alert('Please fix the validation errors before proceeding.');
        return;
      }
    }

    setSaving(true);

    try {
      const res = await fetch(`${apiUrl}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        await fetchProfile(); // reload auth context profile
        if (step < 4) {
          setStep(step + 1);
        } else {
          router.push('/dashboard');
        }
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update profile');
      }
    } catch (err) {
      alert('Network error saving profile');
    } finally {
      setSaving(false);
    }
  };

  // Handle Document Upload
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please choose a file to upload');
      return;
    }
    setSaving(true);

    const data = new FormData();
    data.append('file', selectedFile);
    data.append('fileType', docType);

    try {
      const res = await fetch(`${apiUrl}/documents/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: data
      });

      if (res.ok) {
        setSelectedFile(null);
        // Reset file input
        const fileInput = document.getElementById('file-field') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        await loadDocuments();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Upload failed');
      }
    } catch (err) {
      alert('Error connecting upload client');
    } finally {
      setSaving(false);
    }
  };

  // Delete Document
  const handleDeleteDoc = async (id: string) => {
    if (!confirm('Delete this file?')) return;
    try {
      const res = await fetch(`${apiUrl}/documents/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const stepsList = [
    { num: 1, label: t('personalDetails'), icon: User },
    { num: 2, label: t('bankDetails'), icon: CreditCard },
    { num: 3, label: t('professionalDetails'), icon: Briefcase },
    { num: 4, label: t('documentUpload'), icon: FileCheck }
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64 text-slate-400 font-semibold">
          Loading wizard configuration...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* WIZARD STEPPER HEADER */}
        <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-6 shadow-xs">
          {stepsList.map((s, idx) => {
            const Icon = s.icon;
            const active = step === s.num;
            const done = step > s.num;
            return (
              <React.Fragment key={s.num}>
                <button
                  type="button"
                  onClick={() => setStep(s.num)}
                  className="flex flex-col items-center space-y-1.5 relative cursor-pointer hover:opacity-85 active:scale-95 transition-all group outline-none"
                  aria-label={`Go to step ${s.num}: ${s.label}`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all text-xs font-bold ${
                    active 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20'
                      : done 
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 group-hover:border-slate-400 dark:group-hover:border-slate-500'
                  }`}>
                    {done ? '✓' : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-3xs md:text-2xs font-bold uppercase transition-colors ${
                    active ? 'text-blue-600' : done ? 'text-emerald-500' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                  }`}>
                    {s.label}
                  </span>
                </button>
                {idx < stepsList.length - 1 && (
                  <hr className={`flex-1 border-t-2 mx-2 ${
                    step > s.num ? 'border-emerald-500' : 'border-slate-200 dark:border-slate-800'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* STEP 1: PERSONAL DETAILS */}
        {step === 1 && (
          <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
            <h3 className="text-md font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <User className="w-5.5 h-5.5 text-blue-600" />
              1. Assessee Personal Identity Card
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-500 uppercase">Full Name (As per PAN)</label>
                <input
                  type="text" required name="fullName"
                  value={formData.fullName} onChange={handleChange}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-500 uppercase">Father's Name</label>
                <input
                  type="text" required name="fatherName"
                  value={formData.fatherName} onChange={handleChange}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-500 uppercase">Date of Birth</label>
                <input
                  type="date" required name="dateOfBirth"
                  value={formData.dateOfBirth} onChange={handleChange}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-500 uppercase">Gender</label>
                <select
                  name="gender"
                  value={formData.gender} onChange={handleChange}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-500 uppercase flex items-center justify-between">
                  <span>PAN Number (Permanent Account)</span>
                  {profile?.hasPAN && (
                    <button
                      type="button"
                      onClick={() => setPanMasked(!panMasked)}
                      className="inline-flex items-center gap-1 text-2xs text-emerald-600 hover:text-emerald-800 font-bold cursor-pointer transition-colors"
                    >
                      {panMasked ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </label>
                <input
                  type="text" required maxLength={10} name="panNumber"
                  value={panFocused || !panMasked ? formData.panNumber : maskPAN(formData.panNumber)}
                  onChange={handleChange}
                  onFocus={() => setPanFocused(true)}
                  onBlur={() => setPanFocused(false)}
                  placeholder="ABCDE1234F"
                  className={`w-full p-2.5 bg-slate-50 dark:bg-slate-800 border ${
                    errors.panNumber 
                      ? 'border-rose-500 focus:border-rose-500' 
                      : 'border-slate-200 dark:border-slate-700'
                  } rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono uppercase`}
                />
                {errors.panNumber && (
                  <span className="text-3xs text-rose-500 font-bold block mt-1">{errors.panNumber}</span>
                )}
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-500 uppercase flex items-center justify-between">
                  <span>Aadhaar Number (12 Digit)</span>
                  {profile?.hasAadhaar && (
                    <button
                      type="button"
                      onClick={() => setAadhaarMasked(!aadhaarMasked)}
                      className="inline-flex items-center gap-1 text-2xs text-emerald-600 hover:text-emerald-800 font-bold cursor-pointer transition-colors"
                    >
                      {aadhaarMasked ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </label>
                <input
                  type="text" required maxLength={12} name="aadhaarNumber"
                  value={aadhaarFocused || !aadhaarMasked ? formData.aadhaarNumber : maskAadhaar(formData.aadhaarNumber)}
                  onChange={handleChange}
                  onFocus={() => setAadhaarFocused(true)}
                  onBlur={() => setAadhaarFocused(false)}
                  placeholder="123456789012"
                  className={`w-full p-2.5 bg-slate-50 dark:bg-slate-800 border ${
                    errors.aadhaarNumber 
                      ? 'border-rose-500 focus:border-rose-500' 
                      : 'border-slate-200 dark:border-slate-700'
                  } rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono`}
                />
                {errors.aadhaarNumber && (
                  <span className="text-3xs text-rose-500 font-bold block mt-1">{errors.aadhaarNumber}</span>
                )}
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-500 uppercase">Contact Number</label>
                <input
                  type="tel" required maxLength={10} name="phone"
                  value={formData.phone} onChange={handleChange}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="block font-bold text-slate-500 uppercase">Quick Select City (India)</label>
                <select
                  onChange={(e) => {
                    const selectedCity = indianCities.find(c => c.city === e.target.value);
                    if (selectedCity) {
                      setFormData(prev => ({
                        ...prev,
                        city: selectedCity.city,
                        state: selectedCity.state,
                        pinCode: selectedCity.pinCode
                      }));
                      setErrors(prev => ({ ...prev, pinCode: '' }));
                    }
                  }}
                  defaultValue=""
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200"
                >
                  <option value="" disabled>-- Choose a city to auto-populate --</option>
                  {indianCities.map(c => (
                    <option key={c.city} value={c.city}>
                      {c.city} ({c.state})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-500 uppercase flex items-center justify-between">
                  <span>PIN Code</span>
                  {loadingPincode && (
                    <span className="text-3xs text-blue-600 animate-pulse font-bold">Locating...</span>
                  )}
                </label>
                <input
                  type="text" required maxLength={6} name="pinCode"
                  value={formData.pinCode} onChange={handleChange}
                  placeholder="110001"
                  className={`w-full p-2.5 bg-slate-50 dark:bg-slate-800 border ${
                    errors.pinCode 
                      ? 'border-rose-500 focus:border-rose-500' 
                      : 'border-slate-200 dark:border-slate-700'
                  } rounded-lg outline-none text-slate-800 dark:text-slate-200`}
                />
                {errors.pinCode && (
                  <span className="text-3xs text-rose-500 font-bold block mt-1">{errors.pinCode}</span>
                )}
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="block font-bold text-slate-500 uppercase">Residential Address</label>
                <input
                  type="text" required name="address"
                  value={formData.address} onChange={handleChange}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-500 uppercase">City</label>
                <input
                  type="text" required name="city"
                  value={formData.city} onChange={handleChange}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-500 uppercase">State</label>
                <input
                  type="text" required name="state"
                  value={formData.state} onChange={handleChange}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit" disabled={saving}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg"
              >
                {saving ? 'Saving...' : t('saveAndNext')}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: BANK DETAILS */}
        {step === 2 && (
          <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
            <h3 className="text-md font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <CreditCard className="w-5.5 h-5.5 text-blue-600" />
              2. Bank Account Details (For Refund Disbursal)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-500 uppercase">Bank Name</label>
                <input
                  type="text" required name="bankName"
                  value={formData.bankName} onChange={handleChange}
                  placeholder="State Bank of India, HDFC etc."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-500 uppercase">Account Number</label>
                <input
                  type="text" required name="accountNumber"
                  value={formData.accountNumber} onChange={handleChange}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-500 uppercase">IFSC Code</label>
                <input
                  type="text" required maxLength={11} name="ifscCode"
                  value={formData.ifscCode} onChange={handleChange}
                  placeholder="SBIN0000001"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-500 uppercase">Branch Name</label>
                <input
                  type="text" required name="branchName"
                  value={formData.branchName} onChange={handleChange}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button" onClick={() => setStep(1)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-lg"
              >
                {t('back')}
              </button>
              <button
                type="submit" disabled={saving}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg"
              >
                {saving ? 'Saving...' : t('saveAndNext')}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: PROFESSIONAL DETAILS */}
        {step === 3 && (
          <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
            <h3 className="text-md font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Briefcase className="w-5.5 h-5.5 text-blue-600" />
              3. Employment & Professional Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-500 uppercase">Employment Type</label>
                <select
                  name="employmentType"
                  value={formData.employmentType} onChange={handleChange}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200"
                >
                  <option value="Salaried">Salaried Employee</option>
                  <option value="Business">Business Owner</option>
                  <option value="Professional">Professional Practitioner (CA, Doctor etc.)</option>
                  <option value="Pensioner">Pensioner</option>
                  <option value="Freelancer">Independent Freelancer</option>
                </select>
              </div>

              {formData.employmentType === 'Salaried' && (
                <div className="space-y-1">
                  <label className="block font-bold text-slate-500 uppercase">Employer Name</label>
                  <input
                    type="text" required name="employerName"
                    value={formData.employerName} onChange={handleChange}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200"
                  />
                </div>
              )}

              {['Business', 'Freelancer', 'Professional'].includes(formData.employmentType) && (
                <div className="space-y-1">
                  <label className="block font-bold text-slate-500 uppercase">GSTIN Number (Optional)</label>
                  <input
                    type="text" maxLength={15} name="gstNumber"
                    value={formData.gstNumber} onChange={handleChange}
                    placeholder="22AAAAA1111A1Z1"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200 font-mono uppercase"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button" onClick={() => setStep(2)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-lg"
              >
                {t('back')}
              </button>
              <button
                type="submit" disabled={saving}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg"
              >
                {saving ? 'Saving...' : t('saveAndNext')}
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: TAX DOCUMENTS UPLOAD */}
        {step === 4 && (
          <div className="space-y-6">
            {/* Upload form */}
            <form onSubmit={handleUpload} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-md font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <Upload className="w-5.5 h-5.5 text-blue-600" />
                4. Upload Supporting Tax Documents
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-500 uppercase">Document Category</label>
                  <select
                    value={docType} onChange={(e) => setDocType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-200"
                  >
                    <option value="PAN">PAN Card PDF/Image</option>
                    <option value="Aadhaar">Aadhaar Card PDF/Image</option>
                    <option value="Form16">Form 16 (Salary Certificate)</option>
                    <option value="SalarySlip">Salary Slip</option>
                    <option value="BankStatement">Bank Statements (PDF)</option>
                    <option value="InvestmentProof">Section 80C/80D Proofs</option>
                    <option value="Other">Other Tax Proofs</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-500 uppercase">Choose File</label>
                  <input
                    id="file-field" type="file" required
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit" disabled={saving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg"
                >
                  {saving ? 'Uploading...' : 'Upload File'}
                </button>
              </div>
            </form>

            {/* Document list */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                {t('savedDocuments')}
              </h4>

              {documents.length === 0 ? (
                <p className="text-xs text-slate-400">No documents uploaded yet. Add files above for CA review or computation safety.</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between py-3 text-xs">
                      <div>
                        <span className="inline-flex px-1.5 py-0.5 font-bold rounded text-3xs bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 mr-2 uppercase">
                          {doc.fileType}
                        </span>
                        <a 
                          href={`${apiUrl.replace('/api', '')}${doc.fileUrl}`} 
                          target="_blank" rel="noreferrer"
                          className="font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 hover:underline"
                        >
                          {doc.fileName}
                        </a>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-3xs text-slate-400">{new Date(doc.uploadedAt).toLocaleDateString('en-IN')}</span>
                        <button
                          onClick={() => handleDeleteDoc(doc.id)}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button" onClick={() => setStep(3)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-lg"
              >
                {t('back')}
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg"
              >
                Finish & Go to Dashboard
              </button>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
