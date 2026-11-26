/**
 * CCA DocTrack - Supabase PostgreSQL Database Module
 * Christ Centered Academy of Lipa City Inc.
 * 
 * Provides production-ready database operations exclusively targeting Supabase PostgreSQL
 * via @supabase/supabase-js. Operates in pure cloud database mode for Render deployment.
 * Preserves camelCase response mappings expected by frontend client components.
 */

const { getSupabaseClient, checkSupabaseHealth, isSupabaseConfigured, SUPABASE_URL } = require('./supabase');
const bcrypt = require('bcryptjs');
require('dotenv').config();

/**
 * Maps database row (snake_case PostgreSQL) to frontend camelCase properties:
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
// Document Requests Operations (Supabase PostgreSQL)
// ==============================================================================
const dbRequests = {
  /**
   * Retrieve all requests, optionally filtered by studentId or email
   */
  async getAll(studentId, email) {
    const client = getSupabaseClient();
    let query = client.from('document_requests').select('*').order('id', { ascending: false });
    const sId = studentId ? studentId.trim() : '';
    const em = email ? email.trim().toLowerCase() : '';
    if (sId && em) {
      query = query.or(`student_id.eq.${sId},email.ilike.${em}`);
    } else if (sId) {
      query = query.eq('student_id', sId);
    } else if (em) {
      query = query.ilike('email', em);
    }
    const { data, error } = await query;
    if (error) {
      console.error('Supabase query error [document_requests.getAll]:', error.message);
      throw error;
    }
    return (data || []).map(formatRequest);
  },

  /**
   * Retrieve one request by numeric ID
   */
  async getById(id) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId <= 0) return null;

    const client = getSupabaseClient();
    const { data, error } = await client
      .from('document_requests')
      .select('*')
      .eq('id', numericId);

    if (error) {
      console.error('Supabase query error [document_requests.getById]:', error.message);
      throw error;
    }
    return data && data.length > 0 ? formatRequest(data[0]) : null;
  },

  /**
   * Insert a new document request into Supabase
   */
  async create(payload) {
    const client = getSupabaseClient();
    const insertPayload = {
      student_name: payload.studentName.trim(),
      student_id: payload.studentId.trim(),
      document_type: payload.documentType.trim(),
      purpose: payload.purpose.trim(),
      date_submitted: payload.dateSubmitted,
      status: payload.status || 'Pending',
      course: payload.course ? payload.course.trim() : 'BS Information Technology',
      email: payload.email ? payload.email.trim() : '',
      pickup_date: payload.pickupDate || ''
    };

    const { data, error } = await client
      .from('document_requests')
      .insert([insertPayload])
      .select();

    if (error) {
      console.error('Supabase insert error [document_requests.create]:', error.message);
      throw error;
    }
    return formatRequest(data[0]);
  },

  /**
   * Update request status and optional pickup date in Supabase
   */
  async updateStatus(id, status, pickupDate) {
    let numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId <= 0) {
      const extracted = String(id).replace(/\D/g, '');
      if (extracted) numericId = parseInt(extracted, 10);
    }
    if (isNaN(numericId) || numericId <= 0) return null;

    const client = getSupabaseClient();

    // Verify record existence
    const { data: existing, error: checkErr } = await client
      .from('document_requests')
      .select('id')
      .eq('id', numericId);

    if (checkErr) {
      console.error('Supabase check error [document_requests.updateStatus]:', checkErr.message);
      throw checkErr;
    }
    if (!existing || existing.length === 0) return null;

    const updatePayload = { status };
    if (pickupDate !== undefined && pickupDate !== null) {
      updatePayload.pickup_date = String(pickupDate).trim();
    }

    const { data, error } = await client
      .from('document_requests')
      .update(updatePayload)
      .eq('id', numericId)
      .select();

    if (error) {
      console.error('Supabase update error [document_requests.updateStatus]:', error.message);
      throw error;
    }
    return data && data.length > 0 ? formatRequest(data[0]) : null;
  },

  /**
   * Delete request by ID (for cleanup/testing)
   */
  async delete(id) {
    const numericId = parseInt(id, 10);
    const client = getSupabaseClient();
    const { error } = await client.from('document_requests').delete().eq('id', numericId);
    if (error) {
      console.error('Supabase delete error [document_requests.delete]:', error.message);
      throw error;
    }
    return true;
  }
};

