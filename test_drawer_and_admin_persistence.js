const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { initDB, dbUsers } = require('./db');

async function runTests() {
  console.log('🚀 Running Verification: Mobile Drawer Header Layout & Admin Profile Persistence\n');

  // --- 1. HTML Verification ---
  console.log('--- Test 1: HTML Structure in Drawer Header ---');
  const html = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');

  // Student sidebar check
  assert(
    html.includes('<div class="sidebar-profile-info">\n            <h3 class="student-sidebar-name" id="studentSidebarName">Juan Dela Cruz</h3>\n            <p class="student-sidebar-meta" id="studentSidebarMeta">BSIT</p>\n          </div>'),
    'Student sidebar texts must be wrapped inside .sidebar-profile-info column'
  );
  console.log('  ✅ PASS: Student sidebar profile info container is correct');

  // Admin sidebar check
  assert(
    html.includes('<div class="sidebar-profile-info">\n            <h3 class="student-sidebar-name" id="adminSidebarName">---</h3>\n            <p class="student-sidebar-meta" id="adminSidebarMeta">System Administrator</p>\n            <div class="admin-status-online">\n              <span class="online-dot"></span>\n              <span>Online</span>\n            </div>\n          </div>'),
    'Admin sidebar texts and online badge must be wrapped inside .sidebar-profile-info column'
  );
  console.log('  ✅ PASS: Admin sidebar profile info container (name, meta, online badge) is correct');

  // --- 2. CSS Verification ---
  console.log('\n--- Test 2: CSS Styles for Mobile Drawer Header ---');
  const css = fs.readFileSync(path.join(__dirname, 'public', 'style.css'), 'utf8');

  assert(css.includes('.sidebar-profile-info {'), 'Base .sidebar-profile-info style defined');
  assert(css.includes('padding-right: 52px !important;'), 'Clearance for close button with padding-right: 52px');
  assert(css.includes('.student-sidebar-profile .sidebar-profile-info {'), 'Responsive column layout for profile info defined');
  assert(css.includes('.student-sidebar-profile .sidebar-profile-info .admin-status-online {'), 'Status online margin and alignment styled');
  console.log('  ✅ PASS: Mobile drawer CSS flexbox column & clearance styles verified');

  // --- 3. Database & Profile Route Verification ---
  console.log('\n--- Test 3: Admin Profile Persistence in Supabase ---');
  await initDB();
  const admin = await dbUsers.getAdminUser();
  assert(admin && admin.role === 'admin', 'Found admin user in Supabase');
  console.log(`  Current Admin in DB: ${admin.full_name} (${admin.email})`);

  // Test numeric ID lookup via dbUsers.findByEmailOrStudentId
  const foundById = await dbUsers.findByEmailOrStudentId(String(admin.id));
  assert(foundById && foundById.id === admin.id, 'Lookup by numeric ID succeeded');
  console.log('  ✅ PASS: dbUsers.findByEmailOrStudentId supports numeric user ID');

  // Test lookup via alias 'admin'
  const foundByAlias = await dbUsers.findByEmailOrStudentId('admin');
  assert(foundByAlias && foundByAlias.role === 'admin', 'Lookup by alias admin succeeded');
  console.log('  ✅ PASS: dbUsers.findByEmailOrStudentId supports "admin" alias');

  console.log('\n🎉 ALL DRAWER LAYOUT & ADMIN PROFILE TESTS PASSED!');
}

runTests().then(() => process.exit(0)).catch(err => {
  console.error('\n❌ Test Failure:', err.message);
  process.exit(1);
});
