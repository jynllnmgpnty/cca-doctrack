/**
 * CCA DocTrack - HTTP Integration Test Suite
 * Tests actual HTTP responses, headers, status codes, and JSON bodies.
 */
const http = require('http');
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB, checkHealth, db } = require('./db');
const requestRoutes = require('./routes/requestRoutes');
const authRoutes = require('./routes/authRoutes');

async function runHttpTests() {
  console.log('========================================================');
  console.log('🌐 Starting CCA DocTrack HTTP API Integration Tests');
  console.log('========================================================\n');

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
        type: 'Turso Cloud Database (libSQL)',
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

  let total = 0;
  let passed = 0;

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
    // 1. GET /api/health
    console.log('--- Test 1: GET /api/health ---');
    const healthRes = await fetch(`${baseUrl}/api/health`);
    assert(healthRes.status === 200, 'HTTP status is 200 OK');
    const healthJson = await healthRes.json();
    assert(healthJson.status === 'UP', 'Health status is UP');
    assert(healthJson.database.status === 'Connected', 'Database status is Connected');
    assert(healthJson.database.type.includes('Turso'), 'Database type specifies Turso');

    // 2. GET /api/requests
    console.log('\n--- Test 2: GET /api/requests ---');
    const listRes = await fetch(`${baseUrl}/api/requests`);
    assert(listRes.status === 200, 'HTTP status is 200 OK');
    const listJson = await listRes.json();
    assert(listJson.success === true, 'Response success is true');
    assert(Array.isArray(listJson.data), 'Response data is an array');
    assert(listJson.count > 0, `Returns count: ${listJson.count}`);

    // 3. POST /api/requests (Validation Error - 400 Bad Request)
    console.log('\n--- Test 3: POST /api/requests (Validation Error Handling) ---');
    const invalidPostRes = await fetch(`${baseUrl}/api/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentName: '' }) // missing required fields
    });
    assert(invalidPostRes.status === 400, 'Returns 400 Bad Request when fields are missing');
    const invalidPostJson = await invalidPostRes.json();
    assert(invalidPostJson.success === false, 'Validation failure returns success: false');
    assert(Array.isArray(invalidPostJson.errors), 'Returns errors array with specific messages');

    // 4. POST /api/requests (Successful creation - 201 Created)
    console.log('\n--- Test 4: POST /api/requests (Successful 201 Created) ---');
    const newRequestPayload = {
      studentName: 'Juan Dela Cruz',
      studentId: '23-11111',
      course: 'BS Information Technology',
      documentType: 'Transcript of Records',
      purpose: 'Job Application Requirement',
      dateSubmitted: '2026-11-22',
      email: 'jdelacruz@cca.edu.ph'
    };
    const validPostRes = await fetch(`${baseUrl}/api/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRequestPayload)
    });
    assert(validPostRes.status === 201, 'Returns 201 Created');
    const validPostJson = await validPostRes.json();
    assert(validPostJson.success === true, 'Returns success: true');
    assert(validPostJson.data.id !== undefined, `Returns created ID: ${validPostJson.data.id}`);
    assert(validPostJson.data.studentName === 'Juan Dela Cruz', 'Created record has correct student name');
    const createdId = validPostJson.data.id;

    // 5. GET /api/requests/:id
    console.log('\n--- Test 5: GET /api/requests/:id (200, 400, 404) ---');
    const getByIdRes = await fetch(`${baseUrl}/api/requests/${createdId}`);
    assert(getByIdRes.status === 200, 'Returns 200 OK for valid ID');
    const getByIdJson = await getByIdRes.json();
    assert(getByIdJson.data.id === createdId, 'Fetched record ID matches requested ID');

    const getNotFoundRes = await fetch(`${baseUrl}/api/requests/999999`);
    assert(getNotFoundRes.status === 404, 'Returns 404 Not Found for non-existent ID');

    const getBadIdRes = await fetch(`${baseUrl}/api/requests/notanid`);
    assert(getBadIdRes.status === 400, 'Returns 400 Bad Request for non-numeric ID');

    // 6. PATCH /api/requests/:id
    console.log('\n--- Test 6: PATCH /api/requests/:id (200, 400, 404) ---');
    const patchRes = await fetch(`${baseUrl}/api/requests/${createdId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Processing' })
    });
    assert(patchRes.status === 200, 'Returns 200 OK for status update');
    const patchJson = await patchRes.json();
    assert(patchJson.data.status === 'Processing', 'Status is updated to Processing');

    const patchInvalidStatusRes = await fetch(`${baseUrl}/api/requests/${createdId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'InvalidStatus' })
    });
    assert(patchInvalidStatusRes.status === 400, 'Returns 400 Bad Request for invalid status');

    // 7. Auth: POST /api/auth/login
    console.log('\n--- Test 7: POST /api/auth/login (Admin & Student) ---');
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@cca.edu.ph', password: 'admin123', targetPortal: 'admin' })
    });
    assert(adminLoginRes.status === 200, 'Admin login returns 200 OK');
    const adminLoginJson = await adminLoginRes.json();
    assert(adminLoginJson.user.role === 'admin', 'Admin user has admin role');

    const studentLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'jaynellan@cca.edu.ph', password: 'student123', targetPortal: 'student' })
    });
    assert(studentLoginRes.status === 200, 'Student login returns 200 OK');

    const wrongPwRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@cca.edu.ph', password: 'wrongpassword' })
    });
    assert(wrongPwRes.status === 401, 'Wrong password returns 401 Unauthorized');

    // Clean up created record
    await db.execute({
      sql: 'DELETE FROM document_requests WHERE id = ?',
      args: [createdId]
    });

    console.log('\n========================================================');
    console.log(`🎉 ALL ${passed}/${total} HTTP API INTEGRATION TESTS PASSED!`);
    console.log('========================================================');
  } finally {
    server.close();
  }
}

runHttpTests().catch((err) => {
  console.error('\n❌ HTTP test failed:', err);
  process.exit(1);
});