// ==============================================================================
// User Authentication & Management Operations (Supabase PostgreSQL)
// ==============================================================================
const dbUsers = {
  /**
   * Find user by email OR student_id (case-insensitive)
   */
  async findByEmailOrStudentId(identifier) {
    if (!identifier) return null;
    const target = identifier.trim().toLowerCase();
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('users')
      .select('*')
      .or(`email.ilike.${target},student_id.ilike.${target}`);

    if (error) {
      console.error('Supabase query error [users.findByEmailOrStudentId]:', error.message);
      throw error;
    }
    return data && data.length > 0 ? data[0] : null;
  },

  /**
   * Find existing user for duplicate checking during registration
   */
  async findDuplicate(email, studentId) {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedStudentId = studentId ? studentId.trim().toLowerCase() : '';
    const client = getSupabaseClient();

    let query = client.from('users').select('id, email, student_id');
    if (normalizedStudentId) {
      query = query.or(`email.ilike.${normalizedEmail},student_id.ilike.${normalizedStudentId}`);
    } else {
      query = query.ilike('email', normalizedEmail);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Supabase query error [users.findDuplicate]:', error.message);
      throw error;
    }
    return data || [];
  },

  /**
   * Create a new user account in Supabase
   */
  async create(payload) {
    const fullName = payload.fullName.trim();
    const studentId = payload.studentId ? payload.studentId.trim() : '';
    const email = payload.email.trim().toLowerCase();
    const password = payload.password;
    const course = payload.course ? payload.course.trim() : 'BS Information Technology';
    const role = payload.role === 'admin' ? 'admin' : 'student';

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

    if (error) {
      console.error('Supabase insert error [users.create]:', error.message);
      throw error;
    }

    const user = data[0];
    return {
      id: user.id,
      fullName: user.full_name,
      studentId: user.student_id,
      email: user.email,
      course: user.course,
      role: user.role
    };
  },

  /**
   * Update user password in Supabase
   */
  async updatePassword(userId, hashedPassword) {
    const client = getSupabaseClient();
    const { error } = await client
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', userId);

    if (error) {
      console.error('Supabase update error [users.updatePassword]:', error.message);
      throw error;
    }
    return true;
  },

  /**
   * Get all registered students (role != 'admin')
   */
  async getStudents() {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('users')
      .select('id, full_name, student_id, email, course, role, status, created_at')
      .neq('role', 'admin')
      .order('id', { ascending: true });

    if (error) {
      if (error.code === 'PGRST205' || (error.message && error.message.includes('schema cache'))) {
        return [];
      }
      console.error('Supabase query error [users.getStudents]:', error.message);
      throw error;
    }

    return (data || []).map(r => ({
      id: r.id,
      name: r.full_name,
      studentId: r.student_id,
      email: r.email,
      course: r.course || 'BS Information Technology',
      status: r.status || 'Active',
      createdAt: r.created_at
    }));
  },

  /**
   * Update student account status (Active / Inactive)
   */
  async updateStatus(identifier, status) {
    const target = identifier.trim().toLowerCase();
    const numId = parseInt(identifier, 10);
    const client = getSupabaseClient();

    let query = client.from('users').select('id, full_name, student_id, email');
    if (!isNaN(numId) && numId > 0) {
      query = query.or(`student_id.ilike.${target},email.ilike.${target},id.eq.${numId}`);
    } else {
      query = query.or(`student_id.ilike.${target},email.ilike.${target}`);
    }

    const { data: users, error: findErr } = await query;
    if (findErr) {
      console.error('Supabase query error [users.updateStatus find]:', findErr.message);
      throw findErr;
    }
    if (!users || users.length === 0) return null;

    const user = users[0];
    const { error: updErr } = await client
      .from('users')
      .update({ status })
      .eq('id', user.id);

    if (updErr) {
      console.error('Supabase update error [users.updateStatus update]:', updErr.message);
      throw updErr;
    }

    if (status === 'Active') {
      try {
        await client
          .from('reactivation_requests')
          .update({ status: 'Approved' })
          .ilike('student_id', user.student_id);
      } catch (e) {
        // Non-critical if table pending
      }
    }

    return {
      studentId: user.student_id,
      status: status
    };
  },

  /**
   * Update student or administrator profile (full_name, course, etc.) in Supabase
   */
  async updateProfile(identifier, updates = {}) {
    const target = String(identifier).trim().toLowerCase();
    const isPureNum = /^\d+$/.test(String(identifier).trim());
    const client = getSupabaseClient();

    let query = client.from('users').select('id, full_name, student_id, email, course, role, status');
    if (isPureNum) {
      const numId = parseInt(identifier, 10);
      query = query.or(`student_id.ilike.${target},email.ilike.${target},id.eq.${numId}`);
    } else {
      query = query.or(`student_id.ilike.${target},email.ilike.${target}`);
    }

    let { data: users, error: findErr } = await query;
    if (findErr) {
      console.error('Supabase query error [users.updateProfile find]:', findErr.message);
      throw findErr;
    }

    // Fallback: if not found and identifier or role relates to admin, query by role 'admin'
    if (!users || users.length === 0) {
      if (target === 'admin' || target.includes('admin') || updates.role === 'admin') {
        const { data: adminUsers } = await client
          .from('users')
          .select('id, full_name, student_id, email, course, role, status')
          .eq('role', 'admin')
          .limit(1);
        if (adminUsers && adminUsers.length > 0) {
          users = adminUsers;
        }
      }
    }

    if (!users || users.length === 0) return null;

    const user = users[0];
    const updatePayload = {};
    if (updates.fullName !== undefined && updates.fullName.trim()) {
      updatePayload.full_name = updates.fullName.trim();
    }
    if (updates.course !== undefined && updates.course.trim()) {
      updatePayload.course = updates.course.trim();
    }
    if (updates.studentId !== undefined && updates.studentId.trim()) {
      updatePayload.student_id = updates.studentId.trim();
    }
    if (updates.email !== undefined && updates.email.trim() && updates.email.trim().toLowerCase() !== String(user.email || '').toLowerCase()) {
      updatePayload.email = updates.email.trim().toLowerCase();
    }

    if (Object.keys(updatePayload).length > 0) {
      const { error: updErr } = await client
        .from('users')
        .update(updatePayload)
        .eq('id', user.id);

      if (updErr) {
        console.error('Supabase update error [users.updateProfile update]:', updErr.message);
        throw updErr;
      }

      // Synchronize full_name to existing document_requests for this student
      if (updatePayload.full_name && user.student_id) {
        try {
          await client
            .from('document_requests')
            .update({ student_name: updatePayload.full_name })
            .eq('student_id', user.student_id);
        } catch (e) {
          // Non-critical if requests table pending
        }
      }
    }

    return {
      id: user.id,
      fullName: updatePayload.full_name || user.full_name,
      studentId: updatePayload.student_id || user.student_id,
      email: updatePayload.email || user.email,
      course: updatePayload.course || user.course,
      role: user.role
    };
  },

  /**
   * Get the primary administrator user from Supabase
   */
  async getAdminUser() {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('users')
      .select('id, full_name, student_id, email, course, role, status, created_at')
      .eq('role', 'admin')
      .order('id', { ascending: true })
      .limit(1);

    if (error) {
      console.error('Supabase query error [users.getAdminUser]:', error.message);
      return null;
    }
    return data && data.length > 0 ? data[0] : null;
  }
};

