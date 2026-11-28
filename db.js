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
const crypto = require('crypto');
const {
  getPhilippineDateString,
  getPhilippineTimestamp,
  generatePickupCode,
  formatRequestNumber,
  addPhilippineWorkingDays,
  DEFAULT_PHILIPPINE_HOLIDAYS_2026
} = require('./utils/dateUtils');
require('dotenv').config();

// In-memory fallback stores for graceful resilience before table migration execution
const MEMORY_AUDIT_LOGS = [];
const MEMORY_NOTIFICATIONS = [];

const DEFAULT_DOC_TYPES = [
  { id: 1, name: 'Transcript of Records (TOR)', code: 'TOR', price: 150.00, processing_days: 5, max_quantity_per_request: 3, daily_capacity_limit: 25, requires_good_moral: false, is_active: true, description: 'Official academic transcript with dry seal and registrar signature.' },
  { id: 2, name: 'Certificate of Enrollment (COE)', code: 'COE', price: 50.00, processing_days: 2, max_quantity_per_request: 5, daily_capacity_limit: 50, requires_good_moral: false, is_active: true, description: 'Official certification confirming student enrollment status for the current term.' },
  { id: 3, name: 'Certificate of Good Moral Character', code: 'GMC', price: 50.00, processing_days: 3, max_quantity_per_request: 3, daily_capacity_limit: 30, requires_good_moral: false, is_active: true, description: 'Certification of student conduct and disciplinary clearance from the Office of Student Affairs.' },
  { id: 4, name: 'Honorable Dismissal', code: 'HD', price: 200.00, processing_days: 7, max_quantity_per_request: 1, daily_capacity_limit: 15, requires_good_moral: true, is_active: true, description: 'Official clearance and honorable dismissal certificate for transfer to another institution.' },
  { id: 5, name: 'Certified True Copy (CTC)', code: 'CTC', price: 50.00, processing_days: 2, max_quantity_per_request: 5, daily_capacity_limit: 40, requires_good_moral: false, is_active: true, description: 'Certified true copy of academic credentials or diplomas.' },
  { id: 6, name: 'Diploma (Duplicate / Certified Copy)', code: 'DIP', price: 300.00, processing_days: 10, max_quantity_per_request: 2, daily_capacity_limit: 10, requires_good_moral: false, is_active: true, description: 'Official certified replacement copy of graduation diploma.' },
  { id: 7, name: 'CAV (CHED/DepEd Verification)', code: 'CAV', price: 250.00, processing_days: 7, max_quantity_per_request: 2, daily_capacity_limit: 15, requires_good_moral: false, is_active: true, description: 'Certification, Authentication, and Verification endorsement package for DFA / abroad.' }
];

const DEFAULT_INVENTORY_ITEMS = [
  { id: 1, item_name: 'Security Paper (Official Parchment)', item_code: 'SEC-PAP-A4', current_stock: 450, unit: 'sheets', reorder_level: 100, cost_per_unit: 12.50, description: 'Tamper-evident watermark parchment for TOR & Diplomas' },
  { id: 2, item_name: 'Gold Dry-Seal Foil Stickers', item_code: 'GLD-SEAL-01', current_stock: 620, unit: 'pieces', reorder_level: 150, cost_per_unit: 5.00, description: 'Embossed institutional gold dry-seal adhesive stickers' },
  { id: 3, item_name: 'Standard Certificate Paper (Cream 120gsm)', item_code: 'CERT-PAP-120', current_stock: 800, unit: 'sheets', reorder_level: 200, cost_per_unit: 3.50, description: 'Special textured board for COE and GMC certificates' },
  { id: 4, item_name: 'Official Document Envelopes (CCA Branded)', item_code: 'ENV-OFF-CCA', current_stock: 350, unit: 'pieces', reorder_level: 100, cost_per_unit: 8.00, description: 'Waterproof CCA sealed document mailing and release envelopes' },
  { id: 5, item_name: 'Royal Blue Document Ribbon', item_code: 'RIB-BLU-ROLL', current_stock: 12, unit: 'rolls', reorder_level: 3, cost_per_unit: 85.00, description: 'High-grade satin ribbon for official authenticated document binding' }
];

