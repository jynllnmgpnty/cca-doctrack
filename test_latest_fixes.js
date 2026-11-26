const { spawn } = require('child_process');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const PORT = 3099;
process.env.PORT = PORT;

async function run() {
  console.log('Testing latest user requirements fixes...');
  let serverProcess;

  try {
    // Start local server on test port
    serverProcess = spawn('node', ['server.js'], {
      env: { ...process.env, PORT },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    serverProcess.stdout.on('data', d => process.stdout.write(d));
    serverProcess.stderr.on('data', d => process.stderr.write(d));

    // Wait for server ready
    await new Promise((resolve) => setTimeout(resolve, 3500));

    const baseUrl = `http://localhost:${PORT}`;

    // 1. Institutional Email Requirement (@cca.edu.ph)
    console.log('\n--- 1. Institutional Email Requirement (@cca.edu.ph) ---');
    const nonCcaRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Non CCA Student',
        studentId: '24-99881',
        email: 'student@gmail.com',
        password: 'PassWord123',
        confirmPassword: 'PassWord123',
        role: 'student'
      })
    });
    const nonCcaData = await nonCcaRes.json();
    assert(nonCcaRes.status === 400, 'Non-@cca.edu.ph email is rejected with 400 Bad Request');
    assert(nonCcaData.message.includes('Institutional email') || nonCcaData.errors?.some(e => e.includes('@cca.edu.ph')), 'Error message specifies @cca.edu.ph required');
    console.log('  ✅ PASS: Non-@cca.edu.ph email rejected');

    const uniqueId = Date.now();
    const validCcaEmail = `validstudent_${uniqueId}@cca.edu.ph`;
    const validStudentId = `24-${Math.floor(10000 + Math.random() * 89999)}`;
    const validRegRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Valid CCA Student',
        studentId: validStudentId,
        email: validCcaEmail,
        password: 'ValidPassword123',
        confirmPassword: 'ValidPassword123',
        role: 'student'
      })
    });
    assert(validRegRes.status === 201, 'Valid @cca.edu.ph registration succeeds with 201 Created');
    console.log('  ✅ PASS: Valid @cca.edu.ph registration succeeded');

    // 2. Duplicate Account Checks
    console.log('\n--- 2. Duplicate Account Checks ---');
    const dupEmailRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Duplicate Email Student',
        studentId: '24-00000',
        email: validCcaEmail,
        password: 'ValidPassword123',
        confirmPassword: 'ValidPassword123',
        role: 'student'
      })
    });
    const dupEmailData = await dupEmailRes.json();
    assert(dupEmailRes.status === 400, 'Duplicate email registration rejected with 400');
    assert(dupEmailData.message.includes('already exists') || dupEmailData.message.includes('already registered'), 'Duplicate email returns friendly exists message');
    console.log('  ✅ PASS: Duplicate email rejected');

    const dupIdRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Duplicate ID Student',
        studentId: validStudentId,
        email: `another_${uniqueId}@cca.edu.ph`,
        password: 'ValidPassword123',
        confirmPassword: 'ValidPassword123',
        role: 'student'
      })
    });
    const dupIdData = await dupIdRes.json();
    assert(dupIdRes.status === 400, 'Duplicate Student ID registration rejected with 400');
    assert(dupIdData.message.includes('already exists') || dupIdData.message.includes('already registered'), 'Duplicate ID returns friendly exists message');
    console.log('  ✅ PASS: Duplicate student ID rejected');

    // 3. Login Logic with Correct Password
    console.log('\n--- 3. Login Logic with Correct Password ---');
    // Newly registered user login
    const newLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: validCcaEmail,
        password: 'ValidPassword123',
        targetPortal: 'student'
      })
    });
    assert(newLoginRes.status === 200, 'Newly registered student logs in successfully with correct password');
    console.log('  ✅ PASS: Newly registered student login succeeded');

    // Login with Student ID
    const idLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: validStudentId,
        password: 'ValidPassword123',
        targetPortal: 'student'
      })
    });
    assert(idLoginRes.status === 200, 'Login using Student ID and correct password succeeds');
    console.log('  ✅ PASS: Login using Student ID succeeded');

    // Admin login with alias 'admin'
    const adminAliasRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin',
        password: 'admin123',
        targetPortal: 'admin'
      })
    });
    assert(adminAliasRes.status === 200, 'Admin login with "admin" shortcut and admin123 succeeds');
    console.log('  ✅ PASS: Admin login with "admin" succeeded');

    // Admin login with email
    const adminEmailRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@cca.edu.ph',
        password: 'admin123',
        targetPortal: 'admin'
      })
    });
    assert(adminEmailRes.status === 200, 'Admin login with "admin@cca.edu.ph" and admin123 succeeds');
    console.log('  ✅ PASS: Admin login with "admin@cca.edu.ph" succeeded');

    // Student default account login
    const studentDefaultRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student@cca.edu.ph',
        password: 'student123',
        targetPortal: 'student'
      })
    });
    assert(studentDefaultRes.status === 200, 'Student login with "student@cca.edu.ph" and student123 succeeds');
    console.log('  ✅ PASS: Student default login succeeded');

    // 4. UI Text and Responsiveness Checks
    console.log('\n--- 4. UI Text and Responsiveness Checks ---');
    const html = fs.readFileSync('public/index.html', 'utf8');
    const css = fs.readFileSync('public/style.css', 'utf8');
    const js = fs.readFileSync('public/script.js', 'utf8');

    // Register Indicator
    assert(html.includes('id="authTabRegister">Register</button>'), 'authTabRegister displays "Register"');
    assert(html.includes('id="registerBtnLabel">Register</span>'), 'registerBtnLabel displays "Register"');
    assert(js.includes("elements.registerBtnLabel.textContent = 'Register'"), 'script updates registerBtnLabel to "Register"');
    console.log('  ✅ PASS: Register tab and button indicators display "Register"');

    // Mobile X Close Button & Overlay
    assert(!css.includes('.auth-modal-overlay {\n    padding: 8px !important;\n    overflow-y: auto !important;\n    overflow-x: hidden !important;\n    -webkit-overflow-scrolling: touch !important;\n    display: flex !important;'), 'Removed display: flex !important on .auth-modal-overlay so .hidden can close it');
    assert(css.includes('.auth-modal-overlay.hidden') && css.includes('display: none !important'), '.auth-modal-overlay.hidden has display: none !important');
    assert(css.includes('.modal-close-btn') && css.includes('z-index: 99999 !important'), '.modal-close-btn has top-level z-index: 99999');
    console.log('  ✅ PASS: Mobile auth modal close button and overlay CSS verified');

    // Logout Button Text Centered
    assert(css.includes('#btnConfirmLogoutModal') && css.includes('justify-content: center !important') && css.includes('text-align: center !important'), 'Logout confirm button has centered text');
    assert(css.includes('#btnCancelLogoutModal') && css.includes('justify-content: center !important'), 'Logout cancel button has centered text');
    console.log('  ✅ PASS: Logout modal buttons text centered');

    // 5. Mobile Phone Responsiveness Hamburger Bar Checks
    console.log('\n--- 5. Mobile Phone Responsiveness Hamburger Bar Checks ---');
    assert(html.includes('id="btnLandingNavToggle"'), 'Landing page topbar contains hamburger toggle');
    assert(html.includes('id="landingMobileMenu"'), 'Landing page contains mobile navigation menu drawer');
    assert(html.includes('id="mobileStudentToggle"'), 'Student portal topbar contains hamburger button');
    assert(html.includes('id="mobileStudentSidebarClose"'), 'Student portal sidebar contains close button');
    assert(html.includes('id="studentSidebarBackdrop"'), 'Student portal contains sidebar backdrop');
    assert(html.includes('id="mobileAdminToggle"'), 'Admin portal topbar contains hamburger button');
    assert(html.includes('id="mobileAdminSidebarClose"'), 'Admin portal sidebar contains close button');
    assert(html.includes('id="adminSidebarBackdrop"'), 'Admin portal contains sidebar backdrop');

    assert(css.includes('.hamburger-btn'), 'CSS defines .hamburger-btn');
    assert(css.includes('.student-ref-sidebar.open'), 'CSS defines .student-ref-sidebar.open off-canvas drawer');
    assert(css.includes('.admin-ref-sidebar.open'), 'CSS defines .admin-ref-sidebar.open off-canvas drawer');
    assert(css.includes('.sidebar-backdrop.active'), 'CSS defines .sidebar-backdrop.active overlay');
    assert(css.includes('.landing-mobile-menu'), 'CSS defines .landing-mobile-menu');

    assert(js.includes("document.getElementById('mobileStudentToggle')?.addEventListener('click'"), 'JS binds mobileStudentToggle');
    assert(js.includes("document.getElementById('mobileAdminToggle')?.addEventListener('click'"), 'JS binds mobileAdminToggle');
    assert(js.includes("document.getElementById('btnLandingNavToggle')"), 'JS binds landing hamburger toggle');
    console.log('  ✅ PASS: All navbars in phone responsiveness configured with hamburger bar');

    console.log('\n🎉 ALL LATEST FIX TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  } finally {
    if (serverProcess) serverProcess.kill();
  }
}

run().catch(e => {
  console.error('Test execution error:', e);
  process.exit(1);
});
