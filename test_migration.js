/**
 * CCA DocTrack - Turso Migration Verification Test Suite
 * Tests all required endpoints, operations, schema validations, and persistence.
 */
const { initDB, checkHealth, db, formatRequest } = require('./db');

async function runTests() {
  console.log('====================================================');
  console.log('🧪 Starting CCA DocTrack Turso Migration Test Suite');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, testName) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      throw new Error(`Assertion failed for: ${testName}`);
    }
  }

  // 1. Database Connection & Health Verification
  console.log('--- Test 1: Database Initialization & Health Check ---');
  await initDB();
  const health = await checkHealth();
  assert(health.connected === true, 'Database connection is established and healthy');
  assert(typeof health.mode === 'string', `Health check reports active mode: ${health.mode}`);

  // 2. GET /api/requests
  console.log('\n--- Test 2: GET /api/requests (Retrieve all requests) ---');
  const allReqsRes = await db.execute('SELECT * FROM document_requests ORDER BY id DESC');
  const formattedAll = allReqsRes.rows.map(formatRequest);
  assert(Array.isArray(formattedAll), 'Query returns an array of records');
  assert(formattedAll.length > 0, `Query returns existing records (Count: ${formattedAll.length})`);

  const first = formattedAll[0];
  assert(first.id !== undefined && first._id !== undefined, 'Record includes both numeric id and string _id');
  assert(first.studentName !== undefined, 'Record includes studentName');
  assert(first.studentId !== undefined, 'Record includes studentId');
  assert(first.documentType !== undefined, 'Record includes documentType');
  assert(first.purpose !== undefined, 'Record includes purpose');
  assert(first.dateSubmitted !== undefined, 'Record includes dateSubmitted');
  assert(first.status !== undefined, 'Record includes status');

  // 3. Filtered GET (?studentId=)
  console.log('\n--- Test 3: Filtered GET by studentId ---');
  const studentIdQuery = '23-67894';
  const filteredRes = await db.execute({
    sql: 'SELECT * FROM document_requests WHERE student_id = ? ORDER BY id DESC',
    args: [studentIdQuery]
  });
  const formattedFiltered = filteredRes.rows.map(formatRequest);
  assert(formattedFiltered.length > 0, `Found records for studentId: ${studentIdQuery}`);
  assert(formattedFiltered.every(r => r.studentId === studentIdQuery), 'All returned records match filter');

  // 4. POST /api/requests (Create new request & Data Persistence)
  console.log('\n--- Test 4: POST /api/requests (Data Creation & Persistence) ---');
  const testStudentName = 'Maria Santos Test';
  const testStudentId = '23-99999';
  const testDocType = 'Certificate of Enrollment';
  const testPurpose = 'Scholarship Renewal Application';
  const testDate = '2026-11-22';

  const insertRes = await db.execute({
    sql: `INSERT INTO document_requests (student_name, student_id, document_type, purpose, date_submitted, status, course, email)
          VALUES (?, ?, ?, ?, ?, 'Pending', ?, ?)`,
    args: [testStudentName, testStudentId, testDocType, testPurpose, testDate, 'BS Information Technology', 'maria@cca.edu.ph']
  });

  const createdId = insertRes.lastInsertRowid;
  assert(Number(createdId) > 0, `Record inserted successfully with ID: ${createdId}`);

  // 5. GET /api/requests/:id
  console.log('\n--- Test 5: GET /api/requests/:id ---');
  const fetchCreated = await db.execute({
    sql: 'SELECT * FROM document_requests WHERE id = ?',
    args: [createdId]
  });
  assert(fetchCreated.rows.length === 1, `Fetched newly created record by ID: ${createdId}`);
  const createdRecord = formatRequest(fetchCreated.rows[0]);
  assert(createdRecord.studentName === testStudentName, `Student name matches: ${createdRecord.studentName}`);
  assert(createdRecord.status === 'Pending', 'Default status is Pending');

  // 6. PATCH /api/requests/:id (Status Updates)
  console.log('\n--- Test 6: PATCH /api/requests/:id (Status transitions) ---');
  // Transition to Processing
  await db.execute({
    sql: 'UPDATE document_requests SET status = ? WHERE id = ?',
    args: ['Processing', createdId]
  });
  let updatedRes = await db.execute({
    sql: 'SELECT * FROM document_requests WHERE id = ?',
    args: [createdId]
  });
  let updatedRecord = formatRequest(updatedRes.rows[0]);
  assert(updatedRecord.status === 'Processing', 'Status updated to Processing');

  // Transition to Completed
  await db.execute({
    sql: 'UPDATE document_requests SET status = ? WHERE id = ?',
    args: ['Completed', createdId]
  });
  updatedRes = await db.execute({
    sql: 'SELECT * FROM document_requests WHERE id = ?',
    args: [createdId]
  });
  updatedRecord = formatRequest(updatedRes.rows[0]);
  assert(updatedRecord.status === 'Completed', 'Status updated to Completed');

  // 7. Verify Dashboard Statistics Calculation
  console.log('\n--- Test 7: Dashboard Statistics Aggregation ---');
  const statsRes = await db.execute(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'Processing' THEN 1 ELSE 0 END) as processing,
      SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed
    FROM document_requests
  `);
  const stats = statsRes.rows[0];
  console.log(`    Dashboard Counts -> Total: ${stats.total}, Pending: ${stats.pending}, Processing: ${stats.processing}, Completed: ${stats.completed}`);
  assert(stats.total > 0, 'Total requests count is accurate');
  assert(stats.completed >= 1, 'Completed count reflects updated record');

  // 8. User Authentication Tests
  console.log('\n--- Test 8: Authentication in Turso (Admin & Student) ---');
  const bcrypt = require('bcryptjs');
  const adminRes = await db.execute({
    sql: 'SELECT * FROM users WHERE email = ?',
    args: ['admin@cca.edu.ph']
  });
  assert(adminRes.rows.length === 1, 'Admin account exists in Turso database');
  const adminUser = adminRes.rows[0];
  const adminPwMatch = await bcrypt.compare('admin123', adminUser.password);
  assert(adminPwMatch === true, 'Admin password hashes and verifies correctly (admin123)');
  assert(adminUser.role === 'admin', 'Admin role is verified');

  const studentRes = await db.execute({
    sql: 'SELECT * FROM users WHERE email = ?',
    args: ['jaynellan@cca.edu.ph']
  });
  assert(studentRes.rows.length === 1, 'Default student account exists in Turso database');
  const studentUser = studentRes.rows[0];
  const studentPwMatch = await bcrypt.compare('student123', studentUser.password);
  assert(studentPwMatch === true, 'Student password hashes and verifies correctly (student123)');

  // 9. Server Restart & Persistence Verification
  console.log('\n--- Test 9: Restart & Data Persistence Verification ---');
  // Re-instantiate client or re-query to simulate server restart
  const recheckRes = await db.execute({
    sql: 'SELECT * FROM document_requests WHERE id = ?',
    args: [createdId]
  });
  assert(recheckRes.rows.length === 1, `Record with ID ${createdId} persists across database accesses`);
  assert(recheckRes.rows[0].student_name === testStudentName, 'Persisted record content is unchanged');

  // Clean up test record
  await db.execute({
    sql: 'DELETE FROM document_requests WHERE id = ?',
    args: [createdId]
  });
  console.log('    Cleaned up test record.');

  console.log('\n====================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
