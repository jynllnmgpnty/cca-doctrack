const http = require('http');
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const { initDB, dbUsers, dbRequests } = require('./db');
const authRoutes = require('./routes/authRoutes');
const requestRoutes = require('./routes/requestRoutes');

async function testNewFixes() {
  console.log('Testing User Requirements Fixes...\n');

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/requests', requestRoutes);

  await initDB();

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(3901, resolve));
  const baseUrl = 'http://localhost:3901';

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    // 1. Requirement: New registered user has NO requests
    console.log('--- Test 1: New Student Requests Isolation ---');
    const newStudentId = '24-99999';
    const newStudentEmail = 'brandnewstudent@cca.edu.ph';
    const reqsRes = await fetch(`${baseUrl}/api/requests?studentId=${newStudentId}&email=${newStudentEmail}`);
    assert(reqsRes.status === 200, 'GET /api/requests with new studentId returns 200');
    const reqsJson = await reqsRes.json();
    assert(reqsJson.count === 0, 'New student has exactly 0 requests (count: 0)');
    assert(Array.isArray(reqsJson.data) && reqsJson.data.length === 0, 'New student requests array is empty');

    // 2. Requirement: Profile name update persists to database/Supabase
    console.log('\n--- Test 2: Profile Update Persists to Supabase ---');
    const testEmail = 'profile_test_' + Date.now() + '@cca.edu.ph';
    const testStudentId = '24-' + Math.floor(10000 + Math.random() * 90000);
    const origName = 'Original Student Name';
    const updatedName = 'Updated Student Name ' + Math.floor(Math.random() * 1000);

    // Register a test user
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: testStudentId,
        fullName: origName,
        email: testEmail,
        course: 'BS Information Technology',
        password: 'Password123!'
      })
    });
    if (regRes.status !== 201) {
      console.error('Registration failed:', regRes.status, await regRes.text());
    }
    assert(regRes.status === 201, 'User registered successfully for profile test');

    // Call PATCH /api/auth/profile
    const patchProfileRes = await fetch(`${baseUrl}/api/auth/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testEmail,
        fullName: updatedName,
        course: 'BS Computer Science'
      })
    });
    assert(patchProfileRes.status === 200, 'PATCH /api/auth/profile returns 200 OK');
    const patchJson = await patchProfileRes.json();
    assert(patchJson.success === true, 'Profile update returns success: true');
    assert(patchJson.user.fullName === updatedName, 'Response contains updated name: ' + updatedName);

    // Verify directly from db
    const userInDb = await dbUsers.findByEmailOrStudentId(testEmail);
    assert(userInDb && userInDb.full_name === updatedName, 'Database record directly queried shows updated full_name: ' + userInDb.full_name);
    assert(userInDb.course === 'BS Computer Science', 'Database record shows updated course: ' + userInDb.course);

    // 3. Requirement: Users cannot access requests from other users
    console.log('\n--- Test 3: Users Cannot Access Other Users Requests ---');
    // Create a request belonging to Student A
    const reqA = await dbRequests.create({
      studentName: 'Student Alpha',
      studentId: '24-11111',
      course: 'BS Information Technology',
      documentType: 'Certificate of Grades',
      purpose: 'Scholarship Application',
      dateSubmitted: '2026-11-24',
      email: 'alpha@cca.edu.ph'
    });
    assert(reqA && reqA.id, 'Created request for Student Alpha with ID: ' + reqA.id);

    // Student B tries to access Student Alpha's request
    const unauthorizedAccessRes = await fetch(`${baseUrl}/api/requests/${reqA.id}?studentId=24-22222&email=beta@cca.edu.ph&role=student`);
    assert(unauthorizedAccessRes.status === 403, 'Accessing other user request returns 403 Forbidden');
    const unauthorizedJson = await unauthorizedAccessRes.json();
    assert(unauthorizedJson.success === false, 'Access failure returns success: false');

    // Owner (Student Alpha) accesses their own request
    const authorizedAccessRes = await fetch(`${baseUrl}/api/requests/${reqA.id}?studentId=24-11111&email=alpha@cca.edu.ph&role=student`);
    assert(authorizedAccessRes.status === 200, 'Owner accessing their own request returns 200 OK');

    // Admin accesses the request
    const adminAccessRes = await fetch(`${baseUrl}/api/requests/${reqA.id}?role=admin`);
    assert(adminAccessRes.status === 200, 'Admin accessing any request returns 200 OK');

    // Clean up test request
    await dbRequests.delete(reqA.id);

    // 4. Requirement: Admin Profile Update & Cross-Account/Session Visibility
    console.log('\n--- Test 4: Admin Profile Update & Cross-Account Visibility ---');
    const updatedAdminName = 'Office of the College Registrar (Head)';
    const patchAdminRes = await fetch(`${baseUrl}/api/auth/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'admin@cca.edu.ph',
        fullName: updatedAdminName,
        email: 'admin@cca.edu.ph',
        role: 'admin'
      })
    });
    assert(patchAdminRes.status === 200, 'PATCH /api/auth/profile for admin returns 200 OK');
    const patchAdminJson = await patchAdminRes.json();
    assert(patchAdminJson.success === true, 'Admin update returns success: true');
    assert(patchAdminJson.user.fullName === updatedAdminName, 'Returned user has updated admin full name: ' + updatedAdminName);

    // Verify admin in Supabase directly
    const adminFromDb = await dbUsers.getAdminUser();
    assert(adminFromDb && adminFromDb.full_name === updatedAdminName, 'Supabase directly shows updated admin full_name: ' + adminFromDb.full_name);

    // Verify GET /api/auth/profile simulates opening in another session/account
    const getProfileRes = await fetch(`${baseUrl}/api/auth/profile?identifier=admin@cca.edu.ph`);
    assert(getProfileRes.status === 200, 'GET /api/auth/profile returns 200 OK for other session');
    const getProfileJson = await getProfileRes.json();
    assert(getProfileJson.user.fullName === updatedAdminName, 'Cross-session GET returns live updated admin name: ' + getProfileJson.user.fullName);

    // Also test fallback lookup with identifier=admin
    const getAdminFallbackRes = await fetch(`${baseUrl}/api/auth/profile?identifier=admin`);
    assert(getAdminFallbackRes.status === 200, 'GET /api/auth/profile?identifier=admin fallback works');
    const getAdminFallbackJson = await getAdminFallbackRes.json();
    assert(getAdminFallbackJson.user.role === 'admin', 'Fallback returns admin user');

    // --- Test 5: Cross-Device Student Login Returns Updated Profile After Edit ---
    console.log('\n--- Test 5: Cross-Device Student Login Returns Updated Profile After Edit ---');
    const devTestEmail = `devtest${Date.now()}@cca.edu.ph`;
    const devTestStudentId = `24-${Math.floor(10000 + Math.random() * 90000)}`;
    const devTestPw = 'CrossDev!2026';

    // Step A: Register student on Device 1
    const regDevRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Initial Student Name',
        studentId: devTestStudentId,
        email: devTestEmail,
        password: devTestPw,
        confirmPassword: devTestPw,
        course: 'BS Information Technology',
        role: 'student'
      })
    });
    assert(regDevRes.status === 201, 'Student registered on Device 1 (201 Created)');

    // Step B: Student updates profile on Device 1
    const newDevName = 'Cross Device Updated Student Name';
    const newDevCourse = 'BS Computer Science (BSCS)';
    const patchDevRes = await fetch(`${baseUrl}/api/auth/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: devTestStudentId,
        fullName: newDevName,
        course: newDevCourse,
        email: devTestEmail,
        role: 'student'
      })
    });
    assert(patchDevRes.status === 200, 'Device 1 PATCH /api/auth/profile returns 200 OK');

    // Step C: Simulate Device 2 login (POST /api/auth/login) - zero localStorage from Device 1
    const dev2LoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: devTestEmail,
        password: devTestPw,
        targetPortal: 'student'
      })
    });
    assert(dev2LoginRes.status === 200, 'Device 2 POST /api/auth/login returns 200 OK');
    const dev2LoginJson = await dev2LoginRes.json();
    assert(dev2LoginJson.user.fullName === newDevName, 'Device 2 login receives updated full_name: ' + dev2LoginJson.user.fullName);
    assert(dev2LoginJson.user.course === newDevCourse, 'Device 2 login receives updated course: ' + dev2LoginJson.user.course);

    // Step D: Simulate Device 2 GET /api/auth/profile on load / refresh
    const dev2GetRes = await fetch(`${baseUrl}/api/auth/profile?identifier=${encodeURIComponent(devTestStudentId)}`);
    assert(dev2GetRes.status === 200, 'Device 2 GET /api/auth/profile returns 200 OK');
    const dev2GetJson = await dev2GetRes.json();
    assert(dev2GetJson.user.fullName === newDevName, 'Device 2 GET returns updated full_name: ' + dev2GetJson.user.fullName);
    assert(dev2GetJson.user.course === newDevCourse, 'Device 2 GET returns updated course: ' + dev2GetJson.user.course);

    // --- Test 6: Cross-Device Avatar Persistence & Sync ---
    console.log('\n--- Test 6: Cross-Device Avatar Persistence & Sync ---');
    const sampleAvatarData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...mockAvatar123';
    
    // Step A: Admin avatar upload on Device 1
    const postAdminAvatarRes = await fetch(`${baseUrl}/api/auth/avatar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin@cca.edu.ph', avatar: sampleAvatarData, role: 'admin' })
    });
    assert(postAdminAvatarRes.status === 200, 'POST /api/auth/avatar for Admin returns 200 OK');

    // Step B: Admin avatar retrieved on Device 2 via GET /api/auth/profile
    const getAdminDev2Res = await fetch(`${baseUrl}/api/auth/profile?identifier=admin@cca.edu.ph`);
    assert(getAdminDev2Res.status === 200, 'Device 2 GET /api/auth/profile for Admin returns 200 OK');
    const getAdminDev2Json = await getAdminDev2Res.json();
    assert(getAdminDev2Json.user.avatar === sampleAvatarData, 'Device 2 receives synced admin avatar');

    // Step C: Student avatar upload on Device 1
    const postStudentAvatarRes = await fetch(`${baseUrl}/api/auth/avatar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: devTestStudentId, avatar: sampleAvatarData, role: 'student' })
    });
    assert(postStudentAvatarRes.status === 200, 'POST /api/auth/avatar for Student returns 200 OK');

    // Step D: Student avatar retrieved on Device 2 via login and profile GET
    const dev2StudentGetRes = await fetch(`${baseUrl}/api/auth/profile?identifier=${encodeURIComponent(devTestStudentId)}`);
    assert(dev2StudentGetRes.status === 200, 'Device 2 GET /api/auth/profile for Student returns 200 OK');
    const dev2StudentGetJson = await dev2StudentGetRes.json();
    assert(dev2StudentGetJson.user.avatar === sampleAvatarData, 'Device 2 receives synced student avatar');

    // --- Test 7: UI Requirements & Form Hygiene Checks ---
    console.log('\n--- Test 7: UI Requirements & Form Hygiene Checks ---');
    const fs = require('fs');
    const htmlContent = fs.readFileSync(path.resolve(__dirname, 'public', 'index.html'), 'utf8');

    // 1. Two-Factor Authentication must NOT be in settings
    assert(!htmlContent.includes('toggleTwoFactor'), 'toggleTwoFactor is removed from Student Settings');
    assert(!htmlContent.includes('admin2FAToggle'), 'admin2FAToggle is removed from Admin Settings');

    // 2. "Cancel | Save Changes" in lower right corner must NOT be present
    assert(!htmlContent.includes('btnCancelAdminSettings'), 'btnCancelAdminSettings is removed from Admin Settings');
    assert(!htmlContent.includes('btnSaveAdminSettings'), 'btnSaveAdminSettings is removed from Admin Settings');
    assert(!htmlContent.includes('btnSettingsCancel'), 'btnSettingsCancel is removed from Student Settings');
    assert(!htmlContent.includes('btnSettingsSave'), 'btnSettingsSave is removed from Student Settings');

    // 3. Edit Profile action buttons must be present
    assert(htmlContent.includes('btnAdminUpdateProfileLabel'), 'btnAdminUpdateProfileLabel is present for Admin Edit Profile');
    assert(htmlContent.includes('btnStudentToggleEditSettingsLabel'), 'btnStudentToggleEditSettingsLabel is present for Student Edit Profile');

    // 4. Default hardcoded "Admin Reyes" and dummy contact must NOT be in inputs
    assert(!htmlContent.includes('value="+63 912 345 6789"'), 'Hardcoded dummy contact number is removed');
    assert(!htmlContent.includes('id="adminDropdownUserName">Admin Reyes<'), 'Hardcoded Admin Reyes removed from dropdown');

    console.log('\n========================================================');
    console.log(`🎉 ALL ${passed}/${total} NEW FIX TESTS PASSED!`);
    console.log('========================================================');
  } finally {
    server.close();
  }
}

testNewFixes().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