let inMemoryInventory = JSON.parse(JSON.stringify(DEFAULT_INVENTORY_ITEMS));

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
  const reqNum = row.request_number || (row.id ? formatRequestNumber(row.id) : '');
  
  return {
    _id: String(row.id),
    id: numId,
    requestNumber: reqNum,
    request_number: reqNum,
    studentName: row.student_name || row.studentName || '',
    studentId: row.student_id || row.studentId || '',
    documentType: row.document_type || row.documentType || '',
    purpose: row.purpose || '',
    quantity: parseInt(row.quantity, 10) || 1,
    dateSubmitted: row.date_submitted || row.dateSubmitted || '',
    status: row.status || 'Pending',
    course: row.course || 'BS Information Technology',
    email: row.email || '',
    pickupDate: row.pickup_date || row.pickupDate || '',
    pickup_date: row.pickup_date || row.pickupDate || '',
    estimatedReleaseDate: row.estimated_release_date || row.estimatedReleaseDate || '',
    estimated_release_date: row.estimated_release_date || row.estimatedReleaseDate || '',
    pickupCode: row.pickup_code || row.pickupCode || '',
    pickup_code: row.pickup_code || row.pickupCode || '',
    rejectionReason: row.rejection_reason || row.rejectionReason || '',
    rejection_reason: row.rejection_reason || row.rejectionReason || '',
    completedAt: row.completed_at || row.completedAt || '',
    completed_at: row.completed_at || row.completedAt || '',
    claimedBy: row.claimed_by || row.claimedBy || '',
    claimed_by: row.claimed_by || row.claimedBy || '',
    claimantIdType: row.claimant_id_type || row.claimantIdType || '',
    claimantIdNumber: row.claimant_id_number || row.claimantIdNumber || '',
    userId: row.user_id || row.userId || null,
    user_id: row.user_id || row.userId || null,
    createdAt: row.created_at || row.createdAt || row.date_submitted || row.dateSubmitted,
    updatedAt: row.updated_at || row.updatedAt || row.created_at
  };
}

