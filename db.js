/**
 * CCA DocTrack - Database Layer & Supabase Adapter
 * Christ Centered Academy of Lipa City Inc.
 * 
 * Supports Supabase PostgreSQL as the primary database engine using @supabase/supabase-js.
 * Preserves existing response schemas, field mappings, and fallback support for Turso/SQLite
 * so development and offline execution never break.
 */

const { getSupabaseClient, isSupabaseConfigured, checkSupabaseHealth, SUPABASE_URL } = require('./supabase');
const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

// Determine whether Supabase is configured
const useSupabase = isSupabaseConfigured();

// Initialize Turso client (retained as safety fallback per migration requirements)
function getTursoConfig() {
  const envUrl = process.env.TURSO_DATABASE_URL;
  const envToken = process.env.TURSO_AUTH_TOKEN;
  const isPlaceholder = !envUrl || envUrl.includes('your-database-name') || envUrl.includes('your-org.turso.io');

  if (envUrl && !isPlaceholder) {
    return {
      url: envUrl,
      authToken: envToken && !envToken.includes('your_turso_auth_token') ? envToken : undefined,
      isRemote: true
    };
  }

  const localDbPath = path.resolve(__dirname, 'cca_doctrack.db');
  return {
    url: `file:${localDbPath}`,
    authToken: undefined,
    isRemote: false
  };
}

const tursoConfig = getTursoConfig();
const tursoDb = createClient({
  url: tursoConfig.url,
  authToken: tursoConfig.authToken
});

/**
 * Maps database row (snake_case PostgreSQL/SQLite) to frontend camelCase properties
 * Maps:
 *   student_name  -> studentName
 *   student_id    -> studentId
 *   document_type -> documentType
 *   date_submitted -> dateSubmitted
 *   pickup_date   -> pickupDate
 *   created_at    -> createdAt
 */
function formatRequest(row) {
  if (!row) return null;
  const numId = typeof row.id === 'string' ? parseInt(row.id, 10) || row.id : row.id;
  return {
    _id: String(row.id),
    id: numId,
    studentName: row.student_name || row.studentName || '',
    studentId: row.student_id || row.studentId || '',
    documentType: row.document_type || row.documentType || '',
    purpose: row.purpose || '',
    dateSubmitted: row.date_submitted || row.dateSubmitted || '',
    status: row.status || 'Pending',
    course: row.course || 'BS Information Technology',
    email: row.email || '',
    pickupDate: row.pickup_date || row.pickupDate || '',
    pickup_date: row.pickup_date || row.pickupDate || '',
    createdAt: row.created_at || row.createdAt || row.date_submitted || row.dateSubmitted
  };
}

