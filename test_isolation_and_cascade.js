const { spawn } = require('child_process');
const assert = require('assert');
const { getSupabaseClient } = require('./supabase');
const { dbUsers, dbRequests } = require('./db');
require('dotenv').config();

const PORT = 3099;
process.env.PORT = PORT;

async function run() {
  console.log('Testing student request isolation, in-place updates, and cascade deletion...');
  let serverProcess;

  try {
    serverProcess = spawn('node', ['server.js'], {
      env: { ...process.env, PORT },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    serverProcess.stdout.on('data', d => process.stdout.write(d));
    serverProcess.stderr.on('data', d => process.stderr.write(d));

    await new Promise((resolve) => setTimeout(resolve, 3500));

    const baseUrl = `http://localhost:${PORT}`;
    const testStudentId = `23-CASC${Math.floor(1000 + Math.random() * 9000)}`;
    const testEmail = `cascade_${Math.floor(1000 + Math.random() * 9000)}@cca.edu.ph`;

    // 1. Student Request Isolation - New Student has exactly 0 requests
    console.log('\n--- 1. Testing Student Request Isolation ---');
    const isoRes = await fetch(`${baseUrl}/api/requests?studentId=${encodeURIComponent(testStudentId)}&email=${encodeURIComponent(testEmail)}`);
    const isoData = await isoRes.json();
    assert(isoRes.status === 200, 'GET /api/requests returned 200');
    assert(Array.isArray(isoData.data) && isoData.data.length === 0, 'New/unregistered student sees exactly 0 requests (never leaks other students)');
    console.log('  ✅ PASS: Student request isolation verified (0 requests for new user)');

    // 2. Register Student Account
    console.log('\n--- 2. Registering Test Student Account ---');
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Test Cascade User',
        studentId: testStudentId,
        email: testEmail,
        password: 'Password123',
        confirmPassword: 'Password123',
        course: 'BS Information Technology'
      })
    });
    const regData = await regRes.json();
    assert(regRes.status === 201, 'Student account registered');
    const registeredUserId = regData.user.id;
    console.log(`  ✅ PASS: Student account registered with ID: ${registeredUserId}`);

    // 3. Document Request Creation
    console.log('\n--- 3. Creating Document Request ---');
    const reqRes = await fetch(`${baseUrl}/api/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName: 'Test Cascade User',
        studentId: testStudentId,
        course: 'BS Information Technology',
        email: testEmail,
        documentType: 'Transcript of Records (TOR)',
        purpose: 'Job Application'
      })
    });
    const reqData = await reqRes.json();
    assert(reqRes.status === 201, 'Document request created');
    const requestId = reqData.data.id;
    console.log(`  ✅ PASS: Document request created with ID: ${requestId}`);

    // Verify student sees only their 1 request
    const studentReqRes = await fetch(`${baseUrl}/api/requests?studentId=${encodeURIComponent(testStudentId)}&email=${encodeURIComponent(testEmail)}`);
    const studentReqData = await studentReqRes.json();
    assert(studentReqData.data.length === 1, 'Student sees only their 1 created request');
    console.log('  ✅ PASS: Student sees exactly their 1 created request');

    // 4. In-Place Update of Document Request (PATCH & PUT)
    console.log('\n--- 4. Testing In-Place Update (No new records created) ---');
    const patchRes = await fetch(`${baseUrl}/api/requests/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'Processing',
        pickupDate: '2026-12-01'
      })
    });
    const patchData = await patchRes.json();
    assert(patchRes.status === 200, 'PATCH request returns 200');
    assert(patchData.data.id === requestId, 'Updated request preserves exact same numeric ID');
    assert(patchData.data.status === 'Processing', 'Status updated to Processing');

    const putRes = await fetch(`${baseUrl}/api/requests/${requestId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'Approved',
        pickupDate: '2026-12-05'
      })
    });
    const putData = await putRes.json();
    assert(putRes.status === 200, 'PUT request returns 200');
    assert(putData.data.id === requestId, 'PUT update preserves exact same ID');
    assert(putData.data.status === 'Approved', 'Status updated to Approved');

    // Verify request count for student is still exactly 1
    const checkCountRes = await fetch(`${baseUrl}/api/requests?studentId=${encodeURIComponent(testStudentId)}&email=${encodeURIComponent(testEmail)}`);
    const checkCountData = await checkCountRes.json();
    assert(checkCountData.data.length === 1, 'Total requests for student is still exactly 1 (no new record inserted on update)');
    console.log('  ✅ PASS: Request updated in-place without creating a new record');

    // 5. In-Place Update of Student Profile
    console.log('\n--- 5. Testing Profile In-Place Update ---');
    const profileRes = await fetch(`${baseUrl}/api/auth/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testStudentId,
        fullName: 'Updated Cascade User',
        course: 'BS Computer Science'
      })
    });
    const profileData = await profileRes.json();
    assert(profileRes.status === 200, 'PATCH /api/auth/profile returns 200');
    assert(profileData.user.id === registeredUserId, 'User ID remains identical after profile update');
    assert(profileData.user.fullName === 'Updated Cascade User', 'Full name updated in-place');
    console.log('  ✅ PASS: User profile updated in-place');

    // 6. Cascade Deletion: When student is deleted, all their requests and history are deleted
    console.log('\n--- 6. Testing User Cascade Deletion ---');
    const delStudentRes = await fetch(`${baseUrl}/api/auth/students/${encodeURIComponent(testStudentId)}`, {
      method: 'DELETE'
    });
    const delStudentData = await delStudentRes.json();
    assert(delStudentRes.status === 200, 'DELETE /api/auth/students/:identifier returns 200');
    assert(delStudentData.success === true, 'Success flag is true');

    // Verify user is gone from Supabase users table
    const client = getSupabaseClient();
    const { data: userCheck } = await client.from('users').select('*').eq('student_id', testStudentId);
    assert(!userCheck || userCheck.length === 0, 'User completely deleted from database users table');

    // Verify all document requests for that student are cascade deleted
    const { data: reqCheck } = await client.from('document_requests').select('*').eq('student_id', testStudentId);
    assert(!reqCheck || reqCheck.length === 0, 'All document requests for deleted user cascade deleted from database');
    console.log('  ✅ PASS: Deleting student cascades and removes all associated requests and history');

    // 7. Direct Request Deletion
    console.log('\n--- 7. Testing Direct Request Deletion ---');
    const tempReq = await dbRequests.create({
      studentName: 'Admin Temp',
      studentId: 'ADMIN-001',
      course: 'BSIT',
      email: 'admin@cca.edu.ph',
      documentType: 'Report Card',
      purpose: 'Testing Delete',
      dateSubmitted: '2026-11-26'
    });
    const delReqRes = await fetch(`${baseUrl}/api/requests/${tempReq.id}`, {
      method: 'DELETE'
    });
    const delReqData = await delReqRes.json();
    assert(delReqRes.status === 200, 'DELETE /api/requests/:id returns 200');
    const { data: reqDeletedCheck } = await client.from('document_requests').select('*').eq('id', tempReq.id);
    assert(!reqDeletedCheck || reqDeletedCheck.length === 0, 'Request deleted from database');
    console.log('  ✅ PASS: Request deleted directly via DELETE /api/requests/:id');

    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! 100% COMPLIANCE VERIFIED.');

  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  } finally {
    if (serverProcess) {
      serverProcess.kill('SIGINT');
    }
  }
}

run();
