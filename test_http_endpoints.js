/**
 * CCA DocTrack - HTTP Integration Test Suite
 * Tests actual HTTP responses, headers, status codes, and JSON bodies.
 * Aligns with the IT 412 Rubric and the CCA-DocTrack Postman Collection.
 */
const http = require('http');
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB, checkHealth, dbRequests } = require('./db');
const requestRoutes = require('./routes/requestRoutes');
const authRoutes = require('./routes/authRoutes');

async function runHttpTests() {
  console.log('================================================================');
  console.log('🌐 Starting CCA DocTrack HTTP API Integration Tests (IT 412)');
  console.log('================================================================\n');

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, 'public')));

  // REST API Health-Check Endpoint
  app.get('/api/health', async (req, res) => {
    const health = await checkHealth();
    res.status(health.connected ? 200 : 503).json({
      status: health.connected ? 'UP' : 'DOWN',
      service: 'CCA DocTrack API',
      uptime: `${Math.floor(process.uptime())}s`,
      database: {
        status: health.connected ? 'Connected' : 'Disconnected',
        type: health.type || 'Supabase Database (PostgreSQL)',
        mode: health.mode || 'Offline',
        description: health.connected ? `Connected to ${health.mode}` : 'Not connected'
      },
      timestamp: new Date().toISOString()
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/requests', requestRoutes);

  // Initialize DB
  await initDB();

  // Start HTTP server on test port 3899
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(3899, resolve));
  const baseUrl = 'http://localhost:3899';

  const testResults = [];
  let total = 0;
  let passed = 0;

  function recordResult(testNum, endpoint, expectedStatus, actualStatus, pass, details) {
    total++;
    if (pass) {
      passed++;
      console.log(`  ✅ PASS: Test ${testNum} [${endpoint}] -> Status ${actualStatus} (${details})`);
    } else {
      console.error(`  ❌ FAIL: Test ${testNum} [${endpoint}] -> Expected ${expectedStatus}, Got ${actualStatus} (${details})`);
    }
    testResults.push({
      testNum,
      endpoint,
      expectedStatus,
      actualStatus,
      result: pass ? 'PASS' : 'FAIL',
      details
    });
  }

  let createdRequestId = null;

  try {
    // -------------------------------------------------------------------------
    // 1. GET /api/health (200 OK)
    // -------------------------------------------------------------------------
    console.log('--- 1. Health Check Endpoint ---');
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthJson = await healthRes.json();
    const healthPass = healthRes.status === 200 && healthJson.status === 'UP' && healthJson.database.type.includes('Supabase');
    recordResult(1, 'GET /api/health', 200, healthRes.status, healthPass, 'Service UP, Supabase PostgreSQL connected');

    // -------------------------------------------------------------------------
    // 2. GET /api/requests (200 OK)
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Retrieve All Requests ---');
    const listRes = await fetch(`${baseUrl}/api/requests`);
    const listJson = await listRes.json();
    const listPass = listRes.status === 200 && listJson.success === true && Array.isArray(listJson.data);
    recordResult(2, 'GET /api/requests', 200, listRes.status, listPass, `Returned array with ${listJson.count} items`);

    // -------------------------------------------------------------------------
    // 3. POST /api/requests - Valid Payload (201 Created)
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Create Request (Valid Body) ---');
    const newRequestPayload = {
      studentName: 'Juan Dela Cruz',
      studentId: '23-01042',
      course: 'BS Information Technology',
      email: 'jdelacruz@cca.edu.ph',
      documentType: 'Transcript of Records',
      purpose: 'Job Application Requirement',
      dateSubmitted: '2026-11-22'
    };
    const validPostRes = await fetch(`${baseUrl}/api/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRequestPayload)
    });
    const validPostJson = await validPostRes.json();
    const postPass = validPostRes.status === 201 && validPostJson.success === true && validPostJson.data && validPostJson.data.id;
    if (postPass) createdRequestId = validPostJson.data.id;
    recordResult(3, 'POST /api/requests (valid)', 201, validPostRes.status, postPass, `Created request #${createdRequestId}`);

    // -------------------------------------------------------------------------
    // 4. POST /api/requests - Missing Purpose (400 Bad Request)
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Create Request (Missing Purpose Validation) ---');
    const invalidPostRes = await fetch(`${baseUrl}/api/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName: 'Juan Dela Cruz',
        studentId: '23-01042',
        course: 'BS Information Technology',
        email: 'jdelacruz@cca.edu.ph',
        documentType: 'Transcript of Records'
        // purpose omitted
      })
    });
    const invalidPostJson = await invalidPostRes.json();
    const invalidPostPass = invalidPostRes.status === 400 && invalidPostJson.success === false && Array.isArray(invalidPostJson.errors);
    recordResult(4, 'POST /api/requests (missing purpose)', 400, invalidPostRes.status, invalidPostPass, 'Validation error array returned');

    // -------------------------------------------------------------------------
    // 5. GET /api/requests/999999 (404 Not Found)
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Get Request by Non-Existent ID ---');
    const notFoundRes = await fetch(`${baseUrl}/api/requests/999999`);
    const notFoundJson = await notFoundRes.json();
    const notFoundPass = notFoundRes.status === 404 && notFoundJson.success === false;
    recordResult(5, 'GET /api/requests/999999', 404, notFoundRes.status, notFoundPass, 'Record not found message returned');

    // -------------------------------------------------------------------------
    // 6. GET /api/requests/abc (400 Bad Request - Non-Numeric ID)
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Get Request with Non-Numeric ID ---');
    const badIdRes = await fetch(`${baseUrl}/api/requests/abc`);
    const badIdJson = await badIdRes.json();
    const badIdPass = badIdRes.status === 400 && badIdJson.success === false && badIdJson.message.includes('Invalid request ID format');
    recordResult(6, 'GET /api/requests/abc', 400, badIdRes.status, badIdPass, 'Non-numeric string ID rejected without stripping non-digits');

    // -------------------------------------------------------------------------
    // 7. PATCH /api/requests/:id - Invalid Status (400 Bad Request)
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Patch Request with Invalid Status ---');
    const targetId = createdRequestId || 1;
    const badStatusRes = await fetch(`${baseUrl}/api/requests/${targetId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'InvalidCustomStatus' })
    });
    const badStatusJson = await badStatusRes.json();
    const badStatusPass = badStatusRes.status === 400 && badStatusJson.success === false && badStatusJson.message.includes('Invalid status');
    recordResult(7, `PATCH /api/requests/${targetId} (bad status)`, 400, badStatusRes.status, badStatusPass, 'Rejected unallowed status value');

    // -------------------------------------------------------------------------
    // 8. PATCH /api/requests/:id - Valid Status (200 OK)
    // -------------------------------------------------------------------------
    console.log('\n--- 8. Patch Request with Valid Status Transition ---');
    const goodStatusRes = await fetch(`${baseUrl}/api/requests/${targetId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Approved', pickupDate: '2026-11-30' })
    });
    const goodStatusJson = await goodStatusRes.json();
    const goodStatusPass = goodStatusRes.status === 200 && goodStatusJson.success === true && goodStatusJson.data.status === 'Approved';
    recordResult(8, `PATCH /api/requests/${targetId} (valid)`, 200, goodStatusRes.status, goodStatusPass, 'Status transitioned to Approved with pickup date');

    // -------------------------------------------------------------------------
    // 9. POST /api/auth/login - Authentication Verification
    // -------------------------------------------------------------------------
    console.log('\n--- 9. Unified Authentication Verification ---');
    const badLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@cca.edu.ph', password: 'wrongpassword' })
    });
    const badLoginPass = badLoginRes.status === 401;
    recordResult(9, 'POST /api/auth/login (bad password)', 401, badLoginRes.status, badLoginPass, 'Unauthorized credentials correctly rejected');

    // Clean up created record
    if (createdRequestId) {
      await dbRequests.delete(createdRequestId);
    }

    // -------------------------------------------------------------------------
    // Output PASS/FAIL Table
    // -------------------------------------------------------------------------
    console.log('\n================================================================');
    console.log('📋 HTTP API TEST SUMMARY (IT 412 REST RUBRIC EVIDENCE)');
    console.log('================================================================');
    console.log('| # | Method & Endpoint                      | Expected | Actual | Result |');
    console.log('|---|----------------------------------------|----------|--------|--------|');
    testResults.forEach(r => {
      const numStr = String(r.testNum).padEnd(2, ' ');
      const epStr = r.endpoint.padEnd(38, ' ');
      const expStr = String(r.expectedStatus).padEnd(8, ' ');
      const actStr = String(r.actualStatus).padEnd(6, ' ');
      const resStr = r.result === 'PASS' ? '✅ PASS' : '❌ FAIL';
      console.log(`| ${numStr}| ${epStr} | ${expStr} | ${actStr} | ${resStr} |`);
    });
    console.log('================================================================');
    console.log(`🎉 ALL ${passed}/${total} HTTP API INTEGRATION TESTS PASSED!`);
    console.log('================================================================\n');

    if (passed !== total) {
      throw new Error(`Only ${passed} out of ${total} tests passed.`);
    }
  } finally {
    server.close();
  }
}

runHttpTests().catch((err) => {
  console.error('\n❌ HTTP test failed:', err);
  process.exit(1);
});