// ==============================================================================
// Document Requests Operations
// ==============================================================================
const dbRequests = {
  /**
   * Retrieve all requests, optionally filtered by studentId
   */
  async getAll(studentId) {
    if (useSupabase) {
      const client = getSupabaseClient();
      let query = client.from('document_requests').select('*').order('id', { ascending: false });
      if (studentId && studentId.trim()) {
        query = query.eq('student_id', studentId.trim());
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(formatRequest);
    } else {
      let result;
      if (studentId && studentId.trim()) {
        result = await tursoDb.execute({
          sql: 'SELECT * FROM document_requests WHERE student_id = ? ORDER BY id DESC',
          args: [studentId.trim()]
        });
      } else {
        result = await tursoDb.execute('SELECT * FROM document_requests ORDER BY id DESC');
      }
      return result.rows.map(formatRequest);
    }
  },

  /**
   * Retrieve one request by numeric ID
   */
  async getById(id) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId <= 0) return null;

    if (useSupabase) {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('document_requests')
        .select('*')
        .eq('id', numericId);
      if (error) throw error;
      return data && data.length > 0 ? formatRequest(data[0]) : null;
    } else {
      const result = await tursoDb.execute({
        sql: 'SELECT * FROM document_requests WHERE id = ?',
        args: [numericId]
      });
      return result.rows.length > 0 ? formatRequest(result.rows[0]) : null;
    }
  },

  /**
   * Insert a new document request
   */
  async create(payload) {
    const studentName = payload.studentName.trim();
    const studentId = payload.studentId.trim();
    const documentType = payload.documentType.trim();
    const purpose = payload.purpose.trim();
    const dateSubmitted = payload.dateSubmitted;
    const course = payload.course ? payload.course.trim() : 'BS Information Technology';
    const email = payload.email ? payload.email.trim() : '';

    if (useSupabase) {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('document_requests')
        .insert([{
          student_name: studentName,
          student_id: studentId,
          document_type: documentType,
          purpose: purpose,
          date_submitted: dateSubmitted,
          status: 'Pending',
          course: course,
          email: email,
          pickup_date: ''
        }])
        .select();

      if (error) throw error;
      return formatRequest(data[0]);
    } else {
      const insertResult = await tursoDb.execute({
        sql: `INSERT INTO document_requests (student_name, student_id, document_type, purpose, date_submitted, status, course, email)
              VALUES (?, ?, ?, ?, ?, 'Pending', ?, ?)`,
        args: [studentName, studentId, documentType, purpose, dateSubmitted, course, email]
      });

      const fetchResult = await tursoDb.execute({
        sql: 'SELECT * FROM document_requests WHERE id = ?',
        args: [insertResult.lastInsertRowid]
      });
      return formatRequest(fetchResult.rows[0]);
    }
  },

  /**
   * Update request status and optional pickup date
   */
  async updateStatus(id, status, pickupDate) {
    let numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId <= 0) {
      const extracted = String(id).replace(/\D/g, '');
      if (extracted) numericId = parseInt(extracted, 10);
    }
    if (isNaN(numericId) || numericId <= 0) return null;

    if (useSupabase) {
      const client = getSupabaseClient();
      // Check exists
      const { data: existing, error: checkErr } = await client
        .from('document_requests')
        .select('id')
        .eq('id', numericId);
      if (checkErr) throw checkErr;
      if (!existing || existing.length === 0) return null;

      const updateData = { status };
      if (pickupDate !== undefined && pickupDate !== null) {
        updateData.pickup_date = String(pickupDate).trim();
      }

      const { data, error } = await client
        .from('document_requests')
        .update(updateData)
        .eq('id', numericId)
        .select();

      if (error) throw error;
      return data && data.length > 0 ? formatRequest(data[0]) : null;
    } else {
      const checkResult = await tursoDb.execute({
        sql: 'SELECT id FROM document_requests WHERE id = ?',
        args: [numericId]
      });
      if (checkResult.rows.length === 0) return null;

      if (pickupDate !== undefined && pickupDate !== null) {
        await tursoDb.execute({
          sql: 'UPDATE document_requests SET status = ?, pickup_date = ? WHERE id = ?',
          args: [status, String(pickupDate).trim(), numericId]
        });
      } else {
        await tursoDb.execute({
          sql: 'UPDATE document_requests SET status = ? WHERE id = ?',
          args: [status, numericId]
        });
      }

      const updatedResult = await tursoDb.execute({
        sql: 'SELECT * FROM document_requests WHERE id = ?',
        args: [numericId]
      });
      return formatRequest(updatedResult.rows[0]);
    }
  },

  /**
   * Delete request by ID (for cleanup/testing)
   */
  async delete(id) {
    const numericId = parseInt(id, 10);
    if (useSupabase) {
      const client = getSupabaseClient();
      const { error } = await client.from('document_requests').delete().eq('id', numericId);
      if (error) throw error;
      return true;
    } else {
      await tursoDb.execute({
        sql: 'DELETE FROM document_requests WHERE id = ?',
        args: [numericId]
      });
      return true;
    }
  }
};

