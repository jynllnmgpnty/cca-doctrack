/**
 * CCA DocTrack - Comprehensive System Integration Test Suite
 * Tests Supabase PostgreSQL connection, Unified Authentication, Password & Email Rules,
 * Request Isolation, In-Place Profile Updates, Cascading Deletions, and Responsive UI.
 */

const http = require('http');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initDB, checkHealth, dbRequests, dbUsers } = require('./db');
const requestRoutes = require('./routes/requestRoutes');
const authRoutes = require('./routes/authRoutes');

async function runSystemTests() {
  console.log('================================================================');
  console.log('🎓 CCA DocTrack - System Integration & Security Test Suite');
  console.log('🏛️ Testing Supabase PostgreSQL, Auth, Isolation, Cascade, & UI');
  console.log('================================================================\n');

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/api/health', async (req, res) => {
    const health = await checkHealth();
    res.status(health.connected ? 200 : 503).json({
      status: health.connected ? 'UP' : 'DOWN',
      service: 'CCA DocTrack API',
      database: {
        status: health.connected ? 'Connected' : 'Disconnected',
        type: health.type || 'Supabase Database (PostgreSQL)'
      }
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/requests', requestRoutes);

  await initDB();

  const TEST_PORT = 3898;
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  const baseUrl = `http://localhost:${TEST_PORT}`;

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
    // -------------------------------------------------------------------------
    // 1. Health & Database Connectivity
    // -------------------------------------------------------------------------
    console.log('--- 1. Database Health Check ---');
    const healthRes = await fetch(`${baseUrl}/api/health`);
    assert(healthRes.status === 200, 'Health check returns 200 OK');
    const healthJson = await healthRes.json();
    assert(healthJson.status === 'UP', 'Health status is UP');
    assert(healthJson.database.status === 'Connected', 'Database status is Connected');

    // -------------------------------------------------------------------------
    // 2. Unified Single Login
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Unified Single Login (No Role Selector Needed) ---');
    // Admin login via email
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@cca.edu.ph', password: 'admin123' })
    });
    assert(adminLoginRes.status === 200, 'Admin logs in via unified login');
    const adminJson = await adminLoginRes.json();
    assert(adminJson.user && adminJson.user.role === 'admin', 'Identified role is admin');

    // Admin login via alias 'admin'
    const adminAliasRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin', password: 'admin123' })
    });
    assert(adminAliasRes.status === 200, 'Admin logs in via identifier alias "admin"');

    // Student login via email
    const studentLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@cca.edu.ph', password: 'student123' })
    });
    assert(studentLoginRes.status === 200, 'Student logs in via unified login');
    const studentJson = await studentLoginRes.json();
    assert(studentJson.user && studentJson.user.role === 'student', 'Identified role is student');

    // Student login via Student ID Number
    const studentIdLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '23-67894', password: 'student123' })
    });
    assert(studentIdLoginRes.status === 200, 'Student logs in via Student ID number');

    // Bad password
    const badLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@cca.edu.ph', password: 'WrongPassword123' })
    });
    assert(badLoginRes.status === 401, 'Bad credentials correctly rejected with 401 Unauthorized');

    // -------------------------------------------------------------------------
    // 3. Registration Security & Password Validation
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Registration Validations & Security Rules ---');
    // Block admin registration
    const adminRegRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Hacker Admin',
        email: 'hacker@cca.edu.ph',
        password: 'Password123',
        role: 'admin'
      })
    });
    assert(adminRegRes.status === 403, 'Public admin registration is blocked with 403 Forbidden');

    // Enforce @cca.edu.ph institutional domain
    const nonCcaEmailRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Gmail User',
        studentId: '24-99001',
        email: 'user@gmail.com',
        password: 'Password123'
      })
    });
    assert(nonCcaEmailRes.status === 400, 'Non-CCA email (@gmail.com) rejected with 400 Bad Request');

    // Enforce password strength: missing uppercase
    const noUpperRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Test User',
        studentId: '24-99002',
        email: 'testuser1@cca.edu.ph',
        password: 'password123'
      })
    });
    assert(noUpperRes.status === 400, 'Password missing uppercase rejected with 400');

    // Enforce password strength: missing number
    const noNumRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Test User',
        studentId: '24-99003',
        email: 'testuser2@cca.edu.ph',
        password: 'PasswordOnly'
      })
    });
    assert(noNumRes.status === 400, 'Password missing numbers rejected with 400');

    // Valid student registration (>= 8 chars, uppercase, lowercase, numbers, >12 chars, special characters)
    const testStamp = Date.now();
    const testStudentId = `ST-${testStamp.toString().slice(-5)}`;
    const testEmail = `student${testStamp}@cca.edu.ph`;
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Isolation Test Student',
        studentId: testStudentId,
        email: testEmail,
        password: 'VerySecurePassword2026!@#',
        course: 'BS Information Technology'
      })
    });
    assert(regRes.status === 201, 'Valid student registered with 201 Created');

    // -------------------------------------------------------------------------
    // 4. Student Data Isolation & Privacy
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Student Request Privacy & Isolation ---');
    // Newly registered student has exactly 0 requests
    const isolationRes = await fetch(`${baseUrl}/api/requests?studentId=${encodeURIComponent(testStudentId)}`);
    assert(isolationRes.status === 200, 'GET /api/requests for new student returns 200');
    const isoJson = await isolationRes.json();
    assert(isoJson.count === 0, 'New student has exactly 0 requests (no leakage)');

    // Create a request for this student
    const createReqRes = await fetch(`${baseUrl}/api/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName: 'Isolation Test Student',
        studentId: testStudentId,
        documentType: 'Transcript of Records (TOR)',
        purpose: 'Employment Verification',
        email: testEmail
      })
    });
    assert(createReqRes.status === 201, 'Created document request returns 201 Created');
    const createdReq = await createReqRes.json();
    const reqId = createdReq.data.id;

    // Another student accessing this request is blocked (403 Forbidden)
    const unauthorizedAccessRes = await fetch(`${baseUrl}/api/requests/${reqId}?studentId=OTHER-STUDENT-99&email=other@cca.edu.ph&role=student`);
    assert(unauthorizedAccessRes.status === 403, 'Unauthorized student accessing another student request blocked (403)');

    // Owner accessing returns 200
    const ownerAccessRes = await fetch(`${baseUrl}/api/requests/${reqId}?studentId=${encodeURIComponent(testStudentId)}&email=${encodeURIComponent(testEmail)}&role=student`);
    assert(ownerAccessRes.status === 200, 'Owner student accessing own request returns 200 OK');

    // Admin accessing returns 200
    const adminAccessRes = await fetch(`${baseUrl}/api/requests/${reqId}?role=admin`);
    assert(adminAccessRes.status === 200, 'Admin accessing request returns 200 OK');

    // -------------------------------------------------------------------------
    // 5. In-Place Updates & Cascading Deletions
    // -------------------------------------------------------------------------
    console.log('\n--- 5. In-Place Updates & Cascade Deletions ---');
    // Update student profile in-place
    const updatedName = 'Updated In-Place Student Name';
    const profileRes = await fetch(`${baseUrl}/api/auth/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testStudentId,
        fullName: updatedName,
        course: 'BS Computer Science'
      })
    });
    assert(profileRes.status === 200, 'PATCH /api/auth/profile returns 200');
    const profileData = await profileRes.json();
    assert(profileData.user.fullName === updatedName, 'Full name updated in-place');

    // Verify cascade to document requests
    const updatedReqRes = await fetch(`${baseUrl}/api/requests/${reqId}`);
    const updatedReqJson = await updatedReqRes.json();
    assert(updatedReqJson.data.studentName === updatedName, 'Student name update propagated to document requests');

    // Cascade deletion of student account
    const delRes = await fetch(`${baseUrl}/api/auth/students/${encodeURIComponent(testStudentId)}`, {
      method: 'DELETE'
    });
    assert(delRes.status === 200, 'DELETE student account returns 200 OK');

    // Confirm request is cascade-deleted from database
    const checkDeletedReqRes = await fetch(`${baseUrl}/api/requests/${reqId}`);
    assert(checkDeletedReqRes.status === 404, 'Associated document request cascade-deleted (404 Not Found)');

    // -------------------------------------------------------------------------
    // 6. Responsive UI & Mobile Drawer Hygiene
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Responsive UI & Mobile Drawer Hygiene ---');
    const html = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
    const css = fs.readFileSync(path.join(__dirname, 'public', 'style.css'), 'utf8');

    // Unified login in HTML: role indicator selector hidden
    assert(html.includes('id="authRoleIndicators"') && html.includes('style="display: none !important;"'), 'Role indicator tabs removed from login');

    // Mobile drawer profile header structured as column (.sidebar-profile-info)
    assert(html.includes('<div class="sidebar-profile-info">'), 'Mobile drawer header contains .sidebar-profile-info container');
    assert(css.includes('.student-sidebar-profile .sidebar-profile-info {'), 'CSS defines responsive column layout for drawer profile info');

    // Close button clearance
    assert(css.includes('padding-right: 52px !important;'), 'Drawer profile header has 52px padding clearance for close button');

    // Centered logout confirmation dialog
    assert(html.includes('class="logout-modal-icon-wrap"'), 'Logout confirmation modal has centered icon wrapper');

    // Zero horizontal overflow rules
    assert(css.includes('overflow-x: hidden'), 'Enforces overflow-x: hidden on root containers');

    console.log('\n================================================================');
    console.log(`🎉 ALL ${passed}/${total} SYSTEM INTEGRATION & SECURITY TESTS PASSED!`);
    console.log('================================================================');
  } finally {
    server.close();
  }
}

runSystemTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ System test failure:', err.message);
    process.exit(1);
  });