// ==============================================================================
// Reactivation Requests Operations (Supabase PostgreSQL)
// ==============================================================================
const dbReactivations = {
  /**
   * Submit a student account reactivation request
   */
  async create(payload) {
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

    if (error) {
      console.error('Supabase insert error [reactivation_requests.create]:', error.message);
      throw error;
    }
    return data[0];
  },

  /**
   * Get all reactivation requests
   */
  async getAll() {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('reactivation_requests')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      if (error.code === 'PGRST205' || (error.message && error.message.includes('schema cache'))) {
        return [];
      }
      console.error('Supabase query error [reactivation_requests.getAll]:', error.message);
      throw error;
    }
    return data || [];
  }
};

// ==============================================================================
// Seeding & Table Initialization
// ==============================================================================
async function seedDefaultAccounts() {
  try {
    const client = getSupabaseClient();

    // 1. Seed administrator if not exists
    const { data: adminExists, error: adminErr } = await client
      .from('users')
      .select('id')
      .eq('email', 'admin@cca.edu.ph');

    if (adminErr) {
      if (adminErr.code !== 'PGRST205' && (!adminErr.message || !adminErr.message.includes('schema cache'))) {
        console.warn('⚠️ Note on admin user check:', adminErr.message);
      }
      return;
    }

    if (!adminExists || adminExists.length === 0) {
      const defaultAdminPw = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
      const hashedAdminPw = await bcrypt.hash(defaultAdminPw, 10);
      const { error: insAdminErr } = await client.from('users').insert([{
        full_name: 'Office of the College Registrar',
        student_id: 'ADMIN-001',
        email: 'admin@cca.edu.ph',
        password: hashedAdminPw,
        course: 'Registrar Staff',
        role: 'admin',
        status: 'Active'
      }]);
      if (!insAdminErr) {
        console.log('✅ [Supabase] Seeded default administrator: admin@cca.edu.ph');
      } else {
        console.warn('⚠️ Could not insert default admin:', insAdminErr.message);
      }
    }

    // 2. Seed student account if not exists
    const { data: studentExists, error: studentErr } = await client
      .from('users')
      .select('id')
      .eq('email', 'jaynellan@cca.edu.ph');

    if (!studentErr && (!studentExists || studentExists.length === 0)) {
      const defaultStudentPw = process.env.DEFAULT_STUDENT_PASSWORD || 'student123';
      const hashedStudentPw = await bcrypt.hash(defaultStudentPw, 10);
      const { error: insStudentErr } = await client.from('users').insert([{
        full_name: 'Jaynellan Almary O. Magpantay',
        student_id: '23-67894',
        email: 'jaynellan@cca.edu.ph',
        password: hashedStudentPw,
        course: 'BS Information Technology',
        role: 'student',
        status: 'Active'
      }]);
      if (!insStudentErr) {
        console.log('✅ [Supabase] Seeded default student: jaynellan@cca.edu.ph');
      } else {
        console.warn('⚠️ Could not insert default student:', insStudentErr.message);
      }
    }
  } catch (err) {
    console.warn('⚠️ Account seeding notice:', err.message);
  }
}

