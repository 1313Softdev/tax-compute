const assert = require('assert');

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- STARTING END-TO-END API INTEGRATION TESTING ---');
  
  // 1. REGISTER NEW USER
  const email = `user_${Date.now()}@example.com`;
  const password = 'UserPassword123';
  console.log(`\n[STEP 1] Registering a new user: ${email}...`);
  
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const regData = await regRes.json();
  assert.strictEqual(regRes.status, 201, `Registration failed: ${JSON.stringify(regData)}`);
  console.log('✔ Registration successful.');
  let userToken = regData.token;
  const userId = regData.user.id;

  // 2. LOGIN USER
  console.log('\n[STEP 2] Logging in user...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const loginData = await loginRes.json();
  assert.strictEqual(loginRes.status, 200, `Login failed: ${JSON.stringify(loginData)}`);
  console.log('✔ Login successful.');
  userToken = loginData.token;

  // 3. GET PROFILE (SHOULD BE EMPTY OR DEFAULT)
  console.log('\n[STEP 3] Fetching user profile...');
  const getProfileRes = await fetch(`${BASE_URL}/profile`, {
    headers: { 'Authorization': `Bearer ${userToken}` }
  });
  const profileData = await getProfileRes.json();
  assert.strictEqual(getProfileRes.status, 200, 'Failed to fetch profile');
  console.log(`✔ Fetch Profile successful. completed=${profileData?.completed}`);

  // 4. UPDATE PROFILE
  console.log('\n[STEP 4] Updating user profile details...');
  const profilePayload = {
    fullName: 'Jane Doe',
    fatherName: 'John Doe Sr.',
    dateOfBirth: '1992-08-24',
    gender: 'Female',
    panNumber: 'ABCDE1234F',
    aadhaarNumber: '999999999999',
    phone: '9876543210',
    address: 'Flat 402, Skyline Towers',
    city: 'Mumbai',
    state: 'Maharashtra',
    pinCode: '400001',
    bankName: 'ICICI Bank',
    accountNumber: '000401502634',
    ifscCode: 'ICIC0000004',
    branchName: 'Nariman Point',
    employmentType: 'Salaried'
  };

  const updateRes = await fetch(`${BASE_URL}/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify(profilePayload)
  });
  const updateData = await updateRes.json();
  assert.strictEqual(updateRes.status, 200, `Profile update failed: ${JSON.stringify(updateData)}`);
  console.log('✔ Profile updated successfully. completed=true.');

  // 5. TEST AD-HOC CALCULATOR (PUBLIC ROUTE)
  console.log('\n[STEP 5] Testing ad-hoc calculation...');
  const computationInputs = {
    assessmentYear: '2025-26',
    fullName: 'Jane Doe',
    panNumber: 'ABCDE1234F',
    dateOfBirth: '1992-08-24',
    gender: 'Female',
    residentialStatus: 'Resident',
    salary: {
      basicSalary: 600000,
      hra: 180000,
      da: 40000,
      bonus: 20000,
      commission: 0,
      otherAllowances: 25000,
      perquisites: 0,
      professionalTax: 2500
    },
    houseProperty: {
      isSelfOccupied: true,
      rentalIncome: 0,
      municipalTaxes: 0,
      housingLoanInterest: 100000
    },
    business: {
      grossReceipts: 0,
      expenses: 0,
      depreciation: 0
    },
    capitalGains: {
      shortTermStcg: 0,
      longTermLtcg: 0,
      propertySaleGains: 0,
      shareMarketGains: 0
    },
    otherSources: {
      interestSavings: 8000,
      interestFD: 12000,
      dividends: 4000,
      pension: 0,
      familyPension: 0,
      lotteryIncome: 0
    },
    deductions: {
      sec80C: 150000,
      sec80CCD_1B: 50000,
      sec80D: 25000,
      sec80E: 0,
      sec80G: 0,
      sec80TTA: 10000,
      sec80TTB: 0,
      otherDeductions: 0
    },
    exemptions: {
      hraExemption: 45000,
      ltaExemption: 0,
      agriculturalIncome: 0,
      gratuity: 0,
      leaveEncashment: 0,
      vrsBenefits: 0,
      otherExemptions: 0
    }
  };

  const adhocRes = await fetch(`${BASE_URL}/tax/calculate-adhoc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(computationInputs)
  });
  const adhocData = await adhocRes.json();
  assert.strictEqual(adhocRes.status, 200, 'Adhoc calculation failed');
  console.log('✔ Ad-hoc calculation completed.');
  console.log(`   Old regime tax: ₹${adhocData.oldRegime.totalTaxLiability.toLocaleString('en-IN')}`);
  console.log(`   New regime tax: ₹${adhocData.newRegime.totalTaxLiability.toLocaleString('en-IN')}`);
  console.log(`   Recommended regime: ${adhocData.recommendedRegime} (Tax Saved: ₹${adhocData.taxSaved.toLocaleString('en-IN')})`);

  // 6. SAVE TAX COMPUTATION
  console.log('\n[STEP 6] Saving tax computation details...');
  const saveRes = await fetch(`${BASE_URL}/tax/computation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify(computationInputs)
  });
  const saveData = await saveRes.json();
  assert.strictEqual(saveRes.status, 201, `Failed to save computation: ${JSON.stringify(saveData)}`);
  console.log('✔ Tax computation saved successfully.');
  const compId = saveData.computation.id;

  // 6b. UPDATE SAVED COMPUTATION (PUT)
  console.log('\n[STEP 6b] Updating saved tax computation (PUT)...');
  const updatedInputs = { ...computationInputs, assessmentYear: '2026-27' };
  const updateCompRes = await fetch(`${BASE_URL}/tax/computation/${compId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify(updatedInputs)
  });
  const updateCompData = await updateCompRes.json();
  assert.strictEqual(updateCompRes.status, 200, `Failed to update computation: ${JSON.stringify(updateCompData)}`);
  assert.strictEqual(updateCompData.computation.assessmentYear, '2026-27', 'Assessment year was not updated successfully');
  console.log('✔ Tax computation updated successfully via PUT.');

  // 6c. TRY TO SAVE DUPLICATE FOR SAME YEAR (Should fail)
  console.log('\n[STEP 6c] Trying to save duplicate computation for same year (should fail)...');
  const duplicateRes = await fetch(`${BASE_URL}/tax/computation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify(updatedInputs)
  });
  const duplicateData = await duplicateRes.json();
  assert.strictEqual(duplicateRes.status, 400, `Duplicate computation should be rejected: ${JSON.stringify(duplicateData)}`);
  assert.ok(duplicateData.error && duplicateData.error.includes('already been generated'), `Error message should mention duplicates: ${duplicateData.error}`);
  console.log('✔ Duplicate computation generation blocked successfully.');

  // 7. GET SAVED COMPUTATION LIST
  console.log('\n[STEP 7] Fetching saved computations list...');
  const listRes = await fetch(`${BASE_URL}/tax/computation`, {
    headers: { 'Authorization': `Bearer ${userToken}` }
  });
  const listData = await listRes.json();
  assert.strictEqual(listRes.status, 200, 'Failed to fetch computations list');
  assert.ok(listData.length > 0, 'Computations list should not be empty');
  console.log(`✔ Found ${listData.length} saved computation(s).`);

  // 8. TEST PDF REPORT DOWNLOADS (Both, Old, New)
  console.log('\n[STEP 8] Downloading PDF reports (Comparative, Old, New)...');
  const pdfRes = await fetch(`${BASE_URL}/reports/${compId}/pdf`, {
    headers: { 'Authorization': `Bearer ${userToken}` }
  });
  assert.strictEqual(pdfRes.status, 200, 'PDF comparative export failed');
  assert.strictEqual(pdfRes.headers.get('content-type'), 'application/pdf', 'Invalid PDF content-type');

  const pdfOldRes = await fetch(`${BASE_URL}/reports/${compId}/pdf?regime=old`, {
    headers: { 'Authorization': `Bearer ${userToken}` }
  });
  assert.strictEqual(pdfOldRes.status, 200, 'PDF Old-only export failed');

  const pdfNewRes = await fetch(`${BASE_URL}/reports/${compId}/pdf?regime=new`, {
    headers: { 'Authorization': `Bearer ${userToken}` }
  });
  assert.strictEqual(pdfNewRes.status, 200, 'PDF New-only export failed');
  console.log('✔ PDF reports generated and downloaded successfully.');



  // 9. TEST AI ASSISTANT CHAT
  console.log('\n[STEP 9] Checking AI Assistant query response...');
  const aiRes = await fetch(`${BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      query: 'Can I claim HRA exemption under the New Regime?',
      computationId: compId
    })
  });
  const aiData = await aiRes.json();
  assert.strictEqual(aiRes.status, 200, `AI query failed: ${JSON.stringify(aiData)}`);
  console.log('✔ AI Assistant responded successfully.');
  console.log(`   Question: Can I claim HRA exemption under the New Regime?`);
  console.log(`   AI Answer: ${aiData.response.substring(0, 120)}...`);

  // 10. ADMIN AUDITS (LOG IN AS SYSTEM ADMIN)
  console.log('\n[STEP 10] Logging in as System Administrator...');
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@taxcompute.com', password: 'AdminPassword123' })
  });
  const adminLoginData = await adminLoginRes.json();
  assert.strictEqual(adminLoginRes.status, 200, `Admin Login failed: ${JSON.stringify(adminLoginData)}`);
  console.log('✔ Admin login successful.');
  const adminToken = adminLoginData.token;

  // 11. FETCH USER DIRECTORY
  console.log('\n[STEP 11] Admin: Fetching user directory...');
  const usersRes = await fetch(`${BASE_URL}/admin/users`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const usersData = await usersRes.json();
  assert.strictEqual(usersRes.status, 200, 'Admin failed to fetch user directory');
  assert.ok(usersData.length > 0, 'User directory should have entries');
  console.log(`✔ Admin user directory retrieved. Total registered users: ${usersData.length}`);

  // 12. FETCH SYSTEM ANALYTICS
  console.log('\n[STEP 12] Admin: Fetching system analytics...');
  const analyticsRes = await fetch(`${BASE_URL}/admin/analytics`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const analyticsData = await analyticsRes.json();
  assert.strictEqual(analyticsRes.status, 200, 'Admin failed to fetch analytics');
  console.log('✔ Admin analytics fetched.');
  console.log(`   System Counts - Users: ${analyticsData.totalUsers}, Saved Computations: ${analyticsData.totalComputations}, Active Profiles: ${analyticsData.activeProfiles}, Total Tax Saved: ${analyticsData.totalTaxSaved.toLocaleString('en-IN')}`);

  console.log('\n--- ALL E2E API INTEGRATION TESTS PASSED SUCCESSFULLY! ---');
}

runTests().catch(err => {
  console.error('\n✖ API INTEGRATION TEST FAILED:', err);
  process.exit(1);
});
