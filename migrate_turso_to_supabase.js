/**
 * CCA DocTrack - Turso to Supabase Data Migration Tool
 * Christ Centered Academy of Lipa City Inc.
 * 
 * Safely exports existing records from Turso (libSQL/SQLite) and imports them
 * into Supabase PostgreSQL.
 * 
 * Guarantees:
 * 1. Checks for duplicate records before importing.
 * 2. Preserves existing record IDs where possible.
 * 3. Does NOT delete or alter Turso database or records.
 * 4. Never discards data; creates a timestamped local JSON backup as well.
 */

const fs = require('fs');
const path = require('path');
const { createClient: createTursoClient } = require('@libsql/client');
const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lfstpiwrxaxjteucitnp.supabase.co';
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || '';

// Connect to Turso / SQLite source
const localDbPath = path.resolve(__dirname, 'cca_doctrack.db');
const tursoUrl = process.env.TURSO_DATABASE_URL && !process.env.TURSO_DATABASE_URL.includes('your-database-name')
  ? process.env.TURSO_DATABASE_URL
  : `file:${localDbPath}`;

const tursoDb = createTursoClient({
  url: tursoUrl,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function runMigration() {
  console.log('================================================================');
  console.log('🚀 CCA DocTrack: Turso to Supabase Data Migration');
  console.log('================================================================');
  console.log(`Source Database:      ${tursoUrl.includes('file:') ? 'Local SQLite (cca_doctrack.db)' : 'Turso Cloud'}`);
  console.log(`Target Supabase URL:  ${SUPABASE_URL}`);
  console.log('================================================================\n');

  // 1. Export records from Turso
  console.log('📦 Step 1: Exporting existing records from Turso...');

  let users = [];
  let requests = [];
  let reactivations = [];

  try {
    const userRes = await tursoDb.execute('SELECT * FROM users ORDER BY id ASC');
    users = userRes.rows;
    console.log(`   Found ${users.length} user account(s) in Turso.`);
  } catch (err) {
    console.warn('   ⚠️ Could not read users from Turso:', err.message);
  }

  try {
    const reqRes = await tursoDb.execute('SELECT * FROM document_requests ORDER BY id ASC');
    requests = reqRes.rows;
    console.log(`   Found ${requests.length} document request(s) in Turso.`);
  } catch (err) {
    console.warn('   ⚠️ Could not read document_requests from Turso:', err.message);
  }

  try {
    const reactRes = await tursoDb.execute('SELECT * FROM reactivation_requests ORDER BY id ASC');
    reactivations = reactRes.rows;
    console.log(`   Found ${reactivations.length} reactivation request(s) in Turso.`);
  } catch (err) {
    console.warn('   ⚠️ Could not read reactivation_requests from Turso:', err.message);
  }

  // 2. Save full local JSON backup
  const backupData = {
    exportedAt: new Date().toISOString(),
    sourceUrl: tursoUrl,
    users,
    documentRequests: requests,
    reactivationRequests: reactivations
  };

  const backupFilePath = path.resolve(__dirname, `turso_export_backup_${Date.now()}.json`);
  fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf8');
  console.log(`\n💾 Step 2: Saved safety backup to: ${path.basename(backupFilePath)}`);

  // 3. Verify Supabase configuration
  console.log('\n🔍 Step 3: Verifying Supabase target connection...');

  const isPlaceholderKey =
    !SUPABASE_SECRET_KEY ||
    SUPABASE_SECRET_KEY === 'YOUR_NEW_SECRET_KEY' ||
    SUPABASE_SECRET_KEY.includes('your_supabase_secret_key') ||
    SUPABASE_SECRET_KEY.length < 20;

  if (isPlaceholderKey) {
    console.log('\n⚠️ ATTENTION: SUPABASE_SECRET_KEY in .env is currently set to placeholder.');
    console.log('----------------------------------------------------------------');
    console.log('To complete live import into your Supabase project:');
    console.log('1. Go to your Supabase Project Dashboard: https://supabase.com/dashboard/project/lfstpiwrxaxjteucitnp');
    console.log('2. Navigate to Project Settings -> API.');
    console.log('3. Copy your "service_role" secret key (or Project API Key).');
    console.log('4. Open .env and replace YOUR_NEW_SECRET_KEY with your key:');
    console.log('   SUPABASE_SECRET_KEY=eyJhbGciOi...');
    console.log('5. Execute the database schema if not already done:');
    console.log('   Run supabase_schema.sql in Supabase SQL Editor.');
    console.log('6. Re-run: node migrate_turso_to_supabase.js');
    console.log('----------------------------------------------------------------');
    console.log('✅ Exported Turso data is safely preserved in JSON backup. No data was lost.');
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  // Verify connection
  const { error: testErr } = await supabase.from('users').select('id', { count: 'exact', head: true });
  if (testErr) {
    console.error('\n❌ Could not connect to Supabase or tables are missing.');
    console.error('Error details:', testErr.message);
    console.log('\n👉 Make sure you ran supabase_schema.sql in your Supabase SQL Editor first!');
    return;
  }

  console.log('   ✅ Successfully connected to Supabase PostgreSQL!');

  // 4. Import Users
  console.log('\n👥 Step 4: Importing users into Supabase...');
  let usersImported = 0;
  let usersSkipped = 0;

  for (const u of users) {
    try {
      const email = String(u.email || '').trim().toLowerCase();
      // Check duplicate by email
      const { data: existing } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', email);

      if (existing && existing.length > 0) {
        usersSkipped++;
        continue;
      }

      const { error: insertErr } = await supabase.from('users').insert([{
        id: u.id,
        full_name: u.full_name,
        student_id: u.student_id || '',
        email: email,
        password: u.password,
        course: u.course || 'BS Information Technology',
        role: u.role || 'student',
        status: u.status || 'Active',
        created_at: u.created_at || new Date().toISOString()
      }]);

      if (insertErr) {
        console.warn(`   ⚠️ Error importing user ${u.email}:`, insertErr.message);
      } else {
        usersImported++;
      }
    } catch (e) {
      console.warn(`   ⚠️ Exception importing user ${u.email}:`, e.message);
    }
  }
  console.log(`   Users: ${usersImported} imported, ${usersSkipped} already existed (skipped).`);

  // 5. Import Document Requests
  console.log('\n📄 Step 5: Importing document requests into Supabase...');
  let reqsImported = 0;
  let reqsSkipped = 0;

  for (const r of requests) {
    try {
      // Check duplicate by ID
      const { data: existingById } = await supabase
        .from('document_requests')
        .select('id')
        .eq('id', r.id);

      if (existingById && existingById.length > 0) {
        reqsSkipped++;
        continue;
      }

      // Check duplicate by student_id + document_type + date_submitted
      const { data: existingMatch } = await supabase
        .from('document_requests')
        .select('id')
        .eq('student_id', r.student_id)
        .eq('document_type', r.document_type)
        .eq('date_submitted', r.date_submitted);

      if (existingMatch && existingMatch.length > 0) {
        reqsSkipped++;
        continue;
      }

      const { error: reqErr } = await supabase.from('document_requests').insert([{
        id: r.id,
        student_name: r.student_name,
        student_id: r.student_id,
        document_type: r.document_type,
        purpose: r.purpose,
        date_submitted: r.date_submitted,
        status: r.status || 'Pending',
        course: r.course || 'BS Information Technology',
        email: r.email || '',
        pickup_date: r.pickup_date || '',
        created_at: r.created_at || new Date().toISOString()
      }]);

      if (reqErr) {
        console.warn(`   ⚠️ Error importing request ID ${r.id}:`, reqErr.message);
      } else {
        reqsImported++;
      }
    } catch (e) {
      console.warn(`   ⚠️ Exception importing request ID ${r.id}:`, e.message);
    }
  }
  console.log(`   Requests: ${reqsImported} imported, ${reqsSkipped} already existed (skipped).`);

  // 6. Import Reactivation Requests
  console.log('\n🔄 Step 6: Importing reactivation requests into Supabase...');
  let reactImported = 0;
  let reactSkipped = 0;

  for (const rc of reactivations) {
    try {
      const { data: existingReact } = await supabase
        .from('reactivation_requests')
        .select('id')
        .eq('id', rc.id);

      if (existingReact && existingReact.length > 0) {
        reactSkipped++;
        continue;
      }

      const { error: rcErr } = await supabase.from('reactivation_requests').insert([{
        id: rc.id,
        student_id: rc.student_id,
        full_name: rc.full_name,
        email: rc.email,
        reason: rc.reason,
        status: rc.status || 'Pending',
        created_at: rc.created_at || new Date().toISOString()
      }]);

      if (rcErr) {
        console.warn(`   ⚠️ Error importing reactivation request ${rc.id}:`, rcErr.message);
      } else {
        reactImported++;
      }
    } catch (e) {
      console.warn(`   ⚠️ Exception importing reactivation request ${rc.id}:`, e.message);
    }
  }
  console.log(`   Reactivations: ${reactImported} imported, ${reactSkipped} already existed (skipped).`);

  // 7. Migration Summary
  console.log('\n================================================================');
  console.log('🎉 DATA MIGRATION SUMMARY');
  console.log('================================================================');
  console.log(`Users:                  ${usersImported} imported (${usersSkipped} skipped)`);
  console.log(`Document Requests:      ${reqsImported} imported (${reqsSkipped} skipped)`);
  console.log(`Reactivation Requests:  ${reactImported} imported (${reactSkipped} skipped)`);
  console.log(`Safety Backup:          ${path.basename(backupFilePath)}`);
  console.log('Turso Database Status:  Preserved untouched (cca_doctrack.db)');
  console.log('================================================================\n');
}

runMigration().catch((err) => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