async function seedDefaultRequests() {
  try {
    const client = getSupabaseClient();
    const { count, error } = await client
      .from('document_requests')
      .select('*', { count: 'exact', head: true });

    if (!error && (count === 0 || count === null)) {
      const sampleRequests = [
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
      ];

      const { error: insReqErr } = await client.from('document_requests').insert(sampleRequests);
      if (!insReqErr) {
        console.log('✅ [Supabase] Seeded sample student document requests.');
      }
    }
  } catch (err) {
    console.warn('⚠️ Request seeding notice:', err.message);
  }
}

/**
 * Initialize database connectivity
 */
async function initDB() {
  console.log(`📡 Initializing Supabase PostgreSQL connection [${SUPABASE_URL}]...`);
  const health = await checkSupabaseHealth();
  if (health.connected) {
    console.log('✅ Supabase PostgreSQL connected successfully!');

    // Check if users table exists in Supabase
    const client = getSupabaseClient();
    const { error: userTableErr } = await client.from('users').select('id', { count: 'exact', head: true });
    if (userTableErr && (userTableErr.code === 'PGRST205' || (userTableErr.message && userTableErr.message.includes('schema cache')))) {
      console.log('--------------------------------------------------------');
      console.log('📌 ACTION REQUIRED: Supabase "users" table is not created yet.');
      console.log('👉 Open Supabase SQL Editor: https://supabase.com/dashboard/project/lfstpiwrxaxjteucitnp/sql/new');
      console.log('👉 Paste the SQL from supabase_schema.sql and click Run.');
      console.log('--------------------------------------------------------');
    }

    await seedDefaultAccounts();
    await seedDefaultRequests();
    return true;
  } else {
    console.error('❌ Supabase database connection failed:', health.error);
    throw new Error(`Database connection failed: ${health.error}`);
  }
}

/**
 * Health check used by /api/health
 */
async function checkHealth() {
  const supaHealth = await checkSupabaseHealth();
  if (supaHealth.connected) {
    return {
      connected: true,
      type: 'Supabase Database (PostgreSQL)',
      mode: 'Supabase PostgreSQL (Cloud)',
      url: SUPABASE_URL
    };
  }
  return {
    connected: false,
    type: 'Supabase Database (PostgreSQL)',
    mode: 'Supabase PostgreSQL (Cloud)',
    error: supaHealth.error
  };
}

module.exports = {
  dbRequests,
  dbUsers,
  dbReactivations,
  formatRequest,
  initDB,
  checkHealth,
  seedDefaultAccounts,
  seedDefaultRequests
};