// ==============================================================================
// Document Requests Operations (Supabase PostgreSQL)
// ==============================================================================
const dbRequests = {
  /**
   * Retrieve all requests, optionally filtered by studentId, email, or user_id
   * Request isolation: strictly returns only records that belong to the queried student.
   */
  async getAll(studentId, email, userId) {
    const client = getSupabaseClient();
    const sId = studentId ? studentId.trim() : '';
    const em = email ? email.trim().toLowerCase() : '';
    const uId = userId ? parseInt(userId, 10) : null;

    // If filtering by specific student, ensure student exists in users table
    if (sId || em || uId) {
      let uQuery = client.from('users').select('id, student_id, email');
      if (uId && !isNaN(uId)) {
        uQuery = uQuery.eq('id', uId);
      } else if (sId && em) {
        uQuery = uQuery.or(`student_id.ilike.${sId},email.ilike.${em}`);
      } else if (sId) {
        uQuery = uQuery.ilike('student_id', sId);
      } else {
        uQuery = uQuery.ilike('email', em);
      }
      const { data: matchedUsers } = await uQuery;
      if (!matchedUsers || matchedUsers.length === 0) {
        // When student is not found in users table, return empty list without deleting data
        return [];
      }
    }

    let query = client.from('document_requests').select('*').order('id', { ascending: false });
    if (uId && !isNaN(uId)) {
      query = query.or(`user_id.eq.${uId},student_id.eq.${sId}`);
    } else if (sId && em) {
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
   * Retrieve one request by numeric ID or request_number
   */
  async getById(id) {
    const numericId = parseInt(id, 10);
    const client = getSupabaseClient();
    
    let query = client.from('document_requests').select('*');
    if (!isNaN(numericId) && numericId > 0) {
      query = query.eq('id', numericId);
    } else if (typeof id === 'string' && id.startsWith('CCA-REQ-')) {
      query = query.eq('request_number', id.trim());
    } else {
      return null;
    }

    const { data, error } = await query;
    if (error) {
      console.error('Supabase query error [document_requests.getById]:', error.message);
      throw error;
    }
    return data && data.length > 0 ? formatRequest(data[0]) : null;
  },

  /**
   * Insert a new document request into Supabase with defensive fallback
   */
  async create(payload) {
    const client = getSupabaseClient();
    const dateSubmitted = payload.dateSubmitted || getPhilippineDateString();
    const qty = parseInt(payload.quantity, 10) || 1;
    
    // Look up duration based on document type to calculate estimated release date
    let durationDays = 3;
    const docTypeLower = (payload.documentType || '').toLowerCase();
    if (docTypeLower.includes('transcript') || docTypeLower.includes('tor')) durationDays = 5;
    else if (docTypeLower.includes('enrollment') || docTypeLower.includes('coe')) durationDays = 2;
    else if (docTypeLower.includes('good moral') || docTypeLower.includes('gmc')) durationDays = 3;
    else if (docTypeLower.includes('honorable')) durationDays = 7;
    else if (docTypeLower.includes('diploma')) durationDays = 10;
    else if (docTypeLower.includes('cav')) durationDays = 7;

    const estimatedReleaseDate = payload.estimatedReleaseDate || addPhilippineWorkingDays(dateSubmitted, durationDays);

    // Resolve user_id if not explicitly provided
    let resolvedUserId = payload.userId || null;
    if (!resolvedUserId && (payload.studentId || payload.email)) {
      try {
        const u = await dbUsers.findByEmailOrStudentId(payload.studentId || payload.email);
        if (u) resolvedUserId = u.id;
      } catch (e) {}
    }

    // Try rich payload first (post-migration schema)
    const richPayload = {
      student_name: payload.studentName.trim(),
      student_id: payload.studentId.trim(),
      document_type: payload.documentType.trim(),
      purpose: payload.purpose.trim(),
      quantity: qty,
      date_submitted: dateSubmitted,
      estimated_release_date: estimatedReleaseDate,
      status: payload.status || 'Pending',
      course: payload.course ? payload.course.trim() : 'BS Information Technology',
      email: payload.email ? payload.email.trim().toLowerCase() : '',
      pickup_date: payload.pickupDate || null
    };
    if (resolvedUserId) richPayload.user_id = resolvedUserId;

    let resData = null;
    let { data, error } = await client
      .from('document_requests')
      .insert([richPayload])
      .select();

    if (error) {
      // If error is due to missing columns (before migration execution), fallback to base schema
      const isMissingCol = error.message && (
        error.message.includes('column') ||
        error.message.includes('user_id') ||
        error.message.includes('quantity') ||
        error.message.includes('estimated_release_date')
      );

      if (isMissingCol) {
        const basePayload = {
          student_name: payload.studentName.trim(),
          student_id: payload.studentId.trim(),
          document_type: payload.documentType.trim(),
          purpose: payload.purpose.trim(),
          date_submitted: dateSubmitted,
          status: payload.status || 'Pending',
          course: payload.course ? payload.course.trim() : 'BS Information Technology',
          email: payload.email ? payload.email.trim() : '',
          pickup_date: payload.pickupDate || ''
        };
        const fallbackRes = await client.from('document_requests').insert([basePayload]).select();
        if (fallbackRes.error) {
          console.error('Supabase insert error [document_requests.create fallback]:', fallbackRes.error.message);
          throw fallbackRes.error;
        }
        resData = fallbackRes.data[0];
        // Enrich in-memory
        resData.quantity = qty;
        resData.estimated_release_date = estimatedReleaseDate;
        resData.user_id = resolvedUserId;
      } else {
        console.error('Supabase insert error [document_requests.create]:', error.message);
        throw error;
      }
    } else {
      resData = data[0];
    }

    // Auto-assign human-readable request_number if not stored
    if (resData && !resData.request_number) {
      resData.request_number = formatRequestNumber(resData.id);
      // Attempt in-place update of request_number if column exists
      try {
        await client.from('document_requests').update({ request_number: resData.request_number }).eq('id', resData.id);
      } catch (e) {}
    }

    // Auto-create initial audit log and notification
    try {
      await dbAuditLogs.logAction(
        payload.studentName,
        'REQUEST_SUBMITTED',
        `New request submitted for ${payload.documentType} (Qty: ${qty}) - ${resData.request_number || formatRequestNumber(resData.id)}`
      );
      if (resolvedUserId) {
        await dbNotifications.create(
          resolvedUserId,
          'Request Submitted Successfully',
          `Your request for ${payload.documentType} has been received and is currently Pending evaluation.`,
          'request',
          resData.id
        );
      }
    } catch (e) {}

    return formatRequest(resData);
  },

  /**
   * Update request status and associated workflow properties in Supabase
   * Performs IN-PLACE update of the affected row only (never creates new records)
   */
  async updateStatus(id, status, extra = {}) {
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
      .select('*')
      .eq('id', numericId);

    if (checkErr) {
      console.error('Supabase check error [document_requests.updateStatus]:', checkErr.message);
      throw checkErr;
    }
    if (!existing || existing.length === 0) return null;

    const currentRecord = existing[0];
    const updatePayload = {
      status,
      updated_at: getPhilippineTimestamp()
    };

    if (extra.pickupDate !== undefined && extra.pickupDate !== null) {
      updatePayload.pickup_date = String(extra.pickupDate).trim();
    }

    // Status workflow transitions
    if (status === 'For Release') {
      if (!currentRecord.pickup_code && !extra.pickupCode) {
        updatePayload.pickup_code = generatePickupCode();
      } else if (extra.pickupCode) {
        updatePayload.pickup_code = extra.pickupCode;
      }
    } else if (status === 'Completed') {
      updatePayload.completed_at = getPhilippineTimestamp();
      if (extra.claimedBy) updatePayload.claimed_by = String(extra.claimedBy).trim();
      if (extra.claimantIdType) updatePayload.claimant_id_type = String(extra.claimantIdType).trim();
      if (extra.claimantIdNumber) updatePayload.claimant_id_number = String(extra.claimantIdNumber).trim();
    } else if (status === 'Rejected') {
      if (extra.rejectionReason) {
        updatePayload.rejection_reason = String(extra.rejectionReason).trim();
      }
    }

    // Try rich update
    let { data, error } = await client
      .from('document_requests')
      .update(updatePayload)
      .eq('id', numericId)
      .select();

    if (error) {
      // Fallback for missing new columns
      const baseUpdate = { status };
      if (updatePayload.pickup_date) baseUpdate.pickup_date = updatePayload.pickup_date;
      const fallbackRes = await client.from('document_requests').update(baseUpdate).eq('id', numericId).select();
      if (fallbackRes.error) {
        console.error('Supabase update error [document_requests.updateStatus]:', fallbackRes.error.message);
        throw fallbackRes.error;
      }
      data = fallbackRes.data;
    }

    const updatedRow = data && data.length > 0 ? data[0] : null;
    if (updatedRow) {
      // Send notification to student
      const studentTarget = updatedRow.user_id || updatedRow.email || updatedRow.student_id;
      if (studentTarget) {
        try {
          const reqNum = updatedRow.request_number || formatRequestNumber(updatedRow.id);
          let notifTitle = `Request ${reqNum} Updated`;
          let notifMsg = `Your document request status is now: ${status}.`;
          if (status === 'For Release') {
            notifTitle = `Ready for Pickup! (${reqNum})`;
            notifMsg = `Your document is ready for claiming at the Registrar window. Claiming Code: ${updatePayload.pickup_code || 'Available in portal'}.`;
          } else if (status === 'Completed') {
            notifTitle = `Document Claimed (${reqNum})`;
            notifMsg = `Your document has been successfully released and claimed.`;
          } else if (status === 'Rejected') {
            notifTitle = `Request Needs Attention (${reqNum})`;
            notifMsg = `Your request was rejected. Reason: ${extra.rejectionReason || 'Please check with registrar.'}`;
          }
          await dbNotifications.create(studentTarget, notifTitle, notifMsg, 'status', updatedRow.id);
        } catch (e) {}
      }

      // Automatically deduct physical materials when document is released/completed
      if (status === 'Completed') {
        try {
          await dbInventory.deductForRequest(updatedRow, extra.adminName || 'System Registrar');
        } catch (e) {}
      }
    }

    return updatedRow ? formatRequest(updatedRow) : null;
  },

  /**
   * Verify pickup code for physical document claiming
   */
  async verifyPickupCode(code, claimantInfo = {}) {
    if (!code || typeof code !== 'string') return null;
    const cleanCode = code.trim().toUpperCase();
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('document_requests')
      .select('*')
      .eq('pickup_code', cleanCode)
      .limit(1);

    if (error || !data || data.length === 0) return null;
    const req = data[0];

    // If request found, mark as Completed in-place
    const completedReq = await this.updateStatus(req.id, 'Completed', {
      claimedBy: claimantInfo.claimedBy || req.student_name,
      claimantIdType: claimantInfo.claimantIdType || 'School ID',
      claimantIdNumber: claimantInfo.claimantIdNumber || req.student_id,
      adminName: claimantInfo.adminName || 'Registrar Staff'
    });

    return completedReq;
  },

  /**
   * Delete a document request by numeric ID
   */
  async delete(id) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId <= 0) return false;
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
// Users Operations (Supabase PostgreSQL)
// ==============================================================================
const dbUsers = {
  /**
   * Find a user by email, student_id, or numeric id
   */
  async findByEmailOrStudentId(identifier) {
    if (!identifier) return null;
    const target = String(identifier).trim().toLowerCase();
    const client = getSupabaseClient();

    // Direct match for common administrator / student aliases
    if (target === 'admin' || target === 'admin-001' || target === 'administrator') {
      const admin = await dbUsers.getAdminUser();
      if (admin) return admin;
    }
    if (target === 'student') {
      const student = await dbUsers.findByEmailOrStudentId('student@cca.edu.ph');
      if (student) return student;
    }

    const isPureNum = /^\d+$/.test(target);
    let query = client.from('users').select('*');
    if (isPureNum) {
      const numId = parseInt(target, 10);
      query = query.or(`email.ilike.${target},student_id.ilike.${target},id.eq.${numId}`);
    } else {
      query = query.or(`email.ilike.${target},student_id.ilike.${target}`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Supabase query error [users.findByEmailOrStudentId]:', error.message);
      return null;
    }
    return data && data.length > 0 ? data[0] : null;
  },

  /**
   * Find existing user by email or student_id to prevent duplicates
   */
  async findDuplicate(email, studentId) {
    const client = getSupabaseClient();
    const em = (email || '').trim().toLowerCase();
    const sId = (studentId || '').trim();

    let query = client.from('users').select('id, email, student_id');
    if (em && sId) {
      query = query.or(`email.ilike.${em},student_id.ilike.${sId}`);
    } else if (em) {
      query = query.ilike('email', em);
    } else if (sId) {
      query = query.ilike('student_id', sId);
    } else {
      return [];
    }

    const { data, error } = await query;
    if (error) {
      console.error('Supabase query error [users.findDuplicate]:', error.message);
      return [];
    }
    return data || [];
  },

  /**
   * Create a new user in Supabase
   * Ensures exactly one user record is created without automatic request seeding.
   */
  async create(userPayload) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('users')
      .insert([{
        full_name: userPayload.fullName.trim(),
        student_id: userPayload.studentId.trim(),
        email: userPayload.email.trim().toLowerCase(),
        password: userPayload.password,
        course: userPayload.course ? userPayload.course.trim() : 'BS Information Technology',
        role: userPayload.role || 'student',
        status: userPayload.status || 'Active'
      }])
      .select();

    if (error) {
      console.error('Supabase insert error [users.create]:', error.message);
      throw error;
    }

    const newUser = data[0];

    // Initialize clean student_profile row if table exists
    try {
      await dbStudentProfiles.upsert(newUser.id, {
        fullName: newUser.full_name,
        studentId: newUser.student_id,
        email: newUser.email,
        course: newUser.course
      });
    } catch (e) {}

    return newUser;
  },

  /**
   * Get all registered students
   */
  async getStudents() {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('users')
      .select('id, full_name, student_id, email, course, role, status, created_at')
      .eq('role', 'student')
      .order('id', { ascending: false });

    if (error) {
      console.error('Supabase query error [users.getStudents]:', error.message);
      throw error;
    }

    return (data || []).map(u => ({
      id: u.id,
      fullName: u.full_name,
      studentId: u.student_id,
      email: u.email,
      course: u.course,
      role: u.role,
      status: u.status || 'Active',
      createdAt: u.created_at
    }));
  },

  /**
   * Update student account status (Active / Inactive)
   */
  async updateStatus(identifier, status) {
    if (!identifier) return null;
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

    const { data: users, error: findErr } = await query;
    if (findErr || !users || users.length === 0) return null;

    const user = users[0];
    const { data, error } = await client
      .from('users')
      .update({ status: status === 'Active' ? 'Active' : 'Inactive' })
      .eq('id', user.id)
      .select();

    if (error) {
      console.error('Supabase update error [users.updateStatus]:', error.message);
      throw error;
    }
    return data && data.length > 0 ? data[0] : null;
  },

  /**
   * Find existing user by email or student_id to prevent duplicates
   */
  async findDuplicate(email, studentId) {
    const client = getSupabaseClient();
    const em = (email || '').trim().toLowerCase();
    const sId = (studentId || '').trim();

    let query = client.from('users').select('id, email, student_id');
    if (em && sId) {
      query = query.or(`email.ilike.${em},student_id.ilike.${sId}`);
    } else if (em) {
      query = query.ilike('email', em);
    } else if (sId) {
      query = query.ilike('student_id', sId);
    } else {
      return [];
    }

    const { data, error } = await query;
    if (error) {
      console.error('Supabase query error [users.findDuplicate]:', error.message);
      return [];
    }
    return data || [];
  },

  /**
   * Update password for a user
   */
  async updatePassword(userId, newPasswordHash) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('users')
      .update({ password: newPasswordHash })
      .eq('id', userId)
      .select();

    if (error) {
      console.error('Supabase update error [users.updatePassword]:', error.message);
      throw error;
    }
    return data && data.length > 0 ? data[0] : null;
  },

  /**
   * Find existing user by email or student_id to prevent duplicates
   */
  async findDuplicate(email, studentId) {
    const client = getSupabaseClient();
    const em = (email || '').trim().toLowerCase();
    const sId = (studentId || '').trim();

    let query = client.from('users').select('id, email, student_id');
    if (em && sId) {
      query = query.or(`email.ilike.${em},student_id.ilike.${sId}`);
    } else if (em) {
      query = query.ilike('email', em);
    } else if (sId) {
      query = query.ilike('student_id', sId);
    } else {
      return [];
    }

    const { data, error } = await query;
    if (error) {
      console.error('Supabase query error [users.findDuplicate]:', error.message);
      return [];
    }
    return data || [];
  },

  /**
   * Update student or administrator profile in Supabase
   * Persists changes in-place and cascades name/email updates across requests
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

    // Fallback: if not found and identifier relates to admin, query primary admin
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
    if (updates.fullName !== undefined && String(updates.fullName).trim()) {
      updatePayload.full_name = String(updates.fullName).trim();
    }
    if (updates.course !== undefined && String(updates.course).trim()) {
      updatePayload.course = String(updates.course).trim();
    }
    if (updates.studentId !== undefined && String(updates.studentId).trim()) {
      updatePayload.student_id = String(updates.studentId).trim();
    }
    if (updates.email !== undefined && String(updates.email).trim() && String(updates.email).trim().toLowerCase() !== String(user.email || '').toLowerCase()) {
      updatePayload.email = String(updates.email).trim().toLowerCase();
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
        } catch (e) {}
      }

      // Synchronize student_id and email updates across requests and reactivations
      if (updatePayload.student_id && user.student_id && updatePayload.student_id !== user.student_id) {
        try {
          await client
            .from('document_requests')
            .update({ student_id: updatePayload.student_id })
            .eq('student_id', user.student_id);
          await client
            .from('reactivation_requests')
            .update({ student_id: updatePayload.student_id })
            .eq('student_id', user.student_id);
        } catch (e) {}
      }
      if (updatePayload.email && user.email && updatePayload.email !== user.email) {
        try {
          await client
            .from('document_requests')
            .update({ email: updatePayload.email })
            .ilike('email', user.email);
          await client
            .from('reactivation_requests')
            .update({ email: updatePayload.email })
            .ilike('email', user.email);
        } catch (e) {}
      }
    }

    // Also update student_profiles if table exists
    try {
      await dbStudentProfiles.upsert(user.id, {
        fullName: updatePayload.full_name || user.full_name,
        studentId: updatePayload.student_id || user.student_id,
        email: updatePayload.email || user.email,
        course: updatePayload.course || user.course,
        contactNumber: updates.phone || updates.contactNumber || null
      });
    } catch (e) {}

    return {
      id: user.id,
      fullName: updatePayload.full_name || user.full_name,
      full_name: updatePayload.full_name || user.full_name,
      studentId: updatePayload.student_id || user.student_id,
      student_id: updatePayload.student_id || user.student_id,
      email: updatePayload.email || user.email,
      course: updatePayload.course || user.course,
      role: user.role,
      status: user.status
    };
  },

  /**
   * Delete student/user and cascade delete all their document requests, reactivation requests, and history
   */
  async delete(identifier) {
    if (!identifier) return false;
    const target = String(identifier).trim().toLowerCase();
    const isPureNum = /^\d+$/.test(String(identifier).trim());
    const client = getSupabaseClient();

    let query = client.from('users').select('id, full_name, student_id, email, role');
    if (isPureNum) {
      const numId = parseInt(identifier, 10);
      query = query.or(`student_id.ilike.${target},email.ilike.${target},id.eq.${numId}`);
    } else {
      query = query.or(`student_id.ilike.${target},email.ilike.${target}`);
    }

    const { data: users, error: findErr } = await query;
    if (findErr) {
      console.error('Supabase query error [users.delete find]:', findErr.message);
      throw findErr;
    }
    if (!users || users.length === 0) return false;

    const user = users[0];
    const sId = user.student_id ? user.student_id.trim() : '';
    const em = user.email ? user.email.trim().toLowerCase() : '';

    // Cascade 1: Delete all document requests belonging to this user
    try {
      if (sId && em) {
        await client.from('document_requests').delete().or(`student_id.eq.${sId},email.ilike.${em}`);
      } else if (sId) {
        await client.from('document_requests').delete().eq('student_id', sId);
      } else if (em) {
        await client.from('document_requests').delete().ilike('email', em);
      }
      // Also try user_id deletion if column exists
      try {
        await client.from('document_requests').delete().eq('user_id', user.id);
      } catch (e) {}
    } catch (reqErr) {
      console.warn('Could not cascade delete document_requests:', reqErr.message);
    }

    // Cascade 2: Delete student profile
    try {
      await client.from('student_profiles').delete().eq('user_id', user.id);
    } catch (e) {}

    // Cascade 3: Delete notifications
    try {
      await client.from('notifications').delete().eq('user_id', user.id);
    } catch (e) {}

    // Cascade 4: Delete reactivation requests
    try {
      if (sId && em) {
        await client.from('reactivation_requests').delete().or(`student_id.ilike.${sId},email.ilike.${em}`);
      } else if (sId) {
        await client.from('reactivation_requests').delete().ilike('student_id', sId);
      } else if (em) {
        await client.from('reactivation_requests').delete().ilike('email', em);
      }
    } catch (reactErr) {
      console.warn('Could not cascade delete reactivation_requests:', reactErr.message);
    }

    // Cascade 5: Delete user record from users table
    const { error: delErr } = await client.from('users').delete().eq('id', user.id);
    if (delErr) {
      console.error('Supabase delete error [users.delete]:', delErr.message);
      throw delErr;
    }

    return true;
  },

  /**
   * Get the primary administrator user from Supabase
   */
  async getAdminUser() {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('users')
      .select('id, full_name, student_id, email, password, course, role, status, created_at')
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
// Document Types Module (Settings & Limits)
// ==============================================================================
const dbDocumentTypes = {
  async getAll() {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('document_types')
      .select('*')
      .order('id', { ascending: true });

    if (error || !data || data.length === 0) {
      return DEFAULT_DOC_TYPES;
    }
    return data;
  },

  async getById(id) {
    const numId = parseInt(id, 10);
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('document_types')
      .select('*')
      .eq('id', numId)
      .limit(1);

    if (error || !data || data.length === 0) {
      return DEFAULT_DOC_TYPES.find(d => d.id === numId) || null;
    }
    return data[0];
  },

  async update(id, updates) {
    const numId = parseInt(id, 10);
    const client = getSupabaseClient();

    const payload = {};
    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.price !== undefined) payload.price = parseFloat(updates.price);
    if (updates.processingDays !== undefined) payload.processing_days = parseInt(updates.processingDays, 10);
    if (updates.maxQuantity !== undefined) payload.max_quantity_per_request = parseInt(updates.maxQuantity, 10);
    if (updates.dailyCapacity !== undefined) payload.daily_capacity_limit = parseInt(updates.dailyCapacity, 10);
    if (updates.isActive !== undefined) payload.is_active = Boolean(updates.isActive);
    if (updates.description !== undefined) payload.description = updates.description.trim();

    const { data, error } = await client
      .from('document_types')
      .update(payload)
      .eq('id', numId)
      .select();

    if (error || !data || data.length === 0) {
      // Update memory copy fallback
      const found = DEFAULT_DOC_TYPES.find(d => d.id === numId);
      if (found) Object.assign(found, updates);
      return found;
    }
    return data[0];
  }
};

// ==============================================================================
// Inventory Management Module
// ==============================================================================
const dbInventory = {
  async getAll() {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('inventory_items')
      .select('*')
      .order('id', { ascending: true });

    if (error || !data || data.length === 0) {
      return inMemoryInventory;
    }
    return data;
  },

  async updateStock(id, newQuantity, reason, adminName = 'System Administrator') {
    const numId = parseInt(id, 10);
    const qty = parseInt(newQuantity, 10);
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('inventory_items')
      .update({ current_stock: qty, updated_at: getPhilippineTimestamp() })
      .eq('id', numId)
      .select();

    if (error || !data || data.length === 0) {
      const found = inMemoryInventory.find(i => i.id === numId);
      if (found) {
        found.current_stock = qty;
      }
    }

    await dbAuditLogs.logAction(adminName, 'INVENTORY_ADJUSTED', `Adjusted inventory item #${numId} to ${qty}. Reason: ${reason || 'Manual Count'}`);
    return data && data.length > 0 ? data[0] : (inMemoryInventory.find(i => i.id === numId) || null);
  },

  async deductForRequest(request, adminName = 'System') {
    const docType = (request.document_type || request.documentType || '').toLowerCase();
    const qty = parseInt(request.quantity, 10) || 1;

    let targetItemCode = 'CERT-PAP-120';
    if (docType.includes('transcript') || docType.includes('tor') || docType.includes('diploma')) {
      targetItemCode = 'SEC-PAP-A4';
    }

    const items = await this.getAll();
    const targetItem = items.find(i => i.item_code === targetItemCode);
    if (targetItem && targetItem.current_stock >= qty) {
      const newStock = Math.max(0, targetItem.current_stock - qty);
      await this.updateStock(targetItem.id, newStock, `Deducted for released request ${request.request_number || request.id}`, adminName);
    }
  }
};

// ==============================================================================
// System Audit Logs Module
// ==============================================================================
const dbAuditLogs = {
  async logAction(adminName, actionType, description, ipAddress = '127.0.0.1') {
    const entry = {
      admin_name: adminName || 'System',
      action_type: actionType || 'SYSTEM',
      description: description || '',
      ip_address: ipAddress,
      created_at: getPhilippineTimestamp()
    };

    const client = getSupabaseClient();
    try {
      await client.from('audit_logs').insert([entry]);
    } catch (e) {
      // Store in memory if audit_logs table pending
      MEMORY_AUDIT_LOGS.unshift({ ...entry, id: Date.now() });
      if (MEMORY_AUDIT_LOGS.length > 200) MEMORY_AUDIT_LOGS.pop();
    }
    return entry;
  },

  async getAll(limit = 100) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('audit_logs')
      .select('*')
      .order('id', { ascending: false })
      .limit(limit);

    if (error || !data || data.length === 0) {
      return MEMORY_AUDIT_LOGS.slice(0, limit);
    }
    return data;
  }
};

// ==============================================================================
// Notifications Module
// ==============================================================================
const dbNotifications = {
  async create(userId, title, message, type = 'general', linkId = null) {
    const entry = {
      user_id: typeof userId === 'number' ? userId : null,
      title: title.trim(),
      message: message.trim(),
      type: type || 'general',
      link: linkId ? String(linkId) : null,
      is_read: false,
      created_at: getPhilippineTimestamp()
    };

    const client = getSupabaseClient();
    try {
      const { data, error } = await client.from('notifications').insert([entry]).select();
      if (!error && data && data.length > 0) return data[0];
    } catch (e) {}

    const memEntry = { ...entry, id: Date.now() };
    MEMORY_NOTIFICATIONS.unshift(memEntry);
    return memEntry;
  },

  async getForUser(userId) {
    const client = getSupabaseClient();
    const numId = parseInt(userId, 10);
    if (!isNaN(numId)) {
      const { data, error } = await client
        .from('notifications')
        .select('*')
        .eq('user_id', numId)
        .order('id', { ascending: false });

      if (!error && data && data.length > 0) return data;
    }
    return MEMORY_NOTIFICATIONS.filter(n => !n.user_id || n.user_id === numId);
  },

  async markRead(id) {
    const numId = parseInt(id, 10);
    const client = getSupabaseClient();
    try {
      await client.from('notifications').update({ is_read: true }).eq('id', numId);
    } catch (e) {}
    const mem = MEMORY_NOTIFICATIONS.find(n => n.id === numId);
    if (mem) mem.is_read = true;
    return true;
  }
};

// ==============================================================================
// Student Profiles Module
// ==============================================================================
const dbStudentProfiles = {
  async getByUserId(userId) {
    const numId = parseInt(userId, 10);
    if (isNaN(numId)) return null;
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('student_profiles')
      .select('*')
      .eq('user_id', numId)
      .limit(1);

    if (error || !data || data.length === 0) return null;
    return data[0];
  },

  async upsert(userId, profileData) {
    const numId = parseInt(userId, 10);
    if (isNaN(numId)) return null;
    const client = getSupabaseClient();

    const payload = {
      user_id: numId,
      full_name: profileData.fullName || profileData.full_name,
      student_id: profileData.studentId || profileData.student_id,
      email: profileData.email,
      course: profileData.course,
      contact_number: profileData.contactNumber || profileData.phone || null,
      updated_at: getPhilippineTimestamp()
    };

    try {
      const { data, error } = await client
        .from('student_profiles')
        .upsert([payload], { onConflict: 'user_id' })
        .select();

      if (!error && data && data.length > 0) return data[0];
    } catch (e) {}
    return payload;
  }
};

// ==============================================================================
// Seeding & Table Initialization
// ==============================================================================
async function seedDefaultAccounts() {
  try {
    const client = getSupabaseClient();

    // 1. Seed administrator if not exists (preserve existing admin account)
    const { data: adminExists, error: adminErr } = await client
      .from('users')
      .select('id, full_name, email')
      .or('role.eq.admin,email.eq.admin@cca.edu.ph')
      .limit(1);

    if (adminErr) {
      if (adminErr.code !== 'PGRST205' && (!adminErr.message || !adminErr.message.includes('schema cache'))) {
        console.warn('⚠️ Note on admin user check:', adminErr.message);
      }
      return;
    }

    if (!adminExists || adminExists.length === 0) {
      let adminPw = process.env.DEFAULT_ADMIN_PASSWORD;
      if (!adminPw) {
        adminPw = crypto.randomBytes(8).toString('hex');
        console.log(`🔐 [Security Notice] DEFAULT_ADMIN_PASSWORD unset. Generated temporary random password: ${adminPw}`);
      }
      const hashedAdminPw = await bcrypt.hash(adminPw, 10);
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
      .or('email.eq.jaynellan@cca.edu.ph,email.eq.student@cca.edu.ph');

    if (!studentErr && (!studentExists || studentExists.length === 0)) {
      let studentPw = process.env.DEFAULT_STUDENT_PASSWORD;
      if (!studentPw) {
        studentPw = crypto.randomBytes(8).toString('hex');
        console.log(`🔐 [Security Notice] DEFAULT_STUDENT_PASSWORD unset. Generated temporary random password: ${studentPw}`);
      }
      const hashedStudentPw = await bcrypt.hash(studentPw, 10);
      const { error: insStudentErr } = await client.from('users').insert([{
        full_name: 'Student Portal User',
        student_id: '23-67894',
        email: 'student@cca.edu.ph',
        password: hashedStudentPw,
        course: 'BS Information Technology',
        role: 'student',
        status: 'Active'
      }]);
      if (!insStudentErr) {
        console.log('✅ [Supabase] Seeded default student: student@cca.edu.ph');
      } else {
        console.warn('⚠️ Could not insert default student:', insStudentErr.message);
      }
    }
  } catch (err) {
    console.warn('⚠️ Account seeding notice:', err.message);
  }
}

/**
 * Initialize database connectivity
 * NOTE: Automatic sample request seeding removed to prevent sample requests in newly registered accounts.
 */
async function initDB() {
  console.log(`📡 Initializing Supabase PostgreSQL connection [${SUPABASE_URL}]...`);
  const health = await checkSupabaseHealth();
  if (health.connected) {
    console.log('✅ Supabase PostgreSQL connected successfully!');

    const client = getSupabaseClient();
    const { error: userTableErr } = await client.from('users').select('id', { count: 'exact', head: true });
    if (userTableErr && (userTableErr.code === 'PGRST205' || (userTableErr.message && userTableErr.message.includes('schema cache')))) {
      console.log('--------------------------------------------------------');
      console.log('📌 ACTION REQUIRED: Supabase tables need to be created/updated.');
      console.log('👉 Open Supabase SQL Editor: https://supabase.com/dashboard/project/lfstpiwrxaxjteucitnp/sql/new');
      console.log('👉 Paste the SQL from supabase_schema.sql and click Run.');
      console.log('--------------------------------------------------------');
    }

    await seedDefaultAccounts();
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
  dbDocumentTypes,
  dbInventory,
  dbAuditLogs,
  dbNotifications,
  dbStudentProfiles,
  formatRequest,
  initDB,
  checkHealth,
  seedDefaultAccounts
};
