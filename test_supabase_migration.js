/**
 * CCA DocTrack - Supabase Migration Comprehensive Verification Suite
 * Christ Centered Academy of Lipa City Inc.
 * 
 * Verifies:
 * 1. Supabase module configuration & health check
 * 2. GET /api/requests (retrieval & field schema mapping)
 * 3. POST /api/requests (validation + creation + camelCase output)
 * 4. GET /api/requests/:id (retrieval by ID, 200, 400, 404)
 * 5. PATCH /api/requests/:id (status updates, pickup date, 200, 400, 404)
 * 6. GET /api/health (database connectivity status & description)
 * 7. Dashboard statistics calculation accuracy
 * 8. Frontend request submission data flow
 * 9. Frontend status updates flow
 * 10. Persistence verification
 */

const http = require('http');
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB, checkHealth, dbRequests, dbUsers, formatRequest } = require('./db');
const { isSupabaseConfigured, getSupabaseClient } = require('./supabase');
const requestRoutes = require('./routes/requestRoutes');
const authRoutes = require('./routes/authRoutes');

async function runVerification() {
  console.log('================================================================');
  console.log('🧪 CCA DocTrack: Supabase Migration Verification Suite');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      throw new Error(`Verification assertion failed: ${message}`);
    }
  }

  // 1. Module & DB Initialization
  console.log('--- Test 1: Database Initialization & Health Check ---');
  await initDB();
  const health = await checkHealth();
  assert(health.connected === true, 'Database is operational and connected');
  assert(typeof health.type === 'string' && health.type.includes('Database'), `Database type identified: ${health.type}`);
  console.log(`   Database Mode: ${health.mode}`);

  // Setup test Express server on port 3988
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/api/health', async (req, res) => {
    const h = await checkHealth();
    res.status(h.connected ? 200 : 503).json({
      status: h.connected ? 'UP' : 'DOWN',
      service: 'CCA DocTrack API',
      uptime: `${Math.floor(process.uptime())}s`,
      database: {
        status: h.connected ? 'Connected' : 'Disconnected',
        type: h.type || 'Supabase Database (PostgreSQL)',
        mode: h.mode || 'Offline'
      },
      timestamp: new Date().toISOString()
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/requests', requestRoutes);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(3988, resolve));
  const baseUrl = 'http://localhost:3988';

  try {
    // 2. Health Endpoint
    console.log('\n--- Test 2: GET /api/health ---');
    const healthRes = await fetch(`${baseUrl}/api/health`);
    assert(healthRes.status === 200, 'HTTP /api/health returned status 200 OK');
    const healthJson = await healthRes.json();
    assert(healthJson.status === 'UP', 'Health reports status UP');
    assert(healthJson.database.status === 'Connected', 'Database status reports Connected');

    // 3. GET /api/requests (List All)
    console.log('\n--- Test 3: GET /api/requests (Retrieval & Field Mapping) ---');
    const listRes = await fetch(`${baseUrl}/api/requests`);
    assert(listRes.status === 200, 'GET /api/requests returns 200 OK');
    const listJson = await listRes.json();
    assert(listJson.success === true, 'Response contains success: true');
    assert(Array.isArray(listJson.data), 'Response data is an array');
    assert(listJson.count > 0, `Returned ${listJson.count} request record(s)`);

    // Verify snake_case to camelCase field mapping
    const sample = listJson.data[0];
    assert(sample.id !== undefined && sample._id !== undefined, 'Record has numeric id and string _id');
    assert(sample.studentName !== undefined, `Mapped studentName exists: "${sample.studentName}"`);
    assert(sample.studentId !== undefined, `Mapped studentId exists: "${sample.studentId}"`);
    assert(sample.documentType !== undefined, `Mapped documentType exists: "${sample.documentType}"`);
    assert(sample.dateSubmitted !== undefined, `Mapped dateSubmitted exists: "${sample.dateSubmitted}"`);
    assert(sample.status !== undefined, `Mapped status exists: "${sample.status}"`);

    // 4. Filtered GET (?studentId=)
    console.log('\n--- Test 4: Filtered GET /api/requests?studentId=... ---');
    const testStudentId = sample.studentId;
    const filterRes = await fetch(`${baseUrl}/api/requests?studentId=${encodeURIComponent(testStudentId)}`);
    assert(filterRes.status === 200, 'Filtered request returns 200 OK');
    const filterJson = await filterRes.json();
    assert(filterJson.data.every(r => r.studentId === testStudentId), 'All filtered records match requested student ID');

    // 5. POST /api/requests (Validation Failures)
    console.log('\n--- Test 5: POST /api/requests (Validation 400 Bad Request) ---');
    const badPostRes = await fetch(`${baseUrl}/api/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentName: '' })
    });
    assert(badPostRes.status === 400, 'Returns 400 Bad Request when required fields are missing');
    const badPostJson = await badPostRes.json();
    assert(badPostJson.success === false, 'Returns success: false for invalid submission');
    assert(Array.isArray(badPostJson.errors) && badPostJson.errors.length > 0, 'Returns detailed errors array');

    // 6. POST /api/requests (Successful 201 Creation)
    console.log('\n--- Test 6: POST /api/requests (Successful Creation & Persistence) ---');
    const newReqPayload = {
      studentName: 'Andrei Bryan Reyes',
      studentId: '23-77889',
      course: 'BS Information Technology',
      documentType: 'Transcript of Records',
      purpose: 'Employment Application Requirements',
      dateSubmitted: '2026-11-24',
      email: 'andrei.reyes@cca.edu.ph'
    };

    const createRes = await fetch(`${baseUrl}/api/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newReqPayload)
    });
    assert(createRes.status === 201, 'Returns 201 Created');
    const createJson = await createRes.json();
    assert(createJson.success === true, 'Returns success: true on create');
    assert(createJson.data.id !== undefined, `New record created with ID: ${createJson.data.id}`);
    assert(createJson.data.studentName === newReqPayload.studentName, 'Returned studentName matches');
    assert(createJson.data.status === 'Pending', 'Initial status defaults to Pending');
    const createdId = createJson.data.id;

    // 7. GET /api/requests/:id
    console.log('\n--- Test 7: GET /api/requests/:id (200, 400, 404) ---');
    const getByIdRes = await fetch(`${baseUrl}/api/requests/${createdId}`);
    assert(getByIdRes.status === 200, 'Returns 200 OK for valid ID');
    const getByIdJson = await getByIdRes.json();
    assert(getByIdJson.data.id === createdId, 'Fetched record ID matches created ID');
    assert(getByIdJson.data.studentName === newReqPayload.studentName, 'Fetched studentName matches');

    const get404Res = await fetch(`${baseUrl}/api/requests/999999`);
    assert(get404Res.status === 404, 'Returns 404 Not Found for non-existent ID');

    const get400Res = await fetch(`${baseUrl}/api/requests/invalid-id`);
    assert(get400Res.status === 400, 'Returns 400 Bad Request for non-numeric ID');

    // 8. PATCH /api/requests/:id (Status transitions)
    console.log('\n--- Test 8: PATCH /api/requests/:id (Status & Pickup Date updates) ---');
    const patchRes1 = await fetch(`${baseUrl}/api/requests/${createdId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Processing' })
    });
    assert(patchRes1.status === 200, 'Updated status to Processing (200 OK)');
    const patchJson1 = await patchRes1.json();
    assert(patchJson1.data.status === 'Processing', 'Record status verified as Processing');

    const patchRes2 = await fetch(`${baseUrl}/api/requests/${createdId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'For Release', pickupDate: '2026-11-28' })
    });
    assert(patchRes2.status === 200, 'Updated status to For Release with pickupDate (200 OK)');
    const patchJson2 = await patchRes2.json();
    assert(patchJson2.data.status === 'For Release', 'Record status verified as For Release');
    assert(patchJson2.data.pickupDate === '2026-11-28', 'Record pickupDate verified');

    const patchBadStatusRes = await fetch(`${baseUrl}/api/requests/${createdId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'UnknownStatus' })
    });
    assert(patchBadStatusRes.status === 400, 'Returns 400 Bad Request for disallowed status');

    // 9. Dashboard Statistics Calculation Check
    console.log('\n--- Test 9: Dashboard Statistics Verification ---');
    const allRequests = await dbRequests.getAll();
    const totalRequests = allRequests.length;
    const pendingRequests = allRequests.filter(r => r.status === 'Pending').length;
    const processingRequests = allRequests.filter(r => r.status === 'Processing').length;
    const completedRequests = allRequests.filter(r => r.status === 'Completed').length;
    const forReleaseRequests = allRequests.filter(r => r.status === 'For Release' || r.status === 'Approved').length;

    assert(totalRequests > 0, `Total Requests calculated: ${totalRequests}`);
    assert(totalRequests === (pendingRequests + processingRequests + completedRequests + forReleaseRequests + allRequests.filter(r => r.status === 'Rejected').length),
      'Sum of individual statuses equals total requests count');

    // 10. Persistence and Cleanup Verification
    console.log('\n--- Test 10: Cleanup & Data Persistence Integrity ---');
    const deleteSuccess = await dbRequests.delete(createdId);
    assert(deleteSuccess === true, 'Test record deleted successfully');
    const verifyDeleted = await dbRequests.getById(createdId);
    assert(verifyDeleted === null, 'Verified record no longer exists in database');

    console.log('\n================================================================');
    console.log(`🎉 ALL ${passed}/${total} VERIFICATION CHECKS PASSED SUCCESSFULLY!`);
    console.log('================================================================');
  } finally {
    server.close();
  }
}

runVerification().catch((err) => {
  console.error('\n❌ Verification failed:', err);
  process.exit(1);
});
