const http = require('http');
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

    // 5. Requirement: Default Student Profile Update in Supabase
    console.log('\n--- Test 5: Default Student Profile Update in Supabase ---');
    const defaultStudentEmail = 'jaynellan@cca.edu.ph';
    const updatedDefaultStudentName = 'Jaynellan Almary Magpantay (Updated)';
    const patchStudentRes = await fetch(`${baseUrl}/api/auth/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: defaultStudentEmail,
        fullName: updatedDefaultStudentName,
        course: 'BS Information Technology',
        role: 'student'
      })
    });
    assert(patchStudentRes.status === 200, 'PATCH /api/auth/profile for default student returns 200 OK');
    const patchStudentJson = await patchStudentRes.json();
    assert(patchStudentJson.success === true, 'Default student update returns success: true');
    assert(patchStudentJson.user.fullName === updatedDefaultStudentName, 'Returned user has updated full name: ' + updatedDefaultStudentName);

    // Verify in Supabase directly
    const studentInDb = await dbUsers.findByEmailOrStudentId(defaultStudentEmail);
    assert(studentInDb && studentInDb.full_name === updatedDefaultStudentName, 'Supabase directly shows updated student full_name: ' + studentInDb.full_name);

    // Verify GET /api/auth/profile for default student (cross-session / reopen)
    const getStudentProfileRes = await fetch(`${baseUrl}/api/auth/profile?identifier=${defaultStudentEmail}`);
    assert(getStudentProfileRes.status === 200, 'GET /api/auth/profile returns 200 OK for default student');
    const getStudentProfileJson = await getStudentProfileRes.json();
    assert(getStudentProfileJson.user.fullName === updatedDefaultStudentName, 'Reopening session returns live updated student details');

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