// ==============================================================================
// User Authentication & Management Operations
// ==============================================================================
const dbUsers = {
  /**
   * Find user by email OR student_id (case-insensitive)
   */
  async findByEmailOrStudentId(identifier) {
    if (!identifier) return null;
    const target = identifier.trim().toLowerCase();

    if (useSupabase) {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('users')
        .select('*')
        .or(`email.ilike.${target},student_id.ilike.${target}`);
      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    } else {
      const result = await tursoDb.execute({
        sql: 'SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(student_id) = ?',
        args: [target, target]
      });
      return result.rows.length > 0 ? result.rows[0] : null;
    }
  },

  /**
   * Find existing user for duplicate checking during registration
   */
  async findDuplicate(email, studentId) {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedStudentId = studentId ? studentId.trim().toLowerCase() : '';

    if (useSupabase) {
      const client = getSupabaseClient();
      let query = client.from('users').select('id, email, student_id');
      if (normalizedStudentId) {
        query = query.or(`email.ilike.${normalizedEmail},student_id.ilike.${normalizedStudentId}`);
      } else {
        query = query.ilike('email', normalizedEmail);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } else {
      const result = await tursoDb.execute({
        sql: 'SELECT id, email, student_id FROM users WHERE LOWER(email) = ? OR (student_id != "" AND LOWER(student_id) = ?)',
        args: [normalizedEmail, normalizedStudentId]
      });
      return result.rows;
    }
  },

  /**
   * Create a new user account
   */
  async create(payload) {
    const fullName = payload.fullName.trim();
    const studentId = payload.studentId ? payload.studentId.trim() : '';
    const email = payload.email.trim().toLowerCase();
    const password = payload.password;
    const course = payload.course ? payload.course.trim() : 'BS Information Technology';
    const role = payload.role === 'admin' ? 'admin' : 'student';

    if (useSupabase) {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('users')
        .insert([{
          full_name: fullName,
          student_id: studentId,
          email: email,
          password: password,
          course: course,
          role: role,
          status: 'Active'
        }])
        .select('id, full_name, student_id, email, course, role, status, created_at');

      if (error) throw error;
      const user = data[0];
      return {
        id: user.id,
        fullName: user.full_name,
        studentId: user.student_id,
        email: user.email,
        course: user.course,
        role: user.role
      };
    } else {
      const insertResult = await tursoDb.execute({
        sql: `INSERT INTO users (full_name, student_id, email, password, course, role)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [fullName, studentId, email, password, course, role]
      });

      const createdUserResult = await tursoDb.execute({
        sql: 'SELECT id, full_name, student_id, email, course, role FROM users WHERE id = ?',
        args: [insertResult.lastInsertRowid]
      });

      const user = createdUserResult.rows[0];
      return {
        id: user.id,
        fullName: user.full_name,
        studentId: user.student_id,
        email: user.email,
        course: user.course,
        role: user.role
      };
    }
  },

  /**
   * Update user password
   */
  async updatePassword(userId, hashedPassword) {
    if (useSupabase) {
      const client = getSupabaseClient();
      const { error } = await client
        .from('users')
        .update({ password: hashedPassword })
        .eq('id', userId);
      if (error) throw error;
      return true;
    } else {
      await tursoDb.execute({
        sql: 'UPDATE users SET password = ? WHERE id = ?',
        args: [hashedPassword, userId]
      });
      return true;
    }
  },

  /**
   * Get all registered students (role != 'admin')
   */
  async getStudents() {
    if (useSupabase) {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('users')
        .select('id, full_name, student_id, email, course, role, status, created_at')
        .neq('role', 'admin')
        .order('id', { ascending: true });
      if (error) throw error;
      return (data || []).map(r => ({
        id: r.id,
        name: r.full_name,
        studentId: r.student_id,
        email: r.email,
        course: r.course || 'BS Information Technology',
        status: r.status || 'Active',
        createdAt: r.created_at
      }));
    } else {
      const result = await tursoDb.execute(
        "SELECT id, full_name, student_id, email, course, role, status, created_at FROM users WHERE role != 'admin' ORDER BY id ASC"
      );
      return result.rows.map(r => ({
        id: r.id,
        name: r.full_name,
        studentId: r.student_id,
        email: r.email,
        course: r.course || 'BS Information Technology',
        status: r.status || 'Active',
        createdAt: r.created_at
      }));
    }
  },

  /**
   * Update student account status (Active / Inactive)
   */
  async updateStatus(identifier, status) {
    const target = identifier.trim().toLowerCase();
    const numId = parseInt(identifier, 10);

    if (useSupabase) {
      const client = getSupabaseClient();
      let query = client.from('users').select('id, full_name, student_id, email');
      if (!isNaN(numId) && numId > 0) {
        query = query.or(`student_id.ilike.${target},email.ilike.${target},id.eq.${numId}`);
      } else {
        query = query.or(`student_id.ilike.${target},email.ilike.${target}`);
      }
      const { data: users, error: findErr } = await query;
      if (findErr) throw findErr;
      if (!users || users.length === 0) return null;

      const user = users[0];
      const { error: updErr } = await client
        .from('users')
        .update({ status })
        .eq('id', user.id);
      if (updErr) throw updErr;

      if (status === 'Active') {
        try {
          await client
            .from('reactivation_requests')
            .update({ status: 'Approved' })
            .ilike('student_id', user.student_id);
        } catch (e) {}
      }

      return {
        studentId: user.student_id,
        status: status
      };
    } else {
      const checkUser = await tursoDb.execute({
        sql: 'SELECT id, full_name, student_id, email FROM users WHERE LOWER(student_id) = ? OR LOWER(email) = ? OR id = ?',
        args: [target, target, target]
      });

      if (checkUser.rows.length === 0) return null;
      const user = checkUser.rows[0];

      await tursoDb.execute({
        sql: 'UPDATE users SET status = ? WHERE LOWER(student_id) = ? OR LOWER(email) = ? OR id = ?',
        args: [status, target, target, target]
      });

      if (status === 'Active') {
        try {
          await tursoDb.execute({
            sql: "UPDATE reactivation_requests SET status = 'Approved' WHERE LOWER(student_id) = ? OR LOWER(email) = ?",
            args: [target, target]
          });
        } catch (err) {}
      }

      return {
        studentId: user.student_id,
        status: status
      };
    }
  }
};

// ==============================================================================
// Reactivation Requests Operations
// ==============================================================================
const dbReactivations = {
  /**
   * Submit a student account reactivation request
   */
  async create(payload) {
    if (useSupabase) {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('reactivation_requests')
        .insert([{
          student_id: payload.studentId,
          full_name: payload.fullName,
          email: payload.email,
          reason: payload.reason.trim(),
          status: 'Pending'
        }])
        .select();
      if (error) throw error;
      return data[0];
    } else {
      const result = await tursoDb.execute({
        sql: 'INSERT INTO reactivation_requests (student_id, full_name, email, reason, status) VALUES (?, ?, ?, ?, ?)',
        args: [payload.studentId, payload.fullName, payload.email, payload.reason.trim(), 'Pending']
      });
      return { id: result.lastInsertRowid, ...payload, status: 'Pending' };
    }
  },

  /**
   * Get all reactivation requests
   */
  async getAll() {
    if (useSupabase) {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('reactivation_requests')
        .select('*')
        .order('id', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      const result = await tursoDb.execute('SELECT * FROM reactivation_requests ORDER BY id DESC');
      return result.rows;
    }
  }
};

// ==============================================================================
// Seeding & Table Initialization
// ==============================================================================
async function seedDefaultAccounts() {
  try {
    if (useSupabase) {
      const client = getSupabaseClient();
      // Check admin account
      const { data: adminExists } = await client
        .from('users')
        .select('id')
        .eq('email', 'admin@cca.edu.ph');

      if (!adminExists || adminExists.length === 0) {
        const hashedAdminPw = await bcrypt.hash('admin123', 10);
        await client.from('users').insert([{
          full_name: 'Office of the College Registrar',
          student_id: 'ADMIN-001',
          email: 'admin@cca.edu.ph',
          password: hashedAdminPw,
          course: 'Registrar Staff',
          role: 'admin',
          status: 'Active'
        }]);
        console.log('✅ [Supabase] Seeded default administrator: admin@cca.edu.ph');
      }

      // Check student account
      const { data: studentExists } = await client
        .from('users')
        .select('id')
        .eq('email', 'jaynellan@cca.edu.ph');

      if (!studentExists || studentExists.length === 0) {
        const hashedStudentPw = await bcrypt.hash('student123', 10);
        await client.from('users').insert([{
          full_name: 'Jaynellan Almary O. Magpantay',
          student_id: '23-67894',
          email: 'jaynellan@cca.edu.ph',
          password: hashedStudentPw,
          course: 'BS Information Technology',
          role: 'student',
          status: 'Active'
        }]);
        console.log('✅ [Supabase] Seeded default student: jaynellan@cca.edu.ph');
      }
    } else {
      const adminCheck = await tursoDb.execute({
        sql: 'SELECT id FROM users WHERE email = ?',
        args: ['admin@cca.edu.ph']
      });

      if (adminCheck.rows.length === 0) {
        const hashedAdminPw = await bcrypt.hash('admin123', 10);
        await tursoDb.execute({
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
        console.log('✅ [Local/Turso] Seeded default registrar administrator: admin@cca.edu.ph');
      }

      const studentCheck = await tursoDb.execute({
        sql: 'SELECT id FROM users WHERE email = ?',
        args: ['jaynellan@cca.edu.ph']
      });

      if (studentCheck.rows.length === 0) {
        const hashedStudentPw = await bcrypt.hash('student123', 10);
        await tursoDb.execute({
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
        console.log('✅ [Local/Turso] Seeded default student account: jaynellan@cca.edu.ph');
      }
    }
  } catch (err) {
    console.warn('⚠️ Seeding notice:', err.message);
  }
}

async function seedDefaultRequests() {
  try {
    if (useSupabase) {
      const client = getSupabaseClient();
      const { count, error } = await client
        .from('document_requests')
        .select('*', { count: 'exact', head: true });

      if (!error && (count === 0 || count === null)) {
        await client.from('document_requests').insert([
          {
            student_name: 'Jaynellan Almary O. Magpantay',
            student_id: '23-67894',
            document_type: 'Transcript of Records',
            purpose: 'Scholarship Application Requirement',
            date_submitted: '2026-11-20',
            status: 'Processing',
            course: 'BS Information Technology',
            email: 'jaynellan@cca.edu.ph'
          },
          {
            student_name: 'Jaynellan Almary O. Magpantay',
            student_id: '23-67894',
            document_type: 'Certificate of Enrollment',
            purpose: 'CHED Tertiary Education Subsidy',
            date_submitted: '2026-11-18',
            status: 'Completed',
            course: 'BS Information Technology',
            email: 'jaynellan@cca.edu.ph'
          },
          {
            student_name: 'Juan Dela Cruz',
            student_id: '23-10021',
            document_type: 'Good Moral Certificate',
            purpose: 'Internship and Employment Application',
            date_submitted: '2026-11-21',
            status: 'Pending',
            course: 'BS Information Technology',
            email: 'jdelacruz@cca.edu.ph'
          }
        ]);
        console.log('✅ [Supabase] Seeded sample student document requests.');
      }
    } else {
      const countResult = await tursoDb.execute('SELECT COUNT(*) as count FROM document_requests');
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
          await tursoDb.execute({
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
        console.log('✅ [Local/Turso] Seeded sample student document requests.');
      }
    }
  } catch (err) {
    console.warn('⚠️ Request seeding notice:', err.message);
  }
}

/**
 * Initialize database tables
 */
async function initDB() {
  if (useSupabase) {
    console.log(`📡 Initializing Supabase PostgreSQL connection [${SUPABASE_URL}]...`);
    const health = await checkSupabaseHealth();
    if (health.connected) {
      console.log('✅ Supabase PostgreSQL connected successfully!');
      await seedDefaultAccounts();
      await seedDefaultRequests();
      return true;
    } else {
      console.warn(`⚠️ Supabase check notice: ${health.error}`);
      console.warn('⚡ Falling back to local database engine so your app continues operating.');
    }
  }

  // Local/Turso SQLite table setup
  try {
    await tursoDb.execute(`
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

    try {
      await tursoDb.execute("ALTER TABLE document_requests ADD COLUMN pickup_date TEXT DEFAULT ''");
    } catch (e) {}

    await tursoDb.execute(`
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

    try {
      await tursoDb.execute("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'Active'");
    } catch (e) {}

    await tursoDb.execute(`
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

    await seedDefaultAccounts();
    await seedDefaultRequests();

    console.log(`✅ Database ready [Mode: ${tursoConfig.isRemote ? 'Turso Cloud (Remote)' : 'Local libSQL File'}]`);
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize fallback database:', error.message);
    throw error;
  }
}

/**
 * Health check used by /api/health
 */
async function checkHealth() {
  if (useSupabase) {
    const supaHealth = await checkSupabaseHealth();
    if (supaHealth.connected) {
      return {
        connected: true,
        type: 'Supabase Database (PostgreSQL)',
        mode: 'Supabase PostgreSQL (Cloud)',
        url: SUPABASE_URL
      };
    }
  }

  // Fallback health check
  try {
    await tursoDb.execute('SELECT 1 as ping');
    return {
      connected: true,
      type: 'Supabase Database (PostgreSQL)',
      mode: useSupabase ? 'Supabase PostgreSQL (Cloud)' : (tursoConfig.isRemote ? 'Turso Cloud (Fallback)' : 'Local File (Fallback)'),
      url: useSupabase ? SUPABASE_URL : (tursoConfig.isRemote ? tursoConfig.url.split('@').pop() : 'file:cca_doctrack.db')
    };
  } catch (err) {
    return {
      connected: false,
      type: 'Supabase Database (PostgreSQL)',
      error: err.message
    };
  }
}

module.exports = {
  // Database sub-modules
  dbRequests,
  dbUsers,
  dbReactivations,
  formatRequest,
  initDB,
  checkHealth,
  seedDefaultAccounts,
  seedDefaultRequests,
  useSupabase,
  // Direct client access
  db: tursoDb
};
