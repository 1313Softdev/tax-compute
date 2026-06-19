import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  Switch,
  ActivityIndicator,
  Alert,
  Linking,
  Share,
  Modal
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { compareRegimes, TaxComputationInputs, taxBusinessCodes } from 'shared-engine';

// Use 10.0.2.2 to connect to local host machine from Android Emulator
const API_URL = 'http://10.0.2.2:5000/api';

export default function App() {
  const [screen, setScreen] = useState<'login' | 'dashboard' | 'wizard' | 'comparison' | 'admin'>('login');
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  
  // Auth state
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState('');

  // Dashboard state
  const [computations, setComputations] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [showPan, setShowPan] = useState(false);
  const [showAadhaar, setShowAadhaar] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // ITR JSON State
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonRegime, setJsonRegime] = useState<'old' | 'new'>('new');
  const [jsonComp, setJsonComp] = useState<any | null>(null);

  // Admin Dashboard State
  const [adminTab, setAdminTab] = useState<'stats' | 'users' | 'slabs' | 'cms'>('stats');
  const [adminAnalytics, setAdminAnalytics] = useState<any | null>(null);
  const [adminUsersList, setAdminUsersList] = useState<any[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminSaving, setAdminSaving] = useState(false);

  // Admin CMS Form States
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [faqCategory, setFaqCategory] = useState('General');
  
  const [blogTitle, setBlogTitle] = useState('');
  const [blogSlug, setBlogSlug] = useState('');
  const [blogContent, setBlogContent] = useState('');

  // Admin Slabs Config form state
  const [slabAY, setSlabAY] = useState('2025-26');
  const [slabRegime, setSlabRegime] = useState('New');
  const [slabConfig, setSlabConfig] = useState('{\n  "standardDeduction": 75000,\n  "rebateLimit": 700000,\n  "maxRebate": 20000\n}');

  // Wizard state
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [wizardSaving, setWizardSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Wizard input fields
  const [ay, setAy] = useState('2025-26');
  const [dob, setDob] = useState('1990-01-01');
  const [resStatus, setResStatus] = useState('Resident');
  const [gender, setGender] = useState('Male');
  const [fullName, setFullName] = useState('');

  // Salary
  const [salaryBasic, setSalaryBasic] = useState('0');
  const [salaryHra, setSalaryHra] = useState('0');
  const [salaryPT, setSalaryPT] = useState('0');

  // House Property
  const [hpSelfOccupied, setHpSelfOccupied] = useState(true);
  const [hpRentReceived, setHpRentReceived] = useState('0');
  const [hpMuniTaxes, setHpMuniTaxes] = useState('0');
  const [hpInterest, setHpInterest] = useState('0');

  // Presumptive Business
  const [bizIsPresumptive, setBizIsPresumptive] = useState(false);
  const [bizNature, setBizNature] = useState('Building complete constructions');
  const [bizCode, setBizCode] = useState('06002');
  const [bizTradeName, setBizTradeName] = useState('');
  const [bizReceiptsCash, setBizReceiptsCash] = useState('0');
  const [bizReceiptsBanking, setBizReceiptsBanking] = useState('0');
  const [bizReceiptsOther, setBizReceiptsOther] = useState('0');
  const [bizSelfAssessmentTax, setBizSelfAssessmentTax] = useState('0');

  // Presumptive Professional
  const [profIsPresumptive, setProfIsPresumptive] = useState(false);
  const [profNature, setProfNature] = useState('Software development');
  const [profCode, setProfCode] = useState('16013');
  const [profTradeName, setProfTradeName] = useState('');
  const [profReceiptsCash, setProfReceiptsCash] = useState('0');
  const [profReceiptsBanking, setProfReceiptsBanking] = useState('0');
  const [profNormalReceipts, setProfNormalReceipts] = useState('0');
  const [profNormalExpenses, setProfNormalExpenses] = useState('0');
  const [profNormalDepr, setProfNormalDepr] = useState('0');

  // Mobile Code Search Modal
  const [mobileSearchModalVisible, setMobileSearchModalVisible] = useState(false);
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');
  const [mobileSearchTarget, setMobileSearchTarget] = useState<'business' | 'professional'>('business');

  // Capital Gains
  const [cgShareMarket, setCgShareMarket] = useState('0');
  const [cgLongTerm, setCgLongTerm] = useState('0');
  const [cgShortTerm, setCgShortTerm] = useState('0');
  const [cgPropertySale, setCgPropertySale] = useState('0');

  // Other Sources
  const [osSavingsInterest, setOsSavingsInterest] = useState('0');
  const [osFdInterest, setOsFdInterest] = useState('0');
  const [osDividends, setOsDividends] = useState('0');
  const [osPension, setOsPension] = useState('0');
  const [osFamilyPension, setOsFamilyPension] = useState('0');
  const [osLottery, setOsLottery] = useState('0');

  // Deductions
  const [ded80C, setDed80C] = useState('0');
  const [ded80D, setDed80D] = useState('0');
  const [ded80TTA, setDed80TTA] = useState('0');

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

  // Detailed view comparison
  const [activeComparisonDetail, setActiveComparisonDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // --- ITR JSON Generator ---
  const generateITRJson = (detail: any, regime: 'old' | 'new', profileData: any) => {
    const inputs = detail.inputs;
    const outputs = detail.outputs;
    const activeRegimeOutput = regime === 'new' ? outputs.newRegime : outputs.oldRegime;

    const pan = profileData?.panNumber || inputs.panNumber || 'ABCDE1234F';
    const aadhaar = profileData?.aadhaarNumber || inputs.aadhaarNumber || '123456789012';
    const name = profileData?.fullName || inputs.fullName || 'Assessee';
    
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Taxpayer';
    const surName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
    const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';

    const dobValue = profileData?.dateOfBirth || inputs.dateOfBirth || '1990-01-01';
    const genderValue = profileData?.gender || inputs.gender || 'Male';
    const mobileValue = profileData?.phone || inputs.phone || '9999999999';
    const emailValue = profileData?.email || inputs.email || 'name@company.com';

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
        DOB: dobValue,
        Gender: genderValue === 'Male' ? 'M' : 'F',
        Address: {
          FlatRoadLoc: profileData?.address || inputs.address || 'Address Line 1',
          CityDist: profileData?.city || inputs.city || 'City',
          StateCode: profileData?.state || inputs.state || 'Delhi',
          PinCode: profileData?.pinCode || inputs.pinCode || '110001'
        },
        ContactInfo: {
          MobileNo: mobileValue,
          EmailID: emailValue
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
        TDS: activeRegimeOutput.totalTDS || 0,
        AdvanceTax: activeRegimeOutput.totalAdvanceTax || 0,
        SelfAssessmentTax: activeRegimeOutput.totalSelfAssessment || 0,
        TotalTaxesPaid: activeRegimeOutput.totalTaxesPaid || 0,
        NetPayableOrRefund: activeRegimeOutput.netTaxPayableOrRefund || 0
      },
      Refund: {
        BankAccounts: {
          BankAccount: {
            BankName: profileData?.bankName || inputs.business?.bankName || 'N/A',
            AccountNumber: profileData?.accountNumber || inputs.business?.accountNumber || 'N/A',
            IFSCCode: profileData?.ifscCode || inputs.business?.ifscCode || 'N/A'
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

  // --- Admin API Fetchers ---
  const loadAdminData = async (activeToken: string) => {
    setAdminLoading(true);
    try {
      // Fetch analytics
      const analRes = await fetch(`${API_URL}/admin/analytics`, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      if (analRes.ok) {
        const analData = await analRes.json();
        setAdminAnalytics(analData);
      }

      // Fetch users
      const usersRes = await fetch(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setAdminUsersList(usersData);
      }
    } catch (err) {
      console.error('Admin load error:', err);
    } finally {
      setAdminLoading(false);
    }
  };

  // --- Toggle User Suspension ---
  const handleToggleSuspend = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/suspend`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isSuspended: !currentStatus })
      });
      if (res.ok) {
        setAdminUsersList(prev => prev.map(u => u.id === userId ? { ...u, isSuspended: !currentStatus } : u));
        Alert.alert('Success', `User ${!currentStatus ? 'suspended' : 'unsuspended'} successfully!`);
      } else {
        const d = await res.json();
        Alert.alert('Error', d.error || 'Failed to update user status');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to reach API server');
    }
  };

  // --- Add FAQ CMS ---
  const handleAddFAQ = async () => {
    if (!faqQuestion || !faqAnswer) {
      Alert.alert('Error', 'Please fill in both question and answer');
      return;
    }
    setAdminSaving(true);
    try {
      const res = await fetch(`${API_URL}/cms/faqs`, {
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
        Alert.alert('Success', 'FAQ created successfully!');
      } else {
        const d = await res.json();
        Alert.alert('Error', d.error || 'Failed to create FAQ');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to reach API server');
    } finally {
      setAdminSaving(false);
    }
  };

  // --- Add Blog CMS ---
  const handleAddBlog = async () => {
    if (!blogTitle || !blogSlug || !blogContent) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setAdminSaving(true);
    try {
      const res = await fetch(`${API_URL}/cms/blogs`, {
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
        Alert.alert('Success', 'Blog post created successfully!');
      } else {
        const d = await res.json();
        Alert.alert('Error', d.error || 'Failed to create blog post');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to reach API server');
    } finally {
      setAdminSaving(false);
    }
  };

  // --- Save Tax Slab config overrides ---
  const handleSaveSlabs = async () => {
    setAdminSaving(true);
    try {
      const res = await fetch(`${API_URL}/admin/slabs`, {
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
        Alert.alert('Success', 'Tax slab rules saved successfully!');
      } else {
        const d = await res.json();
        Alert.alert('Error', d.error || 'Failed to save slab rules');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to reach API server');
    } finally {
      setAdminSaving(false);
    }
  };

  // --- Parser and Handlers for Tax Deposits & Form 26AS ---
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
      Alert.alert('Success', `Successfully parsed and added ${deposits.length} TDS entries from Form 26AS!`);
    } else {
      Alert.alert('Failed to Parse', "Could not automatically parse any TDS entries. Make sure it contains valid TANs and Tax Deducted values, or enter them manually.");
    }
  };

  const handleAddDeposit = () => {
    const amt = parseFloat(depAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Error', 'Please enter a valid deposit amount.');
      return;
    }
    
    if (depType === 'TDS') {
      if (!depDeductorTan || !/^[A-Z]{4}[0-9]{5}[A-Z]$/i.test(depDeductorTan.trim())) {
        Alert.alert('Error', 'Please enter a valid 10-digit deductor TAN (e.g. DELM12345C).');
        return;
      }
    } else {
      if (depBsr && !/^[0-9A-Z]{5,7}$/i.test(depBsr.trim())) {
        Alert.alert('Error', 'BSR Code must be 5 to 7 characters.');
        return;
      }
      if (depChallanNo && !/^[0-9]{1,7}$/i.test(depChallanNo.trim())) {
        Alert.alert('Error', 'Challan number must be a valid number.');
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

  // --- PDF downloader helper ---
  const handleDownloadPDF = (compId: string, regime: 'old' | 'new') => {
    const pdfUrl = `${API_URL.replace('/api', '')}/reports/${compId}/pdf?regime=${regime}&token=${token}`;
    Linking.openURL(pdfUrl).catch(err => {
      Alert.alert('Error', 'Failed to open download link in system browser');
    });
  };

  // --- JSON modal trigger ---
  const handleOpenJsonModal = async (item: any) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`${API_URL}/tax/computation/${item.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setJsonComp(data);
        setJsonRegime(data.recommendedRegime === 'New' ? 'new' : 'old');
        setShowJsonModal(true);
      } else {
        Alert.alert('Error', 'Failed to retrieve computation details');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to connect to backend server');
    } finally {
      setDetailLoading(false);
    }
  };

  // --- JSON native sharing handler ---
  const handleShareJson = async () => {
    if (!jsonComp) return;
    try {
      const itrJson = generateITRJson(jsonComp, jsonRegime, userProfile);
      const filename = `ITR_Upload_${(userProfile?.panNumber || jsonComp.inputs.panNumber || 'PAN').toUpperCase()}_AY${jsonComp.assessmentYear}_${jsonRegime}.json`;
      
      const shareResult = await Share.share({
        message: JSON.stringify(itrJson, null, 2),
        title: filename
      });
      
      if (shareResult.action === Share.sharedAction) {
        setShowJsonModal(false);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to share JSON');
    }
  };

  // Load profile and calculations from backend
  const loadProfileAndComputations = async (activeToken: string) => {
    setDashboardLoading(true);
    try {
      // Fetch user profile
      const profileRes = await fetch(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      if (profileRes.ok) {
        const pData = await profileRes.json();
        setUserProfile(pData);
        if (pData.fullName) setFullName(pData.fullName);
      }

      // Fetch saved calculations
      const compRes = await fetch(`${API_URL}/tax/computation`, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      if (compRes.ok) {
        const cData = await compRes.json();
        setComputations(cData);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setDashboardLoading(false);
    }
  };

  // 1. Password sign in
  const handlePasswordSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setAuthLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        if (data.user?.role === 'ADMIN') {
          await loadAdminData(data.token);
          setScreen('admin');
        } else {
          await loadProfileAndComputations(data.token);
          setScreen('dashboard');
        }
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Connection to backend failed');
    } finally {
      setAuthLoading(false);
    }
  };

  // 2. OTP OTP Send & verification
  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }
    setAuthLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      if (res.ok) {
        setOtpSent(true);
        Alert.alert('Success', 'OTP sent! Please check your terminal console to copy the code.');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Failed to reach server');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      Alert.alert('Error', 'Please enter the verification OTP');
      return;
    }
    setAuthLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        if (data.user?.role === 'ADMIN') {
          await loadAdminData(data.token);
          setScreen('admin');
        } else {
          await loadProfileAndComputations(data.token);
          setScreen('dashboard');
        }
      } else {
        setError(data.error || 'OTP verification failed');
      }
    } catch (err) {
      setError('Verification connection failed');
    } finally {
      setAuthLoading(false);
    }
  };

  // 2b. MOCK GOOGLE LOGIN
  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'google_user@taxcompute.com',
          name: 'Google User Client',
          googleToken: 'mock-google-token-xyz'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        if (data.user?.role === 'ADMIN') {
          await loadAdminData(data.token);
          setScreen('admin');
        } else {
          await loadProfileAndComputations(data.token);
          setScreen('dashboard');
        }
      } else {
        setError(data.error || 'Google login failed');
      }
    } catch (err) {
      setError('Connection to backend failed');
    } finally {
      setAuthLoading(false);
    }
  };

  // 3. Delete computation
  const handleDeleteComputation = (id: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this computation?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setDashboardLoading(true);
            try {
              const res = await fetch(`${API_URL}/tax/computation/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
              });
              if (res.ok) {
                setComputations(prev => prev.filter(c => c.id !== id));
              }
            } catch (err) {
              console.error(err);
            } finally {
              setDashboardLoading(false);
            }
          }
        }
      ]
    );
  };

  // 4. Open Computation Detailed Comparison View
  const handleViewComparison = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`${API_URL}/tax/computation/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveComparisonDetail(data);
        setScreen('comparison');
      } else {
        Alert.alert('Error', 'Failed to retrieve computation details');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to reach API server');
    } finally {
      setDetailLoading(false);
    }
  };

  // 5. Open Wizard in Edit Mode
  const handleOpenEditWizard = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`${API_URL}/tax/computation/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const inputs = data.inputs;

        setEditingId(id);
        setAy(data.assessmentYear);
        setDob(inputs.dateOfBirth);
        setResStatus(inputs.residentialStatus);
        setGender(inputs.gender || 'Male');
        setFullName(inputs.fullName);

        setSalaryBasic(String(inputs.salary?.basicSalary || 0));
        setSalaryHra(String(inputs.salary?.hra || 0));
        setSalaryPT(String(inputs.salary?.professionalTax || 0));

        setHpSelfOccupied(inputs.houseProperty?.isSelfOccupied ?? true);
        setHpRentReceived(String(inputs.houseProperty?.rentalIncome || 0));
        setHpMuniTaxes(String(inputs.houseProperty?.municipalTaxes || 0));
        setHpInterest(String(inputs.houseProperty?.housingLoanInterest || 0));

        setBizIsPresumptive(inputs.business?.isPresumptive44AD || false);
        setBizTradeName(inputs.business?.tradeName || '');
        setBizNature(inputs.business?.businessNature || 'Other services');
        setBizCode(inputs.business?.businessCode || '06002');
        setBizReceiptsCash(String(inputs.business?.receiptsCash || 0));
        setBizReceiptsBanking(String(inputs.business?.receiptsBanking || 0));
        setBizReceiptsOther(String(inputs.business?.receiptsOther || 0));
        setBizSelfAssessmentTax(String(inputs.business?.selfAssessmentTax || 0));

        setProfIsPresumptive(inputs.professional?.isPresumptive44ADA || false);
        setProfTradeName(inputs.professional?.tradeName || '');
        setProfNature(inputs.professional?.professionNature || 'Other services');
        setProfCode(inputs.professional?.professionCode || '16013');
        setProfReceiptsCash(String(inputs.professional?.receiptsCash || 0));
        setProfReceiptsBanking(String(inputs.professional?.receiptsBanking || 0));
        setProfNormalReceipts(String(inputs.professional?.grossReceipts || 0));
        setProfNormalExpenses(String(inputs.professional?.expenses || 0));
        setProfNormalDepr(String(inputs.professional?.depreciation || 0));

        setCgShareMarket(String(inputs.capitalGains?.shareMarketGains || 0));
        setCgLongTerm(String(inputs.capitalGains?.longTermLtcg || 0));
        setCgShortTerm(String(inputs.capitalGains?.shortTermStcg || 0));
        setCgPropertySale(String(inputs.capitalGains?.propertySaleGains || 0));

        setOsSavingsInterest(String(inputs.otherSources?.interestSavings || 0));
        setOsFdInterest(String(inputs.otherSources?.interestFD || 0));
        setOsDividends(String(inputs.otherSources?.dividends || 0));
        setOsPension(String(inputs.otherSources?.pension || 0));
        setOsFamilyPension(String(inputs.otherSources?.familyPension || 0));
        setOsLottery(String(inputs.otherSources?.lotteryIncome || 0));

        setDed80C(String(inputs.deductions?.sec80C || 0));
        setDed80D(String(inputs.deductions?.sec80D || 0));
        setDed80TTA(String(inputs.deductions?.sec80TTA || 0));
        setTaxDeposits(inputs.taxDeposits || []);

        setWizardStep(1);
        setScreen('wizard');
      } else {
        Alert.alert('Error', 'Failed to retrieve computation details');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to reach API server');
    } finally {
      setDetailLoading(false);
    }
  };

  // Launch fresh wizard
  const handleLaunchCreateWizard = () => {
    setEditingId(null);
    setAy('2025-26');
    setDob(userProfile?.dateOfBirth || '1990-01-01');
    setResStatus('Resident');
    setGender(userProfile?.gender || 'Male');
    setFullName(userProfile?.fullName || '');

    setSalaryBasic('0');
    setSalaryHra('0');
    setSalaryPT('0');

    setHpSelfOccupied(true);
    setHpRentReceived('0');
    setHpMuniTaxes('0');
    setHpInterest('0');

    setBizIsPresumptive(false);
    setBizTradeName('');
    setBizNature('Building complete constructions');
    setBizCode('06002');
    setBizReceiptsCash('0');
    setBizReceiptsBanking('0');
    setBizReceiptsOther('0');
    setBizSelfAssessmentTax('0');

    setProfIsPresumptive(false);
    setProfTradeName('');
    setProfNature('Software development');
    setProfCode('16013');
    setProfReceiptsCash('0');
    setProfReceiptsBanking('0');
    setProfNormalReceipts('0');
    setProfNormalExpenses('0');
    setProfNormalDepr('0');

    setCgShareMarket('0');
    setCgLongTerm('0');
    setCgShortTerm('0');
    setCgPropertySale('0');

    setOsSavingsInterest('0');
    setOsFdInterest('0');
    setOsDividends('0');
    setOsPension('0');
    setOsFamilyPension('0');
    setOsLottery('0');

    setDed80C('0');
    setDed80D('0');
    setDed80TTA('0');
    setTaxDeposits([]);

    setWizardStep(1);
    setScreen('wizard');
  };

  // 6. Submit Wizard (Save or Update)
  const handleSaveWizard = async () => {
    const parsedSalary = parseFloat(salaryBasic) || 0;
    const parsedHra = parseFloat(salaryHra) || 0;
    const parsedPT = parseFloat(salaryPT) || 0;

    const parsedRent = parseFloat(hpRentReceived) || 0;
    const parsedMuni = parseFloat(hpMuniTaxes) || 0;
    const parsedInterest = parseFloat(hpInterest) || 0;

    const parsedCgShare = parseFloat(cgShareMarket) || 0;
    const parsedCgLong = parseFloat(cgLongTerm) || 0;
    const parsedCgShort = parseFloat(cgShortTerm) || 0;
    const parsedCgProp = parseFloat(cgPropertySale) || 0;

    const parsedOsSavings = parseFloat(osSavingsInterest) || 0;
    const parsedOsFD = parseFloat(osFdInterest) || 0;
    const parsedOsDiv = parseFloat(osDividends) || 0;
    const parsedOsPen = parseFloat(osPension) || 0;
    const parsedOsFamPen = parseFloat(osFamilyPension) || 0;
    const parsedOsLot = parseFloat(osLottery) || 0;

    const parsed80C = parseFloat(ded80C) || 0;
    const parsed80D = parseFloat(ded80D) || 0;
    const parsed80TTA = parseFloat(ded80TTA) || 0;

    const body: any = {
      assessmentYear: ay,
      fullName,
      panNumber: userProfile?.panNumber || 'ABCDE1234F',
      dateOfBirth: dob,
      gender: gender as 'Male' | 'Female' | 'Other',
      residentialStatus: resStatus as 'Resident' | 'Non-Resident' | 'RNOR',
      salary: {
        basicSalary: parsedSalary,
        hra: parsedHra,
        da: 0,
        bonus: 0,
        commission: 0,
        otherAllowances: 0,
        perquisites: 0,
        professionalTax: parsedPT
      },
      houseProperty: {
        isSelfOccupied: hpSelfOccupied,
        rentalIncome: parsedRent,
        municipalTaxes: parsedMuni,
        housingLoanInterest: parsedInterest
      },
      business: {
        isPresumptive44AD: bizIsPresumptive,
        tradeName: bizTradeName,
        businessNature: bizNature,
        businessCode: bizCode,
        receiptsCash: parseFloat(bizReceiptsCash) || 0,
        receiptsBanking: parseFloat(bizReceiptsBanking) || 0,
        receiptsOther: parseFloat(bizReceiptsOther) || 0,
        selfAssessmentTax: parseFloat(bizSelfAssessmentTax) || 0,
        grossReceipts: bizIsPresumptive ? (parseFloat(bizReceiptsCash) + parseFloat(bizReceiptsBanking) + parseFloat(bizReceiptsOther)) : 0,
        expenses: 0,
        depreciation: 0,
        profitLossOverride: bizIsPresumptive ? Math.round(parseFloat(bizReceiptsCash) * 0.08 + parseFloat(bizReceiptsBanking) * 0.06 + parseFloat(bizReceiptsOther) * 0.08) : undefined
      },
      professional: {
        isPresumptive44ADA: profIsPresumptive,
        tradeName: profTradeName,
        professionNature: profNature,
        professionCode: profCode,
        receiptsCash: parseFloat(profReceiptsCash) || 0,
        receiptsBanking: parseFloat(profReceiptsBanking) || 0,
        grossReceipts: profIsPresumptive ? (parseFloat(profReceiptsCash) + parseFloat(profReceiptsBanking)) : (parseFloat(profNormalReceipts) || 0),
        expenses: profIsPresumptive ? 0 : (parseFloat(profNormalExpenses) || 0),
        depreciation: profIsPresumptive ? 0 : (parseFloat(profNormalDepr) || 0),
        profitLossOverride: profIsPresumptive ? Math.round((parseFloat(profReceiptsCash) + parseFloat(profReceiptsBanking)) * 0.5) : undefined
      },
      capitalGains: {
        shortTermStcg: parsedCgShort,
        longTermLtcg: parsedCgLong,
        propertySaleGains: parsedCgProp,
        shareMarketGains: parsedCgShare
      },
      otherSources: {
        interestSavings: parsedOsSavings,
        interestFD: parsedOsFD,
        dividends: parsedOsDiv,
        pension: parsedOsPen,
        familyPension: parsedOsFamPen,
        lotteryIncome: parsedOsLot
      },
      deductions: {
        sec80C: parsed80C,
        sec80CCD_1B: 0,
        sec80D: parsed80D,
        sec80E: 0,
        sec80G: 0,
        sec80TTA: parsed80TTA,
        sec80TTB: 0,
        otherDeductions: 0
      },
      exemptions: {
        hraExemption: 0,
        ltaExemption: 0,
        agriculturalIncome: 0,
        gratuity: 0,
        leaveEncashment: 0,
        vrsBenefits: 0,
        otherExemptions: 0
      },
      taxDeposits: taxDeposits
    };

    setWizardSaving(true);
    try {
      const url = editingId 
        ? `${API_URL}/tax/computation/${editingId}` 
        : `${API_URL}/tax/computation`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('Success', editingId ? 'Computation updated successfully!' : 'Computation saved successfully!');
        await loadProfileAndComputations(token!);
        setScreen('dashboard');
      } else {
        Alert.alert('Failed to Save', data.error || 'Server validation failed');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Connection to server failed while saving computation');
    } finally {
      setWizardSaving(false);
    }
  };

  // 7. Perform real-time simulation check inside wizard
  const getSimulationResult = () => {
    const parsedSalary = parseFloat(salaryBasic) || 0;
    const parsedHra = parseFloat(salaryHra) || 0;
    const parsedPT = parseFloat(salaryPT) || 0;

    const parsedRent = parseFloat(hpRentReceived) || 0;
    const parsedMuni = parseFloat(hpMuniTaxes) || 0;
    const parsedInterest = parseFloat(hpInterest) || 0;

    const parsedCgShare = parseFloat(cgShareMarket) || 0;
    const parsedCgLong = parseFloat(cgLongTerm) || 0;
    const parsedCgShort = parseFloat(cgShortTerm) || 0;
    const parsedCgProp = parseFloat(cgPropertySale) || 0;

    const parsedOsSavings = parseFloat(osSavingsInterest) || 0;
    const parsedOsFD = parseFloat(osFdInterest) || 0;
    const parsedOsDiv = parseFloat(osDividends) || 0;
    const parsedOsPen = parseFloat(osPension) || 0;
    const parsedOsFamPen = parseFloat(osFamilyPension) || 0;
    const parsedOsLot = parseFloat(osLottery) || 0;

    const parsed80C = parseFloat(ded80C) || 0;
    const parsed80D = parseFloat(ded80D) || 0;
    const parsed80TTA = parseFloat(ded80TTA) || 0;

    const inputs: any = {
      assessmentYear: ay,
      fullName: fullName || 'Simulated Assessee',
      panNumber: userProfile?.panNumber || 'ABCDE1234F',
      dateOfBirth: dob,
      gender: gender as 'Male' | 'Female' | 'Other',
      residentialStatus: resStatus as 'Resident' | 'Non-Resident' | 'RNOR',
      salary: {
        basicSalary: parsedSalary,
        hra: parsedHra,
        da: 0,
        bonus: 0,
        commission: 0,
        otherAllowances: 0,
        perquisites: 0,
        professionalTax: parsedPT
      },
      houseProperty: {
        isSelfOccupied: hpSelfOccupied,
        rentalIncome: parsedRent,
        municipalTaxes: parsedMuni,
        housingLoanInterest: parsedInterest
      },
      business: {
        isPresumptive44AD: bizIsPresumptive,
        tradeName: bizTradeName,
        businessNature: bizNature,
        businessCode: bizCode,
        receiptsCash: parseFloat(bizReceiptsCash) || 0,
        receiptsBanking: parseFloat(bizReceiptsBanking) || 0,
        receiptsOther: parseFloat(bizReceiptsOther) || 0,
        selfAssessmentTax: parseFloat(bizSelfAssessmentTax) || 0,
        grossReceipts: bizIsPresumptive ? (parseFloat(bizReceiptsCash) + parseFloat(bizReceiptsBanking) + parseFloat(bizReceiptsOther)) : 0,
        expenses: 0,
        depreciation: 0,
        profitLossOverride: bizIsPresumptive ? Math.round(parseFloat(bizReceiptsCash) * 0.08 + parseFloat(bizReceiptsBanking) * 0.06 + parseFloat(bizReceiptsOther) * 0.08) : undefined
      },
      professional: {
        isPresumptive44ADA: profIsPresumptive,
        tradeName: profTradeName,
        professionNature: profNature,
        professionCode: profCode,
        receiptsCash: parseFloat(profReceiptsCash) || 0,
        receiptsBanking: parseFloat(profReceiptsBanking) || 0,
        grossReceipts: profIsPresumptive ? (parseFloat(profReceiptsCash) + parseFloat(profReceiptsBanking)) : (parseFloat(profNormalReceipts) || 0),
        expenses: profIsPresumptive ? 0 : (parseFloat(profNormalExpenses) || 0),
        depreciation: profIsPresumptive ? 0 : (parseFloat(profNormalDepr) || 0),
        profitLossOverride: profIsPresumptive ? Math.round((parseFloat(profReceiptsCash) + parseFloat(profReceiptsBanking)) * 0.5) : undefined
      },
      capitalGains: {
        shortTermStcg: parsedCgShort,
        longTermLtcg: parsedCgLong,
        propertySaleGains: parsedCgProp,
        shareMarketGains: parsedCgShare
      },
      otherSources: {
        interestSavings: parsedOsSavings,
        interestFD: parsedOsFD,
        dividends: parsedOsDiv,
        pension: parsedOsPen,
        familyPension: parsedOsFamPen,
        lotteryIncome: parsedOsLot
      },
      deductions: {
        sec80C: parsed80C,
        sec80CCD_1B: 0,
        sec80D: parsed80D,
        sec80E: 0,
        sec80G: 0,
        sec80TTA: parsed80TTA,
        sec80TTB: 0,
        otherDeductions: 0
      },
      exemptions: {
        hraExemption: 0,
        ltaExemption: 0,
        agriculturalIncome: 0,
        gratuity: 0,
        leaveEncashment: 0,
        vrsBenefits: 0,
        otherExemptions: 0
      },
      taxDeposits: taxDeposits
    };

    try {
      return compareRegimes(inputs);
    } catch (e) {
      return null;
    }
  };

  const simulation = getSimulationResult();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* -------------------- 1. LOGIN SCREEN -------------------- */}
      {screen === 'login' && (
        <ScrollView contentContainerStyle={styles.centerScroll}>
          <View style={styles.loginCard}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoSymbol}>₹</Text>
            </View>
            <Text style={styles.appName}>TaxCompute CA Portal</Text>
            <Text style={styles.appDesc}>Secure Assessee Filing & Reconciliation</Text>

            {error ? (
              <View style={styles.errorAlert}>
                <Text style={styles.errorAlertText}>{error}</Text>
              </View>
            ) : null}

            {/* Segment Toggle */}
            <View style={styles.segmentToggle}>
              <TouchableOpacity 
                style={[styles.segmentBtn, loginMethod === 'password' && styles.segmentBtnActive]}
                onPress={() => { setLoginMethod('password'); setError(''); }}
              >
                <Text style={[styles.segmentText, loginMethod === 'password' && styles.segmentTextActive]}>Password</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.segmentBtn, loginMethod === 'otp' && styles.segmentBtnActive]}
                onPress={() => { setLoginMethod('otp'); setError(''); }}
              >
                <Text style={[styles.segmentText, loginMethod === 'otp' && styles.segmentTextActive]}>Mobile OTP</Text>
              </TouchableOpacity>
            </View>

            {loginMethod === 'password' ? (
              <View style={styles.w100}>
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity 
                  style={styles.btnPrimary} 
                  onPress={handlePasswordSignIn}
                  disabled={authLoading}
                >
                  {authLoading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.btnPrimaryText}>Secure Sign In</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.w100}>
                <View style={styles.otpRow}>
                  <TextInput
                    style={[styles.input, styles.otpPhoneInput]}
                    placeholder="Mobile (10 digits)"
                    placeholderTextColor="#94a3b8"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={phone}
                    onChangeText={setPhone}
                  />
                  <TouchableOpacity 
                    style={styles.otpSendBtn} 
                    onPress={handleSendOTP}
                    disabled={authLoading}
                  >
                    <Text style={styles.otpSendText}>{otpSent ? 'Resend' : 'Send'}</Text>
                  </TouchableOpacity>
                </View>

                {otpSent && (
                  <View style={styles.w100}>
                    <TextInput
                      style={styles.input}
                      placeholder="6 digit OTP Code"
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                      maxLength={6}
                      value={otp}
                      onChangeText={setOtp}
                    />
                    <TouchableOpacity 
                      style={styles.btnPrimary} 
                      onPress={handleVerifyOTP}
                      disabled={authLoading}
                    >
                      {authLoading ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <Text style={styles.btnPrimaryText}>Verify & Sign In</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Divider */}
            <View style={styles.orDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign In */}
            <TouchableOpacity 
              style={styles.btnGoogle} 
              onPress={handleGoogleSignIn}
              disabled={authLoading}
            >
              <Text style={styles.btnGoogleText}>🔴 Mock Google Sign In</Text>
            </TouchableOpacity>

            <View style={styles.secureBadge}>
              <Text style={styles.secureText}>🔒 Secured with AES Data Masking & JWT</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* -------------------- 2. DASHBOARD SCREEN -------------------- */}
      {screen === 'dashboard' && (
        <View style={styles.flex1}>
          {/* Header */}
          <View style={styles.navBar}>
            <View style={styles.navTitleRow}>
              <Text style={styles.navLogo}>₹</Text>
              <Text style={styles.navTitle}>TaxCompute.in</Text>
            </View>
            <TouchableOpacity onPress={() => { setToken(null); setScreen('login'); }}>
              <Text style={styles.navLogout}>Logout</Text>
            </TouchableOpacity>
          </View>

          {dashboardLoading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color="#1e3a8a" />
              <Text style={styles.loadingText}>Fetching saved computation sheets...</Text>
            </View>
          ) : (
            <ScrollView style={styles.scroll}>
              {/* Profile Card */}
              {userProfile && (
                <View style={styles.profileCard}>
                  <Text style={styles.profileName}>Welcome, {userProfile.fullName || 'Filer'}</Text>
                  
                  <View style={styles.profileFields}>
                    <View style={styles.profileField}>
                      <Text style={styles.profileLabel}>PAN</Text>
                      <View style={styles.profileRow}>
                        <Text style={styles.profileValue}>
                          {showPan ? userProfile.panNumber : 'XXXXX' + userProfile.panNumber.slice(-5)}
                        </Text>
                        <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPan(!showPan)}>
                          <Text style={styles.eyeIcon}>{showPan ? '👁️' : '🕶️'}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.profileField}>
                      <Text style={styles.profileLabel}>Aadhaar</Text>
                      <View style={styles.profileRow}>
                        <Text style={styles.profileValue}>
                          {showAadhaar ? userProfile.aadhaarNumber : 'XXXXXXXX' + userProfile.aadhaarNumber.slice(-4)}
                        </Text>
                        <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowAadhaar(!showAadhaar)}>
                          <Text style={styles.eyeIcon}>{showAadhaar ? '👁️' : '🕶️'}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Action Banner */}
              <View style={styles.gradientBanner}>
                <Text style={styles.bannerTitle}>CA-Approved Tax Reconciliation</Text>
                <Text style={styles.bannerDesc}>Compare statutory regimes, optimize exemptions, and prepare ITR-ready records.</Text>
                <TouchableOpacity style={styles.bannerBtn} onPress={handleLaunchCreateWizard}>
                  <Text style={styles.bannerBtnText}>➕ Create New Computation</Text>
                </TouchableOpacity>
              </View>

              {/* Computations List */}
              <Text style={styles.secTitle}>Active computations</Text>
              
              {computations.length === 0 ? (
                <View style={styles.emptyList}>
                  <Text style={styles.emptyText}>No tax computations saved yet.</Text>
                </View>
              ) : (
                computations.map((item) => (
                  <View key={item.id} style={styles.compCard}>
                    <View style={styles.compHeader}>
                      <Text style={styles.compYear}>AY {item.assessmentYear}</Text>
                      <View style={[styles.badge, item.recommendedRegime === 'New' ? styles.badgeNew : styles.badgeOld]}>
                        <Text style={[styles.badgeText, item.recommendedRegime === 'New' ? styles.badgeTextNew : styles.badgeTextOld]}>
                          {item.recommendedRegime} Recommended
                        </Text>
                      </View>
                    </View>

                    <View style={styles.compMetrics}>
                      <View>
                        <Text style={styles.metricLabel}>Tax Payable</Text>
                        <Text style={styles.metricVal}>₹{item.totalTaxPayable.toLocaleString('en-IN')}</Text>
                      </View>
                      <View>
                        <Text style={styles.metricLabel}>Tax Saved</Text>
                        <Text style={styles.metricValSaved}>₹{item.taxSaved.toLocaleString('en-IN')}</Text>
                      </View>
                    </View>

                    <View style={styles.compActions}>
                      <TouchableOpacity 
                        style={styles.actionBtn}
                        onPress={() => handleViewComparison(item.id)}
                      >
                        <Text style={styles.actionBtnText}>📊 View Comparison</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={styles.actionBtnEdit}
                        onPress={() => handleOpenEditWizard(item.id)}
                      >
                        <Text style={styles.actionBtnTextEdit}>✏️ Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={styles.actionBtnDel}
                        onPress={() => handleDeleteComputation(item.id)}
                      >
                        <Text style={styles.actionBtnTextDel}>🗑️ Delete</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={[styles.compActions, { marginTop: 8 }]}>
                      <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}
                        onPress={() => handleDownloadPDF(item.id, 'old')}
                      >
                        <Text style={[styles.actionBtnText, { color: '#1d4ed8' }]}>📄 PDF (Old)</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}
                        onPress={() => handleDownloadPDF(item.id, 'new')}
                      >
                        <Text style={[styles.actionBtnText, { color: '#1d4ed8' }]}>📄 PDF (New)</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}
                        onPress={() => handleOpenJsonModal(item)}
                      >
                        <Text style={[styles.actionBtnText, { color: '#15803d' }]}>💾 ITR JSON</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </View>
      )}

      {/* -------------------- 3. WIZARD SCREEN -------------------- */}
      {screen === 'wizard' && (
        <View style={styles.flex1}>
          {/* Header */}
          <View style={styles.navBar}>
            <TouchableOpacity onPress={() => setScreen('dashboard')}>
              <Text style={styles.navBack}>&larr; Back</Text>
            </TouchableOpacity>
            <Text style={styles.navTitle}>{editingId ? 'Edit Computation' : 'New Computation'}</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Steps selector */}
          <View style={styles.stepsBar}>
            {[1, 2, 3, 4, 5, 6, 7].map((st) => (
              <TouchableOpacity 
                key={st}
                style={[styles.stepDot, wizardStep === st && styles.stepDotActive, wizardStep > st && styles.stepDotCompleted]}
                onPress={() => setWizardStep(st)}
              >
                <Text style={[styles.stepDotText, wizardStep >= st && styles.stepDotTextActive]}>{st}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView style={styles.scroll}>
            <View style={styles.card}>
              
              {/* STEP 1: Basic profiles */}
              {wizardStep === 1 && (
                <View>
                  <Text style={styles.stepTitle}>Step 1: Filing Details</Text>
                  
                  <Text style={styles.label}>Assessment Year</Text>
                  <View style={styles.tabsRow}>
                    {['2025-26', '2026-27'].map((y) => (
                      <TouchableOpacity
                        key={y}
                        style={[styles.tabBtn, ay === y && styles.tabBtnActive]}
                        onPress={() => setAy(y)}
                      >
                        <Text style={[styles.tabBtnText, ay === y && styles.tabBtnTextActive]}>AY {y}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>Full Name</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="Enter Assessee Name"
                    placeholderTextColor="#94a3b8"
                    value={fullName}
                    onChangeText={setFullName}
                  />

                  <Text style={styles.label}>Date of Birth (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="e.g. 1990-01-01"
                    placeholderTextColor="#94a3b8"
                    value={dob}
                    onChangeText={setDob}
                  />

                  <Text style={styles.label}>Gender</Text>
                  <View style={styles.tabsRow}>
                    {['Male', 'Female'].map((g) => (
                      <TouchableOpacity
                        key={g}
                        style={[styles.tabBtn, gender === g && styles.tabBtnActive]}
                        onPress={() => setGender(g)}
                      >
                        <Text style={[styles.tabBtnText, gender === g && styles.tabBtnTextActive]}>{g}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>Residential Status</Text>
                  <View style={styles.tabsRow}>
                    {['Resident', 'Non-Resident'].map((r) => (
                      <TouchableOpacity
                        key={r}
                        style={[styles.tabBtn, resStatus === r && styles.tabBtnActive]}
                        onPress={() => setResStatus(r)}
                      >
                        <Text style={[styles.tabBtnText, resStatus === r && styles.tabBtnTextActive]}>{r}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* STEP 2: Salary & House Property */}
              {wizardStep === 2 && (
                <View>
                  <Text style={styles.stepTitle}>Step 2: Salary & House Property</Text>
                  
                  <Text style={styles.label}>Gross Salary (Annual)</Text>
                  <TextInput
                    style={styles.inputField}
                    keyboardType="numeric"
                    value={salaryBasic}
                    onChangeText={setSalaryBasic}
                  />

                  <Text style={styles.label}>House Rent Allowance (HRA) Received</Text>
                  <TextInput
                    style={styles.inputField}
                    keyboardType="numeric"
                    value={salaryHra}
                    onChangeText={setSalaryHra}
                  />

                  <Text style={styles.label}>Professional Tax Paid</Text>
                  <TextInput
                    style={styles.inputField}
                    keyboardType="numeric"
                    value={salaryPT}
                    onChangeText={setSalaryPT}
                  />

                  <View style={styles.divider} />
                  
                  <View style={styles.switchRow}>
                    <Text style={styles.label}>House Property is Self-Occupied</Text>
                    <Switch
                      value={hpSelfOccupied}
                      onValueChange={setHpSelfOccupied}
                      trackColor={{ false: '#767577', true: '#bfdbfe' }}
                      thumbColor={hpSelfOccupied ? '#1e3a8a' : '#f4f3f4'}
                    />
                  </View>

                  {!hpSelfOccupied && (
                    <View>
                      <Text style={styles.label}>Annual Rental Income Received</Text>
                      <TextInput
                        style={styles.inputField}
                        keyboardType="numeric"
                        value={hpRentReceived}
                        onChangeText={setHpRentReceived}
                      />

                      <Text style={styles.label}>Municipal Taxes Paid</Text>
                      <TextInput
                        style={styles.inputField}
                        keyboardType="numeric"
                        value={hpMuniTaxes}
                        onChangeText={setHpMuniTaxes}
                      />
                    </View>
                  )}

                  <Text style={styles.label}>Home Loan Interest Paid u/s 24(b)</Text>
                  <TextInput
                    style={styles.inputField}
                    keyboardType="numeric"
                    value={hpInterest}
                    onChangeText={setHpInterest}
                  />
                </View>
              )}

              {/* STEP 3: Presumptive Business (44AD) */}
              {wizardStep === 3 && (
                <View>
                  <View style={styles.switchRow}>
                    <Text style={styles.stepTitle}>Presumptive Business u/s 44AD</Text>
                    <Switch
                      value={bizIsPresumptive}
                      onValueChange={setBizIsPresumptive}
                      trackColor={{ false: '#767577', true: '#bfdbfe' }}
                      thumbColor={bizIsPresumptive ? '#1e3a8a' : '#f4f3f4'}
                    />
                  </View>

                  {bizIsPresumptive ? (
                    <View>
                      <Text style={styles.label}>Trade Name</Text>
                      <TextInput
                        style={styles.inputField}
                        placeholder="e.g. Apex Traders"
                        placeholderTextColor="#94a3b8"
                        value={bizTradeName}
                        onChangeText={setBizTradeName}
                      />

                      <View style={styles.inlineHeaderRow}>
                        <Text style={styles.label}>Business Code</Text>
                        <TouchableOpacity
                          onPress={() => {
                            setMobileSearchTarget('business');
                            setMobileSearchModalVisible(true);
                          }}
                        >
                          <Text style={styles.searchLink}>🔍 Search Codes</Text>
                        </TouchableOpacity>
                      </View>
                      <TextInput
                        style={styles.inputField}
                        value={bizCode}
                        onChangeText={setBizCode}
                        placeholder="e.g. 06002"
                        placeholderTextColor="#94a3b8"
                      />

                      {bizCode === '06004' && (
                        <View style={styles.warningBox}>
                          <Text style={styles.warningTitle}>⚠️ Selected Construction Code: 06004</Text>
                          <Text style={styles.warningText}>Note that the tax department uses codes 06001 to 06007 for construction. Click "Search Codes" to review and verify.</Text>
                        </View>
                      )}

                      <Text style={styles.label}>Nature of Business</Text>
                      <TextInput
                        style={styles.inputField}
                        value={bizNature}
                        onChangeText={setBizNature}
                      />

                      <Text style={styles.label}>Gross Receipts (Cash Mode)</Text>
                      <TextInput
                        style={styles.inputField}
                        keyboardType="numeric"
                        value={bizReceiptsCash}
                        onChangeText={setBizReceiptsCash}
                      />

                      <Text style={styles.label}>Gross Receipts (Digital/Banking Mode)</Text>
                      <TextInput
                        style={styles.inputField}
                        keyboardType="numeric"
                        value={bizReceiptsBanking}
                        onChangeText={setBizReceiptsBanking}
                      />

                      <Text style={styles.label}>Self-Assessment Tax Paid</Text>
                      <TextInput
                        style={styles.inputField}
                        keyboardType="numeric"
                        value={bizSelfAssessmentTax}
                        onChangeText={setBizSelfAssessmentTax}
                      />
                    </View>
                  ) : (
                    <Text style={styles.infoText}>Toggle switch to enable business income declaration under presumptive tax rules (ITR-4).</Text>
                  )}
                </View>
              )}

              {/* STEP 4: Professional Income (44ADA / Others) */}
              {wizardStep === 4 && (
                <View>
                  <View style={styles.switchRow}>
                    <Text style={styles.stepTitle}>Presumptive Professional u/s 44ADA</Text>
                    <Switch
                      value={profIsPresumptive}
                      onValueChange={setProfIsPresumptive}
                      trackColor={{ false: '#767577', true: '#bfdbfe' }}
                      thumbColor={profIsPresumptive ? '#1e3a8a' : '#f4f3f4'}
                    />
                  </View>

                  {profIsPresumptive ? (
                    <View>
                      <Text style={styles.label}>Trade Name</Text>
                      <TextInput
                        style={styles.inputField}
                        placeholder="e.g. Apex Consulting"
                        placeholderTextColor="#94a3b8"
                        value={profTradeName}
                        onChangeText={setProfTradeName}
                      />

                      <View style={styles.inlineHeaderRow}>
                        <Text style={styles.label}>Profession Code</Text>
                        <TouchableOpacity
                          onPress={() => {
                            setMobileSearchTarget('professional');
                            setMobileSearchModalVisible(true);
                          }}
                        >
                          <Text style={styles.searchLink}>🔍 Search Codes</Text>
                        </TouchableOpacity>
                      </View>
                      <TextInput
                        style={styles.inputField}
                        value={profCode}
                        onChangeText={setProfCode}
                        placeholder="e.g. 16013"
                        placeholderTextColor="#94a3b8"
                      />

                      <Text style={styles.label}>Nature of Profession</Text>
                      <TextInput
                        style={styles.inputField}
                        value={profNature}
                        onChangeText={setProfNature}
                      />

                      <Text style={styles.label}>Gross Receipts (Cash Mode)</Text>
                      <TextInput
                        style={styles.inputField}
                        keyboardType="numeric"
                        value={profReceiptsCash}
                        onChangeText={setProfReceiptsCash}
                      />

                      <Text style={styles.label}>Gross Receipts (Digital/Banking Mode)</Text>
                      <TextInput
                        style={styles.inputField}
                        keyboardType="numeric"
                        value={profReceiptsBanking}
                        onChangeText={setProfReceiptsBanking}
                      />

                      <View style={styles.calcPreviewBox}>
                        <Text style={styles.calcPreviewTitle}>Presumptive Profit u/s 44ADA (50%):</Text>
                        <Text style={styles.calcPreviewVal}>
                          ₹ {Math.round(((parseFloat(profReceiptsCash) || 0) + (parseFloat(profReceiptsBanking) || 0)) * 0.5).toLocaleString('en-IN')}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View>
                      <Text style={styles.label}>Gross Receipts</Text>
                      <TextInput
                        style={styles.inputField}
                        keyboardType="numeric"
                        value={profNormalReceipts}
                        onChangeText={setProfNormalReceipts}
                      />

                      <Text style={styles.label}>Operational Expenses</Text>
                      <TextInput
                        style={styles.inputField}
                        keyboardType="numeric"
                        value={profNormalExpenses}
                        onChangeText={setProfNormalExpenses}
                      />

                      <Text style={styles.label}>Depreciation Claimed</Text>
                      <TextInput
                        style={styles.inputField}
                        keyboardType="numeric"
                        value={profNormalDepr}
                        onChangeText={setProfNormalDepr}
                      />
                    </View>
                  )}
                </View>
              )}

              {/* STEP 5: Capital Gains & Other Sources */}
              {wizardStep === 5 && (
                <View>
                  <Text style={styles.stepTitle}>Step 5: Other Incomes</Text>
                  
                  <Text style={styles.labelHeader}>Capital Gains</Text>
                  <Text style={styles.label}>Share Market Gains (STCG/LTCG)</Text>
                  <TextInput
                    style={styles.inputField}
                    keyboardType="numeric"
                    value={cgShareMarket}
                    onChangeText={setCgShareMarket}
                  />
                  <Text style={styles.label}>Property Sale Long Term Gains</Text>
                  <TextInput
                    style={styles.inputField}
                    keyboardType="numeric"
                    value={cgLongTerm}
                    onChangeText={setCgLongTerm}
                  />

                  <View style={styles.divider} />
                  
                  <Text style={styles.labelHeader}>Other Sources</Text>
                  
                  <Text style={styles.label}>Savings Account Interest</Text>
                  <TextInput
                    style={styles.inputField}
                    keyboardType="numeric"
                    value={osSavingsInterest}
                    onChangeText={setOsSavingsInterest}
                  />

                  <Text style={styles.label}>FD Interest / Others</Text>
                  <TextInput
                    style={styles.inputField}
                    keyboardType="numeric"
                    value={osFdInterest}
                    onChangeText={setOsFdInterest}
                  />

                  <Text style={styles.label}>Dividends Received</Text>
                  <TextInput
                    style={styles.inputField}
                    keyboardType="numeric"
                    value={osDividends}
                    onChangeText={setOsDividends}
                  />

                  <Text style={styles.label}>Winnings from Lotteries (u/s 115BB)</Text>
                  <TextInput
                    style={styles.inputField}
                    keyboardType="numeric"
                    value={osLottery}
                    onChangeText={setOsLottery}
                  />
                </View>
              )}

              {/* STEP 6: Deductions (Chapter VI-A) */}
              {wizardStep === 6 && (
                <View>
                  <Text style={styles.stepTitle}>Step 6: Statutory Deductions (Old Regime)</Text>
                  
                  <Text style={styles.label}>Section 80C (PPF, LIC, ELSS, School Fees)</Text>
                  <TextInput
                    style={styles.inputField}
                    keyboardType="numeric"
                    value={ded80C}
                    onChangeText={setDed80C}
                  />

                  <Text style={styles.label}>Section 80D (Medical Insurance Premium)</Text>
                  <TextInput
                    style={styles.inputField}
                    keyboardType="numeric"
                    value={ded80D}
                    onChangeText={setDed80D}
                  />

                  <Text style={styles.label}>Section 80TTA (Savings Account Interest)</Text>
                  <TextInput
                    style={styles.inputField}
                    keyboardType="numeric"
                    value={ded80TTA}
                    onChangeText={setDed80TTA}
                  />
                </View>
              )}

              {/* STEP 7: Tax Deposited & TDS */}
              {wizardStep === 7 && (
                <View>
                  <Text style={styles.stepTitle}>Step 7: Tax Deposited & TDS Details</Text>
                  
                  {/* Form 26AS copy paste panel */}
                  <TouchableOpacity 
                    style={[styles.btnSecondary, { marginBottom: 12, paddingVertical: 10 }]}
                    onPress={() => setShow26ASUpload(!show26ASUpload)}
                  >
                    <Text style={styles.btnSecondaryText}>
                      {show26ASUpload ? 'Hide 26AS Paste Area' : 'Import from 26AS Copy-Paste'}
                    </Text>
                  </TouchableOpacity>

                  {show26ASUpload && (
                    <View style={{ backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 15 }}>
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#64748b', marginBottom: 6 }}>
                        Paste raw text from Form 26AS containing TANs & deducted amounts:
                      </Text>
                      <TextInput
                        multiline
                        numberOfLines={5}
                        placeholder="Paste text here..."
                        style={[styles.inputField, { height: 100, textAlignVertical: 'top', fontSize: 11, fontFamily: 'monospace' }]}
                        value={raw26ASText}
                        onChangeText={setRaw26ASText}
                      />
                      <TouchableOpacity 
                        style={[styles.btnPrimary, { marginTop: 8, paddingVertical: 8 }]}
                        onPress={() => {
                          if (!raw26ASText.trim()) {
                            Alert.alert('Error', 'Please paste some text from Form 26AS first.');
                            return;
                          }
                          parse26ASText(raw26ASText);
                          setRaw26ASText('');
                          setShow26ASUpload(false);
                        }}
                      >
                        <Text style={styles.btnPrimaryText}>Parse & Import TDS</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Manual Entry Form */}
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#1e293b', marginTop: 5, marginBottom: 10 }}>
                    Add Tax Deposit Record (Manual)
                  </Text>

                  <Text style={styles.label}>Deposit Type</Text>
                  <View style={[styles.tabsRow, { marginBottom: 10 }]}>
                    {[
                      { id: 'SelfAssessment', label: 'Self-Ass.' },
                      { id: 'AdvanceTax', label: 'Advance' },
                      { id: 'TDS', label: 'TDS' }
                    ].map((t) => (
                      <TouchableOpacity
                        key={t.id}
                        style={[styles.tabBtn, depType === t.id && styles.tabBtnActive]}
                        onPress={() => setDepType(t.id as any)}
                      >
                        <Text style={[styles.tabBtnText, depType === t.id && styles.tabBtnTextActive]}>{t.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>Amount (₹)</Text>
                  <TextInput
                    style={styles.inputField}
                    keyboardType="numeric"
                    placeholder="₹ Amount"
                    value={depAmount}
                    onChangeText={setDepAmount}
                  />

                  <Text style={styles.label}>Deposit / Transaction Date (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="YYYY-MM-DD"
                    value={depDate}
                    onChangeText={setDepDate}
                  />

                  {depType === 'TDS' ? (
                    <View>
                      <Text style={styles.label}>Deductor Name</Text>
                      <TextInput
                        style={styles.inputField}
                        placeholder="e.g. Employer / Bank"
                        value={depDeductorName}
                        onChangeText={setDepDeductorName}
                      />

                      <Text style={styles.label}>Deductor TAN</Text>
                      <TextInput
                        style={styles.inputField}
                        placeholder="e.g. DELM12345C"
                        autoCapitalize="characters"
                        value={depDeductorTan}
                        onChangeText={setDepDeductorTan}
                      />
                    </View>
                  ) : (
                    <View>
                      <Text style={styles.label}>Bank Name</Text>
                      <TextInput
                        style={styles.inputField}
                        placeholder="e.g. BRB Bank"
                        value={depBank}
                        onChangeText={setDepBank}
                      />

                      <Text style={styles.label}>BSR Code</Text>
                      <TextInput
                        style={styles.inputField}
                        placeholder="e.g. 0180002"
                        keyboardType="numeric"
                        value={depBsr}
                        onChangeText={setDepBsr}
                      />

                      <Text style={styles.label}>Challan Number</Text>
                      <TextInput
                        style={styles.inputField}
                        placeholder="e.g. 00175"
                        keyboardType="numeric"
                        value={depChallanNo}
                        onChangeText={setDepChallanNo}
                      />
                    </View>
                  )}

                  <TouchableOpacity 
                    style={[styles.btnPrimary, { marginTop: 10, marginBottom: 20, paddingVertical: 10 }]}
                    onPress={handleAddDeposit}
                  >
                    <Text style={styles.btnPrimaryText}>Add Record to Ledger</Text>
                  </TouchableOpacity>

                  {/* Ledger cards */}
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 }}>
                    Deposited Tax Ledger ({taxDeposits.length} Records)
                  </Text>

                  {taxDeposits.length === 0 ? (
                    <View style={{ padding: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, alignItems: 'center', marginBottom: 20 }}>
                      <Text style={{ fontSize: 12, color: '#64748b' }}>No tax deposits added yet.</Text>
                    </View>
                  ) : (
                    <View style={{ marginBottom: 20 }}>
                      {taxDeposits.map((dep) => (
                        <View key={dep.id} style={{ backgroundColor: '#ffffff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 8 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ fontSize: 11, fontWeight: 'bold', color: dep.type === 'TDS' ? '#d97706' : dep.type === 'AdvanceTax' ? '#7c3aed' : '#059669', backgroundColor: dep.type === 'TDS' ? '#fef3c7' : dep.type === 'AdvanceTax' ? '#f3e8ff' : '#ecfdf5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                              {dep.type === 'SelfAssessment' ? 'Self-Assessment' : dep.type === 'AdvanceTax' ? 'Advance Tax' : 'TDS'}
                            </Text>
                            <TouchableOpacity onPress={() => handleDeleteDeposit(dep.id)}>
                              <Text style={{ fontSize: 12, color: '#ef4444', fontWeight: 'bold' }}>Delete</Text>
                            </TouchableOpacity>
                          </View>
                          
                          <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginTop: 8 }}>
                            ₹{dep.amount.toLocaleString('en-IN')}
                          </Text>

                          <View style={{ marginTop: 6, borderTopWidth: 1, borderColor: '#f1f5f9', paddingTop: 6 }}>
                            {dep.type === 'TDS' ? (
                              <View>
                                <Text style={{ fontSize: 11, color: '#475569' }}><Text style={{ fontWeight: 'bold' }}>Deductor:</Text> {dep.deductorName || 'Deductor'}</Text>
                                <Text style={{ fontSize: 11, color: '#475569', fontFamily: 'monospace' }}><Text style={{ fontWeight: 'bold' }}>TAN:</Text> {dep.deductorTAN}</Text>
                              </View>
                            ) : (
                              <View>
                                <Text style={{ fontSize: 11, color: '#475569' }}><Text style={{ fontWeight: 'bold' }}>Bank:</Text> {dep.bankName || 'BRB Bank'}</Text>
                                <Text style={{ fontSize: 11, color: '#475569' }}><Text style={{ fontWeight: 'bold' }}>BSR Code:</Text> {dep.bsrCode || 'N/A'}</Text>
                                <Text style={{ fontSize: 11, color: '#475569' }}><Text style={{ fontWeight: 'bold' }}>Challan No:</Text> {dep.challanNo || 'N/A'}</Text>
                              </View>
                            )}
                            <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}><Text style={{ fontWeight: 'bold' }}>Date:</Text> {dep.date || 'N/A'}</Text>
                          </View>
                        </View>
                      ))}

                      <View style={{ backgroundColor: '#f1f5f9', padding: 10, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#475569' }}>Total Tax Deposited:</Text>
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1e3a8a' }}>
                          ₹{taxDeposits.reduce((sum, d) => sum + d.amount, 0).toLocaleString('en-IN')}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}

            </View>

            {/* REAL-TIME PREVIEW CARD */}
            {simulation && (
              <View style={styles.previewCard}>
                <Text style={styles.previewHeader}>Real-Time Slab Simulation</Text>
                
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Old Regime Tax:</Text>
                  <Text style={styles.previewVal}>₹{simulation.oldRegime.totalTaxLiability.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>New Regime Tax:</Text>
                  <Text style={styles.previewVal}>₹{simulation.newRegime.totalTaxLiability.toLocaleString('en-IN')}</Text>
                </View>

                <View style={styles.previewRecommend}>
                  <Text style={styles.previewRecommendText}>
                    Optimal Regime Choice: <Text style={styles.previewRecommendBold}>{simulation.recommendedRegime === 'New' ? 'NEW u/s 115BAC' : 'OLD REGIME'}</Text>
                  </Text>
                  <Text style={styles.previewSavings}>Net Saved: ₹{simulation.taxSaved.toLocaleString('en-IN')}</Text>
                </View>
              </View>
            )}

            {/* Steps Actions */}
            <View style={styles.wizardActions}>
              {wizardStep > 1 ? (
                <TouchableOpacity 
                  style={styles.btnSecondary}
                  onPress={() => setWizardStep(wizardStep - 1)}
                >
                  <Text style={styles.btnSecondaryText}>Previous</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ flex: 1 }} />
              )}

              {wizardStep < 7 ? (
                <TouchableOpacity 
                  style={styles.btnPrimaryFlex}
                  onPress={() => setWizardStep(wizardStep + 1)}
                >
                  <Text style={styles.btnPrimaryFlexText}>Next Step &rarr;</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={styles.btnPrimaryFlexSave}
                  onPress={handleSaveWizard}
                  disabled={wizardSaving}
                >
                  {wizardSaving ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.btnPrimaryFlexText}>Save computation</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      )}

      {/* -------------------- 4. COMPARISON VIEWER SCREEN -------------------- */}
      {screen === 'comparison' && activeComparisonDetail && (
        <View style={styles.flex1}>
          {/* Header */}
          <View style={styles.navBar}>
            <TouchableOpacity onPress={() => setScreen('dashboard')}>
              <Text style={styles.navBack}>&larr; Back</Text>
            </TouchableOpacity>
            <Text style={styles.navTitle}>Tax Comparison Sheet</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.scroll}>
            
            {/* Recommendation Alert Box */}
            <View style={styles.comparisonRecBox}>
              <Text style={styles.compRecTitle}>CA Recommends:</Text>
              <Text style={styles.compRecRegime}>
                {activeComparisonDetail.recommendedRegime === 'New' ? 'NEW TAX REGIME (u/s 115BAC)' : 'OLD TAX REGIME'}
              </Text>
              <Text style={styles.compRecSavings}>
                Tax Savings amount: ₹{activeComparisonDetail.taxSaved.toLocaleString('en-IN')}
              </Text>
            </View>

            {/* PDF and JSON Export Row inside Comparison View */}
            <View style={[styles.compActions, { marginBottom: 16 }]}>
              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe', height: 38 }]}
                onPress={() => handleDownloadPDF(activeComparisonDetail.id, 'old')}
              >
                <Text style={[styles.actionBtnText, { color: '#1d4ed8' }]}>📄 PDF (Old)</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe', height: 38 }]}
                onPress={() => handleDownloadPDF(activeComparisonDetail.id, 'new')}
              >
                <Text style={[styles.actionBtnText, { color: '#1d4ed8' }]}>📄 PDF (New)</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', height: 38 }]}
                onPress={() => handleOpenJsonModal(activeComparisonDetail)}
              >
                <Text style={[styles.actionBtnText, { color: '#15803d' }]}>💾 ITR JSON</Text>
              </TouchableOpacity>
            </View>

            {/* Reconciliation table */}
            <View style={styles.tableCard}>
              <View style={styles.tableHeaderRow}>
                <Text style={styles.thLeft}>Particulars</Text>
                <Text style={styles.th}>Old Regime</Text>
                <Text style={styles.th}>New Regime</Text>
              </View>

              {/* Rows */}
              {[
                { label: 'Gross Salary', old: activeComparisonDetail.outputs.oldRegime.grossSalary, new: activeComparisonDetail.outputs.newRegime.grossSalary },
                { label: 'Standard Deduction', old: activeComparisonDetail.outputs.oldRegime.standardDeductionApplied, new: activeComparisonDetail.outputs.newRegime.standardDeductionApplied },
                { label: 'House Property Income', old: activeComparisonDetail.outputs.oldRegime.grossHouseProperty, new: activeComparisonDetail.outputs.newRegime.grossHouseProperty },
                { label: 'Profits & Gains of Business', old: activeComparisonDetail.outputs.oldRegime.grossBusiness, new: activeComparisonDetail.outputs.newRegime.grossBusiness },
                { label: 'Profits & Gains of Profession', old: activeComparisonDetail.outputs.oldRegime.grossProfessional || 0, new: activeComparisonDetail.outputs.newRegime.grossProfessional || 0 },
                { label: 'Capital Gains', old: activeComparisonDetail.outputs.oldRegime.grossCapitalGains, new: activeComparisonDetail.outputs.newRegime.grossCapitalGains },
                { label: 'Other Sources', old: activeComparisonDetail.outputs.oldRegime.grossOtherSources, new: activeComparisonDetail.outputs.newRegime.grossOtherSources },
                { label: 'Gross Total Income', old: activeComparisonDetail.outputs.oldRegime.totalGrossIncome, new: activeComparisonDetail.outputs.newRegime.totalGrossIncome, bold: true },
                { label: 'Exemptions & Deductions', old: activeComparisonDetail.outputs.oldRegime.deductionsApplied, new: activeComparisonDetail.outputs.newRegime.deductionsApplied },
                { label: 'Net Taxable Income', old: activeComparisonDetail.outputs.oldRegime.netTaxableIncome, new: activeComparisonDetail.outputs.newRegime.netTaxableIncome, bold: true },
                { label: 'Gross Slab Tax', old: activeComparisonDetail.outputs.oldRegime.taxBeforeRebate, new: activeComparisonDetail.outputs.newRegime.taxBeforeRebate },
                { label: 'Rebate u/s 87A', old: activeComparisonDetail.outputs.oldRegime.rebate87A, new: activeComparisonDetail.outputs.newRegime.rebate87A },
                { label: 'Surcharge & Cess', old: activeComparisonDetail.outputs.oldRegime.cess + activeComparisonDetail.outputs.oldRegime.surcharge, new: activeComparisonDetail.outputs.newRegime.cess + activeComparisonDetail.outputs.newRegime.surcharge },
                { label: 'Net Tax Liability', old: activeComparisonDetail.outputs.oldRegime.totalTaxLiability, new: activeComparisonDetail.outputs.newRegime.totalTaxLiability, bold: true },
                { label: 'Less: Total Taxes Paid', old: activeComparisonDetail.outputs.oldRegime.totalTaxesPaid || 0, new: activeComparisonDetail.outputs.newRegime.totalTaxesPaid || 0 },
                { label: 'Net Payable / (Refund)', old: activeComparisonDetail.outputs.oldRegime.netTaxPayableOrRefund || 0, new: activeComparisonDetail.outputs.newRegime.netTaxPayableOrRefund || 0, total: true }
              ].map((row, idx) => (
                <View 
                  key={idx} 
                  style={[
                    styles.tableRow, 
                    row.bold && styles.tableRowBold,
                    row.total && styles.tableRowTotal
                  ]}
                >
                  <Text style={[styles.tdLeft, row.bold && styles.textBold, row.total && styles.textWhite]}>{row.label}</Text>
                  <Text style={[styles.td, row.bold && styles.textBold, row.total && styles.textWhite]}>
                    {row.old < 0 ? `-₹${Math.abs(row.old).toLocaleString('en-IN')}` : `₹${row.old.toLocaleString('en-IN')}`}
                  </Text>
                  <Text style={[styles.td, row.bold && styles.textBold, row.total && styles.textWhite]}>
                    {row.new < 0 ? `-₹${Math.abs(row.new).toLocaleString('en-IN')}` : `₹${row.new.toLocaleString('en-IN')}`}
                  </Text>
                </View>
              ))}
            </View>

            {/* Extra filing details */}
            <Text style={styles.secTitle}>Taxpayer biological details</Text>
            <View style={styles.detailBox}>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>Assessee Name:</Text><Text style={styles.detailValText}>{activeComparisonDetail.inputs.fullName}</Text></View>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>Assessment Year:</Text><Text style={styles.detailValText}>{activeComparisonDetail.assessmentYear}</Text></View>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>Age / Date of Birth:</Text><Text style={styles.detailValText}>{activeComparisonDetail.inputs.dateOfBirth}</Text></View>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>Residential Status:</Text><Text style={styles.detailValText}>{activeComparisonDetail.inputs.residentialStatus}</Text></View>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      )}

      {/* -------------------- 5. ADMIN CONTROL PANEL SCREEN -------------------- */}
      {screen === 'admin' && (
        <View style={styles.flex1}>
          {/* Header */}
          <View style={styles.navBar}>
            <View style={styles.navTitleRow}>
              <Text style={styles.navLogoAdmin}>🛡️</Text>
              <Text style={styles.navTitle}>Admin Panel</Text>
            </View>
            <TouchableOpacity onPress={() => { setToken(null); setScreen('login'); }}>
              <Text style={styles.navLogout}>Logout</Text>
            </TouchableOpacity>
          </View>

          {/* Sub-Tab Selector */}
          <View style={styles.adminTabSelector}>
            {[
              { id: 'stats', label: 'Stats' },
              { id: 'users', label: 'Users' },
              { id: 'slabs', label: 'Slabs' },
              { id: 'cms', label: 'CMS' }
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.adminTabBtn, adminTab === tab.id && styles.adminTabBtnActive]}
                onPress={() => setAdminTab(tab.id as any)}
              >
                <Text style={[styles.adminTabBtnText, adminTab === tab.id && styles.adminTabBtnTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {adminLoading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color="#1e3a8a" />
              <Text style={styles.loadingText}>Loading Admin data...</Text>
            </View>
          ) : (
            <ScrollView style={styles.scroll}>

              {/* STATS VIEW */}
              {adminTab === 'stats' && adminAnalytics && (
                <View>
                  <View style={styles.adminStatsGrid}>
                    <View style={styles.adminStatCard}>
                      <Text style={styles.adminStatLabel}>Registered Users</Text>
                      <Text style={styles.adminStatVal}>{adminAnalytics.totalUsers}</Text>
                    </View>
                    <View style={styles.adminStatCard}>
                      <Text style={styles.adminStatLabel}>Calculations Run</Text>
                      <Text style={styles.adminStatVal}>{adminAnalytics.totalComputations}</Text>
                    </View>
                    <View style={styles.adminStatCard}>
                      <Text style={styles.adminStatLabel}>Profiles Setup</Text>
                      <Text style={styles.adminStatVal}>{adminAnalytics.activeProfiles}</Text>
                    </View>
                    <View style={styles.adminStatCard}>
                      <Text style={styles.adminStatLabel}>Total Tax Saved</Text>
                      <Text style={[styles.adminStatVal, { color: '#059669' }]}>
                        ₹{adminAnalytics.totalTaxSaved.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.secTitle, { marginTop: 20 }]}>Computations by Year</Text>
                  <View style={styles.card}>
                    {adminAnalytics.ayStats.length === 0 ? (
                      <Text style={styles.infoText}>No computations recorded yet.</Text>
                    ) : (
                      adminAnalytics.ayStats.map((item: any, idx: number) => (
                        <View key={idx} style={styles.ayRow}>
                          <Text style={styles.ayYearText}>Assessment Year {item.year}</Text>
                          <View style={styles.ayBadge}>
                            <Text style={styles.ayBadgeText}>{item.count} Runs</Text>
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                </View>
              )}

              {/* USER DIRECTORY VIEW */}
              {adminTab === 'users' && (
                <View>
                  <Text style={styles.secTitle}>User directory ({adminUsersList.length})</Text>
                  {adminUsersList.length === 0 ? (
                    <View style={styles.emptyList}>
                      <Text style={styles.emptyText}>No users registered yet.</Text>
                    </View>
                  ) : (
                    adminUsersList.map((item) => (
                      <View key={item.id} style={styles.userCard}>
                        <View style={styles.userHeader}>
                          <Text style={styles.userName}>{item.fullName || 'Unnamed Filer'}</Text>
                          <View style={[styles.roleBadge, item.role === 'ADMIN' && { backgroundColor: '#fee2e2' }]}>
                            <Text style={[styles.roleBadgeText, item.role === 'ADMIN' && { color: '#991b1b' }]}>
                              {item.role}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.userDetails}>📧 {item.email}</Text>
                        {item.phone ? <Text style={styles.userDetails}>📞 {item.phone}</Text> : null}
                        
                        <View style={styles.userFooter}>
                          <Text style={styles.statusLabel}>
                            Status: <Text style={item.isSuspended ? { color: '#dc2626', fontWeight: 'bold' } : { color: '#059669', fontWeight: 'bold' }}>
                              {item.isSuspended ? 'Suspended' : 'Active'}
                            </Text>
                          </Text>
                          
                          {item.role !== 'ADMIN' && (
                            <TouchableOpacity
                              style={[styles.suspendBtn, item.isSuspended ? styles.suspendBtnActive : null]}
                              onPress={() => handleToggleSuspend(item.id, item.isSuspended)}
                            >
                              <Text style={[styles.suspendBtnText, item.isSuspended ? styles.suspendBtnTextActive : null]}>
                                {item.isSuspended ? '🟢 Unsuspend' : '🔴 Suspend'}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}

              {/* TAX SLABS EDITOR VIEW */}
              {adminTab === 'slabs' && (
                <View style={styles.card}>
                  <Text style={styles.stepTitle}>Global Tax Slab Configuration</Text>
                  
                  <Text style={styles.label}>Assessment Year</Text>
                  <View style={styles.tabsRow}>
                    {['2025-26', '2026-27'].map((y) => (
                      <TouchableOpacity
                        key={y}
                        style={[styles.tabBtn, slabAY === y && styles.tabBtnActive]}
                        onPress={() => setSlabAY(y)}
                      >
                        <Text style={[styles.tabBtnText, slabAY === y && styles.tabBtnTextActive]}>AY {y}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>Tax Regime</Text>
                  <View style={styles.tabsRow}>
                    {['New', 'Old'].map((r) => (
                      <TouchableOpacity
                        key={r}
                        style={[styles.tabBtn, slabRegime === r && styles.tabBtnActive]}
                        onPress={() => setSlabRegime(r)}
                      >
                        <Text style={[styles.tabBtnText, slabRegime === r && styles.tabBtnTextActive]}>{r} Regime</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>JSON Parameters Override</Text>
                  <TextInput
                    style={[styles.inputField, { height: 100, textAlignVertical: 'top', paddingVertical: 8 }]}
                    multiline
                    numberOfLines={5}
                    value={slabConfig}
                    onChangeText={setSlabConfig}
                  />

                  <TouchableOpacity 
                    style={[styles.btnPrimary, { backgroundColor: '#0284c7' }]}
                    onPress={handleSaveSlabs}
                    disabled={adminSaving}
                  >
                    {adminSaving ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <Text style={styles.btnPrimaryText}>💾 Update Slab Rules</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* CMS BLOGS & FAQS VIEW */}
              {adminTab === 'cms' && (
                <View>
                  {/* FAQ creation card */}
                  <View style={styles.card}>
                    <Text style={styles.stepTitle}>Publish New FAQ Article</Text>

                    <Text style={styles.label}>FAQ Category</Text>
                    <TextInput
                      style={styles.inputField}
                      placeholder="e.g. General, Deductions, Business"
                      placeholderTextColor="#94a3b8"
                      value={faqCategory}
                      onChangeText={setFaqCategory}
                    />

                    <Text style={styles.label}>Question Text</Text>
                    <TextInput
                      style={styles.inputField}
                      placeholder="Enter question..."
                      placeholderTextColor="#94a3b8"
                      value={faqQuestion}
                      onChangeText={setFaqQuestion}
                    />

                    <Text style={styles.label}>Answer Description</Text>
                    <TextInput
                      style={[styles.inputField, { height: 70, textAlignVertical: 'top', paddingVertical: 8 }]}
                      multiline
                      numberOfLines={3}
                      placeholder="Enter answers details..."
                      placeholderTextColor="#94a3b8"
                      value={faqAnswer}
                      onChangeText={setFaqAnswer}
                    />

                    <TouchableOpacity 
                      style={styles.btnPrimary}
                      onPress={handleAddFAQ}
                      disabled={adminSaving}
                    >
                      {adminSaving ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <Text style={styles.btnPrimaryText}>✨ Publish FAQ</Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Blog creation card */}
                  <View style={styles.card}>
                    <Text style={styles.stepTitle}>Publish Blog Article</Text>

                    <Text style={styles.label}>Post Title</Text>
                    <TextInput
                      style={styles.inputField}
                      placeholder="e.g. Budget 2026 Slab Changes"
                      placeholderTextColor="#94a3b8"
                      value={blogTitle}
                      onChangeText={setBlogTitle}
                    />

                    <Text style={styles.label}>Post Slug (URL Key)</Text>
                    <TextInput
                      style={styles.inputField}
                      placeholder="e.g. budget-2026-slab-changes"
                      placeholderTextColor="#94a3b8"
                      value={blogSlug}
                      onChangeText={setBlogSlug}
                    />

                    <Text style={styles.label}>Article Markdown / HTML Content</Text>
                    <TextInput
                      style={[styles.inputField, { height: 120, textAlignVertical: 'top', paddingVertical: 8 }]}
                      multiline
                      numberOfLines={6}
                      placeholder="Write blog content..."
                      placeholderTextColor="#94a3b8"
                      value={blogContent}
                      onChangeText={setBlogContent}
                    />

                    <TouchableOpacity 
                      style={[styles.btnPrimary, { backgroundColor: '#10b981' }]}
                      onPress={handleAddBlog}
                      disabled={adminSaving}
                    >
                      {adminSaving ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <Text style={styles.btnPrimaryText}>🚀 Publish Blog Post</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </View>
      )}

      {/* JSON regime selection modal */}
      {showJsonModal && jsonComp && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Export ITR-4 Upload JSON</Text>
            <Text style={styles.modalDesc}>Select which regime format to generate for your ITR filing submission.</Text>
            
            <View style={styles.modalTabs}>
              <TouchableOpacity 
                style={[styles.modalTab, jsonRegime === 'new' && styles.modalTabActive]}
                onPress={() => setJsonRegime('new')}
              >
                <Text style={[styles.modalTabText, jsonRegime === 'new' && styles.modalTabTextActive]}>New Regime (u/s 115BAC)</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalTab, jsonRegime === 'old' && styles.modalTabActive]}
                onPress={() => setJsonRegime('old')}
              >
                <Text style={[styles.modalTabText, jsonRegime === 'old' && styles.modalTabTextActive]}>Old Regime Format</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalBtnCancel}
                onPress={() => setShowJsonModal(false)}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalBtnSubmit}
                onPress={handleShareJson}
              >
                <Text style={styles.modalBtnSubmitText}>Share / Save JSON</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Detail loader overlay */}
      {detailLoading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loaderOverlayText}>Fetching CA ledgers...</Text>
        </View>
      )}

      {/* Code Search Modal */}
      <Modal
        visible={mobileSearchModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setMobileSearchModalVisible(false);
          setMobileSearchQuery('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '80%', maxWidth: 360 }]}>
            <Text style={styles.modalTitle}>
              Search {mobileSearchTarget === 'business' ? 'Business' : 'Profession'} Codes
            </Text>
            <Text style={styles.modalDesc}>
              Select the appropriate CBDT classification code for your presumptive declaration.
            </Text>
            
            <TextInput
              style={styles.inputField}
              placeholder="Search by code or description..."
              placeholderTextColor="#94a3b8"
              value={mobileSearchQuery}
              onChangeText={setMobileSearchQuery}
              autoFocus
            />

            <ScrollView style={{ marginVertical: 12, flex: 1 }}>
              {(() => {
                const filtered = taxBusinessCodes
                  .filter(b => {
                    if (mobileSearchTarget === 'professional') {
                      return b.code.startsWith('16');
                    }
                    return true;
                  })
                  .filter(b => {
                    const query = mobileSearchQuery.toLowerCase().trim();
                    if (!query) return true;
                    return b.code.includes(query) || b.nature.toLowerCase().includes(query) || b.category.toLowerCase().includes(query);
                  });

                if (filtered.length === 0) {
                  return (
                    <Text style={{ textAlign: 'center', color: '#64748b', marginVertical: 20, fontSize: 13 }}>
                      No matching codes found.
                    </Text>
                  );
                }

                // Group by category
                const groups = filtered.reduce((acc, item) => {
                  const cat = item.category;
                  if (!acc[cat]) acc[cat] = [];
                  acc[cat].push(item);
                  return acc;
                }, {} as Record<string, typeof taxBusinessCodes>);

                return Object.entries(groups).map(([cat, codes]) => (
                  <View key={cat} style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#2563eb', textTransform: 'uppercase', marginBottom: 4, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 2 }}>
                      {cat}
                    </Text>
                    {codes.map(b => (
                      <TouchableOpacity
                        key={b.code}
                        style={{ paddingVertical: 8, paddingHorizontal: 4, flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#f1f5f9' }}
                        onPress={() => {
                          if (mobileSearchTarget === 'business') {
                            setBizCode(b.code);
                            setBizNature(b.nature);
                          } else {
                            setProfCode(b.code);
                            setProfNature(b.nature);
                          }
                          setMobileSearchModalVisible(false);
                          setMobileSearchQuery('');
                        }}
                      >
                        <Text style={{ width: 50, fontWeight: 'bold', color: '#1e3a8a', fontFamily: 'monospace' }}>{b.code}</Text>
                        <Text style={{ flex: 1, fontSize: 12, color: '#334155' }}>{b.nature}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ));
              })()}
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalBtnCancel, { width: '100%', marginTop: 8 }]}
              onPress={() => {
                setMobileSearchModalVisible(false);
                setMobileSearchQuery('');
              }}
            >
              <Text style={styles.modalBtnCancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  flex1: {
    flex: 1,
  },
  centerScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f1f5f9',
  },
  w100: {
    width: '100%',
  },
  scroll: {
    flex: 1,
    padding: 16,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748b',
    fontWeight: 'bold',
  },

  // Login
  loginCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#64748b',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  logoCircle: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#1e3a8a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoSymbol: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  appDesc: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 20,
  },
  errorAlert: {
    width: '100%',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  errorAlertText: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  segmentToggle: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 3,
    marginBottom: 16,
    width: '100%',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: 'bold',
  },
  segmentTextActive: {
    color: '#1e3a8a',
  },
  input: {
    width: '100%',
    height: 46,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 12,
  },
  btnPrimary: {
    width: '100%',
    height: 46,
    backgroundColor: '#1e3a8a',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  btnPrimaryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  otpRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    width: '100%',
  },
  otpPhoneInput: {
    flex: 1,
    marginBottom: 0,
  },
  otpSendBtn: {
    backgroundColor: '#e2e8f0',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 16,
    height: 46,
  },
  otpSendText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: 'bold',
  },
  secureBadge: {
    marginTop: 20,
  },
  secureText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },

  // Navbar
  navBar: {
    height: 58,
    backgroundColor: '#1e3a8a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  navTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navLogo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: '#0284c7',
    width: 26,
    height: 26,
    borderRadius: 6,
    textAlign: 'center',
    lineHeight: 26,
  },
  navTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  navLogout: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fca5a5',
  },
  navBack: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
  },

  // Profile Card
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 16,
  },
  profileName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 12,
  },
  profileFields: {
    flexDirection: 'row',
    gap: 16,
  },
  profileField: {
    flex: 1,
  },
  profileLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    paddingHorizontal: 8,
    height: 34,
  },
  profileValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    fontFamily: 'monospace',
  },
  eyeBtn: {
    padding: 2,
  },
  eyeIcon: {
    fontSize: 12,
  },

  // Banner
  gradientBanner: {
    backgroundColor: '#1e3a8a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  bannerDesc: {
    fontSize: 11,
    color: '#93c5fd',
    marginTop: 4,
    lineHeight: 16,
  },
  bannerBtn: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },
  bannerBtnText: {
    color: '#1e3a8a',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Computations list
  secTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  emptyList: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  compCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 12,
  },
  compHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8,
    marginBottom: 10,
  },
  compYear: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeNew: {
    backgroundColor: '#d1fae5',
  },
  badgeOld: {
    backgroundColor: '#fef3c7',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  badgeTextNew: {
    color: '#065f46',
  },
  badgeTextOld: {
    color: '#92400e',
  },
  compMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 10,
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  metricVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  metricValSaved: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669',
  },
  compActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 2,
    height: 34,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: 'bold',
  },
  actionBtnEdit: {
    flex: 1,
    height: 34,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnTextEdit: {
    fontSize: 11,
    color: '#2563eb',
    fontWeight: 'bold',
  },
  actionBtnDel: {
    flex: 1,
    height: 34,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnTextDel: {
    fontSize: 11,
    color: '#dc2626',
    fontWeight: 'bold',
  },

  // Wizard
  stepsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: '#1e3a8a',
    borderColor: '#1e3a8a',
  },
  stepDotCompleted: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  stepDotText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: 'bold',
  },
  stepDotTextActive: {
    color: '#ffffff',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  labelHeader: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0284c7',
    marginBottom: 8,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    height: 38,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  tabBtnActive: {
    backgroundColor: '#1e3a8a',
    borderColor: '#1e3a8a',
  },
  tabBtnText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: 'bold',
  },
  tabBtnTextActive: {
    color: '#ffffff',
  },
  inputField: {
    height: 44,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    marginBottom: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 14,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  infoText: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
  },

  // Preview card
  previewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 16,
  },
  previewHeader: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8,
    marginBottom: 10,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  previewLabel: {
    fontSize: 12,
    color: '#475569',
  },
  previewVal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  previewRecommend: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  previewRecommendText: {
    fontSize: 11,
    color: '#1e40af',
  },
  previewRecommendBold: {
    fontWeight: 'bold',
  },
  previewSavings: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#059669',
    marginTop: 4,
  },

  // Wizard actions
  wizardActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  btnSecondary: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  btnSecondaryText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: 'bold',
  },
  btnPrimaryFlex: {
    flex: 1.5,
    height: 44,
    backgroundColor: '#1e3a8a',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPrimaryFlexSave: {
    flex: 1.5,
    height: 44,
    backgroundColor: '#10b981',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPrimaryFlexText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },

  // Comparison Detail screen
  comparisonRecBox: {
    backgroundColor: '#e6fffa',
    borderWidth: 1,
    borderColor: '#b2f5ea',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  compRecTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#319795',
    textTransform: 'uppercase',
  },
  compRecRegime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#234e52',
    marginTop: 2,
    textAlign: 'center',
  },
  compRecSavings: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#059669',
    marginTop: 4,
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    marginBottom: 16,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#1e3a8a',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  thLeft: {
    flex: 1.5,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  th: {
    flex: 1,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'right',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 9,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  tableRowBold: {
    backgroundColor: '#f8fafc',
  },
  tableRowTotal: {
    backgroundColor: '#1e3a8a',
    borderBottomWidth: 0,
  },
  tdLeft: {
    flex: 1.5,
    fontSize: 11,
    color: '#475569',
  },
  td: {
    flex: 1,
    fontSize: 11,
    color: '#0f172a',
    textAlign: 'right',
    fontFamily: 'monospace',
  },
  textBold: {
    fontWeight: 'bold',
    color: '#0f172a',
  },
  textWhite: {
    fontWeight: 'bold',
    color: '#ffffff',
  },
  detailBox: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  detailValText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#334155',
  },

  // Loader Overlay
  loaderOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
  },
  loaderOverlayText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 10,
  },
  
  // Google login
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#cbd5e1',
  },
  orText: {
    marginHorizontal: 12,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
  },
  btnGoogle: {
    width: '100%',
    height: 46,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnGoogleText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Modal styles
  modalOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 6,
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 16,
  },
  modalTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  modalTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  modalTabActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  modalTabText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalTabTextActive: {
    color: '#2563eb',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalBtnCancel: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBtnCancelText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalBtnSubmit: {
    flex: 1.5,
    height: 40,
    backgroundColor: '#059669',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBtnSubmitText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Admin styles
  navLogoAdmin: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
  },
  adminTabSelector: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 4,
  },
  adminTabBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  adminTabBtnActive: {
    backgroundColor: '#1e3a8a',
  },
  adminTabBtnText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: 'bold',
  },
  adminTabBtnTextActive: {
    color: '#ffffff',
  },
  adminStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  adminStatCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  adminStatLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  adminStatVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1e293b',
  },
  ayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f1f5f9',
  },
  ayYearText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
  },
  ayBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ayBadgeText: {
    fontSize: 10,
    color: '#2563eb',
    fontWeight: 'bold',
  },
  userCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  userName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  roleBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#64748b',
  },
  userDetails: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 2,
  },
  userFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  statusLabel: {
    fontSize: 11,
    color: '#475569',
  },
  suspendBtn: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  suspendBtnActive: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  suspendBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  suspendBtnTextActive: {
    color: '#16a34a',
  },
  inlineHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  searchLink: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  warningBox: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  warningTitle: {
    color: '#b45309',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  warningText: {
    color: '#d97706',
    fontSize: 11,
    lineHeight: 15,
  },
  calcPreviewBox: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcPreviewTitle: {
    color: '#1e3a8a',
    fontSize: 12,
    fontWeight: 'bold',
  },
  calcPreviewVal: {
    color: '#1d4ed8',
    fontSize: 14,
    fontWeight: 'bold',
  }
});
