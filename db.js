const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

/**
 * Determine database configuration
 * Supports Turso Cloud (libSQL) via URL and Auth Token,
 * and falls back to a local SQLite file (file:cca_doctrack.db) for development/offline testing.
 */
function getClientConfig() {
  const envUrl = process.env.TURSO_DATABASE_URL;
  const envToken = process.env.TURSO_AUTH_TOKEN;

  const isPlaceholder = !envUrl ||
    envUrl.includes('your-database-name') ||
    envUrl.includes('your-org.turso.io');

  if (envUrl && !isPlaceholder) {
    return {
      url: envUrl,
      authToken: envToken && !envToken.includes('your_turso_auth_token') ? envToken : undefined,
      isRemote: true
    };
  }

  // Local fallback database file
  const localDbPath = path.resolve(__dirname, 'cca_doctrack.db');
  return {
    url: `file:${localDbPath}`,
    authToken: undefined,
    isRemote: false
  };
}

const dbConfig = getClientConfig();

// Initialize the @libsql/client database client
const db = createClient({
  url: dbConfig.url,
  authToken: dbConfig.authToken
});

/**
 * Format a database row to match the JSON response schema expected by the frontend
 */
function formatRequest(row) {
  if (!row) return null;
  return {
    _id: String(row.id),
    id: row.id,
    studentName: row.student_name,
    studentId: row.student_id,
    documentType: row.document_type,
    purpose: row.purpose,
    dateSubmitted: row.date_submitted,
    status: row.status,
    course: row.course || 'BS Information Technology',
    email: row.email || '',
    pickupDate: row.pickup_date || '',
    pickup_date: row.pickup_date || '',
    createdAt: row.created_at || row.date_submitted
  };
}

/**
 * Seed initial administrative and student accounts into the users table
 */
async function seedDefaultAccounts() {
  try {
    const adminCheck = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: ['admin@cca.edu.ph']
    });

    if (adminCheck.rows.length === 0) {
      const hashedAdminPw = await bcrypt.hash('admin123', 10);
      await db.execute({
        sql: `INSERT INTO users (full_name, student_id, email, password, course, role)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          'Office of the College Registrar',
          'ADMIN-001',
          'admin@cca.edu.ph',
          hashedAdminPw,
          'Registrar Staff',
          'admin'
        ]
      });
      console.log('✅ Seeded default registrar administrator: admin@cca.edu.ph');
    }

    const studentCheck = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: ['jaynellan@cca.edu.ph']
    });

    if (studentCheck.rows.length === 0) {
      const hashedStudentPw = await bcrypt.hash('student123', 10);
      await db.execute({
        sql: `INSERT INTO users (full_name, student_id, email, password, course, role)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          'Jaynellan Almary O. Magpantay',
          '23-67894',
          'jaynellan@cca.edu.ph',
          hashedStudentPw,
          'BS Information Technology',
          'student'
        ]
      });
      console.log('✅ Seeded default student account: jaynellan@cca.edu.ph');
    }
  } catch (err) {
    console.warn('⚠️ Note on account seeding:', err.message);
  }
}

/**
 * Seed initial sample requests if table is empty
 */
async function seedDefaultRequests() {
  try {
    const countResult = await db.execute('SELECT COUNT(*) as count FROM document_requests');
    const count = countResult.rows[0]?.count || 0;

    if (count === 0) {
      const sampleRequests = [
        {
          studentName: 'Jaynellan Almary O. Magpantay',
          studentId: '23-67894',
          documentType: 'Transcript of Records',
          purpose: 'Scholarship Application Requirement',
          dateSubmitted: '2026-11-20',
          status: 'Processing',
          course: 'BS Information Technology',
          email: 'jaynellan@cca.edu.ph'
        },
        {
          studentName: 'Jaynellan Almary O. Magpantay',
          studentId: '23-67894',
          documentType: 'Certificate of Enrollment',
          purpose: 'CHED Tertiary Education Subsidy',
          dateSubmitted: '2026-11-18',
          status: 'Completed',
          course: 'BS Information Technology',
          email: 'jaynellan@cca.edu.ph'
        },
        {
          studentName: 'Juan Dela Cruz',
          studentId: '23-10021',
          documentType: 'Good Moral Certificate',
          purpose: 'Internship and Employment Application',
          dateSubmitted: '2026-11-21',
          status: 'Pending',
          course: 'BS Information Technology',
          email: 'jdelacruz@cca.edu.ph'
        }
      ];

      for (const req of sampleRequests) {
        await db.execute({
          sql: `INSERT INTO document_requests (student_name, student_id, document_type, purpose, date_submitted, status, course, email)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            req.studentName,
            req.studentId,
            req.documentType,
            req.purpose,
            req.dateSubmitted,
            req.status,
            req.course,
            req.email
          ]
        });
      }
      console.log('✅ Seeded sample student document requests.');
    }
  } catch (err) {
    console.warn('⚠️ Note on request seeding:', err.message);
  }
}

/**
 * Initialize database tables automatically
 */
async function initDB() {
  try {
    // 1. Create document_requests table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS document_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_name TEXT NOT NULL,
        student_id TEXT NOT NULL,
        document_type TEXT NOT NULL,
        purpose TEXT NOT NULL,
        date_submitted TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Pending',
        course TEXT DEFAULT 'BS Information Technology',
        email TEXT DEFAULT '',
        pickup_date TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure pickup_date column exists for existing tables
    try {
      await db.execute("ALTER TABLE document_requests ADD COLUMN pickup_date TEXT DEFAULT ''");
    } catch (e) {
      // Column may already exist
    }

    // 2. Create users table for authentication
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        student_id TEXT DEFAULT '',
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        course TEXT DEFAULT 'BS Information Technology',
        role TEXT DEFAULT 'student',
        status TEXT DEFAULT 'Active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure status column exists in users table
    try {
      await db.execute("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'Active'");
    } catch (e) {
      // Column may already exist
    }

    // 3. Create reactivation_requests table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS reactivation_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        reason TEXT NOT NULL,
        status TEXT DEFAULT 'Pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Seed default accounts & demo requests
    await seedDefaultAccounts();
    await seedDefaultRequests();

    console.log(`✅ Turso libSQL database ready! [Mode: ${dbConfig.isRemote ? 'Remote Turso Cloud' : 'Local libSQL File'}]`);
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Turso database tables:', error.message);
    throw error;
  }
}

/**
 * Verify database health/connectivity
 */
async function checkHealth() {
  try {
    await db.execute('SELECT 1 as ping');
    return {
      connected: true,
      mode: dbConfig.isRemote ? 'Turso Cloud (Remote)' : 'libSQL (Local File)',
      url: dbConfig.isRemote ? dbConfig.url.split('@').pop() : 'file:cca_doctrack.db'
    };
  } catch (err) {
    return {
      connected: false,
      error: err.message
    };
  }
}

module.exports = {
  db,
  dbConfig,
  formatRequest,
  initDB,
  checkHealth,
  seedDefaultAccounts
};
