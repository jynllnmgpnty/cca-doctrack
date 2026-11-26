/**
 * Comprehensive verification of Unified Login & Mobile Phone Responsiveness
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

async function run() {
  console.log('🚀 Starting Unified Login & Mobile Drawer Test Suite...\n');

  // 1. Static HTML / CSS / JS Inspection
  console.log('--- 1. Static Code Analysis ---');
  const html = fs.readFileSync(path.resolve(__dirname, 'public', 'index.html'), 'utf8');
  const css = fs.readFileSync(path.resolve(__dirname, 'public', 'style.css'), 'utf8');
  const js = fs.readFileSync(path.resolve(__dirname, 'public', 'script.js'), 'utf8');
  const authRoutes = fs.readFileSync(path.resolve(__dirname, 'routes', 'authRoutes.js'), 'utf8');

  // Unified Login checks
  assert(html.includes('id="authRoleIndicators"'), 'authRoleIndicators exists in HTML');
  assert(html.includes('style="display: none !important;"') || css.includes('.auth-role-indicators {\n  display: none !important;\n}'), 'authRoleIndicators is hidden in CSS/HTML');
  assert(!authRoutes.includes("if (targetPortal === 'admin' && user.role !== 'admin')"), 'authRoutes no longer blocks admin/student cross-portal login');
  assert(js.includes("if (result.user.role === 'admin')"), 'script.js routes to admin portal based on database role');
  assert(js.includes("switchView('admin')"), 'script.js switches to admin view');
  assert(js.includes("switchView('student')"), 'script.js switches to student view');
  console.log('  ✅ PASS: Unified login form configured and role check removed from server');

  // Mobile drawer checks
  assert(css.includes('.student-ref-sidebar,\n  .admin-ref-sidebar') || css.includes('.student-ref-sidebar,') && css.includes('.admin-ref-sidebar'), 'Sidebars are styled as mobile drawers');
  assert(css.includes('transform: translateX(-105%) !important'), 'Sidebars hidden off-canvas by default');
  assert(css.includes('.student-ref-sidebar.open') && css.includes('transform: translateX(0) !important'), 'Drawer slides out on .open');
  assert(!css.includes('.student-ref-nav {\n    display: grid !important;\n    grid-template-columns: 1fr 1fr !important;'), 'Removed inline 2-column grid from student-ref-nav');
  assert(!css.includes('grid-template-columns: 1fr 1fr !important;\n    gap: 4px !important;'), 'Removed 480px 2-column grid from student-ref-nav');
  
  // Centered mobile logout checks
  assert(css.includes('#studentSidebarLogoutBtn') && css.includes('justify-content: center !important') && css.includes('text-align: center !important'), 'Sidebar logout button is centered');
  assert(html.includes('id="studentSidebarLogoutBtn"'), 'studentSidebarLogoutBtn exists in HTML');
  assert(html.includes('id="adminSidebarLogoutBtn"'), 'adminSidebarLogoutBtn exists in HTML');
  console.log('  ✅ PASS: Mobile sidebars are off-canvas drawers and logout is centered');

  // Hamburger toggles & drawers
  assert(html.includes('id="mobileStudentToggle"'), 'mobileStudentToggle exists');
  assert(html.includes('id="mobileAdminToggle"'), 'mobileAdminToggle exists');
  assert(html.includes('id="btnLandingNavToggle"'), 'btnLandingNavToggle exists');
  assert(html.includes('id="studentSidebarBackdrop"'), 'studentSidebarBackdrop exists');
  assert(html.includes('id="adminSidebarBackdrop"'), 'adminSidebarBackdrop exists');
  assert(html.includes('id="mobileStudentSidebarClose"'), 'mobileStudentSidebarClose exists');
  assert(html.includes('id="mobileAdminSidebarClose"'), 'mobileAdminSidebarClose exists');
  console.log('  ✅ PASS: All hamburger toggle buttons, backdrops, and close buttons present');

  // 2. HTTP Server Endpoint Tests
  console.log('\n--- 2. HTTP Server Unified Login Tests ---');
  let serverProcess;
  const PORT = 3098;
  const BASE_URL = `http://localhost:${PORT}`;

  try {
    serverProcess = spawn('node', ['server.js'], {
      env: { ...process.env, PORT: String(PORT) },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    serverProcess.stdout.on('data', (d) => {
      // process.stdout.write(d);
    });

    await new Promise((resolve) => setTimeout(resolve, 3500));

    // Test 1: Admin Login WITHOUT targetPortal
    const adminRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@cca.edu.ph', password: 'admin123' })
    });
    const adminData = await adminRes.json();
    assert.strictEqual(adminRes.status, 200, 'Admin login succeeds without targetPortal');
    assert.strictEqual(adminData.success, true, 'Admin login success is true');
    assert.strictEqual(adminData.user.role, 'admin', 'Admin user role is admin');
    console.log('  ✅ PASS: Admin logs in successfully without targetPortal via unified login');

    // Test 2: Student Login WITHOUT targetPortal
    const studentRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'jaynellan@cca.edu.ph', password: 'student123' })
    });
    const studentData = await studentRes.json();
    assert.strictEqual(studentRes.status, 200, 'Student login succeeds without targetPortal');
    assert.strictEqual(studentData.success, true, 'Student login success is true');
    assert.strictEqual(studentData.user.role, 'student', 'Student user role is student');
    console.log('  ✅ PASS: Student logs in successfully without targetPortal via unified login');

    // Test 3: Invalid credentials
    const badRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@cca.edu.ph', password: 'WrongPassword' })
    });
    assert.strictEqual(badRes.status, 401, 'Bad credentials correctly rejected with 401');
    console.log('  ✅ PASS: Invalid credentials correctly rejected');

    console.log('\n🎉 ALL TESTS IN test_unified_login_and_drawer.js PASSED!');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  } finally {
    if (serverProcess) serverProcess.kill();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
