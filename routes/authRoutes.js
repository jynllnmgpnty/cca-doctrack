const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db, seedDefaultAccounts } = require('../db');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new Student or Admin account in Turso database
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const { fullName, studentId, email, password, course, role } = req.body;

    // Field-level validation
    const errors = [];
    if (!fullName || !fullName.trim()) errors.push('Full name is required.');
    if (!email || !email.trim()) errors.push('Email address is required.');
    
    // Password validation: 8-12 characters, uppercase, lowercase, number
    if (!password) {
      errors.push('Password is required.');
    } else {
      if (password.length < 8 || password.length > 12) {
        errors.push('Password must be between 8 and 12 characters long.');
      }
      if (!/[A-Z]/.test(password)) {
        errors.push('Password must include at least one uppercase letter (A-Z).');
      }
      if (!/[a-z]/.test(password)) {
        errors.push('Password must include at least one lowercase letter (a-z).');
      }
      if (!/[0-9]/.test(password)) {
        errors.push('Password must include at least one number (0-9).');
      }
    }

    if (req.body.confirmPassword !== undefined && req.body.confirmPassword !== password) {
      errors.push('Passwords do not match.');
    }

    const userRole = role === 'admin' ? 'admin' : 'student';
    if (userRole === 'student' && (!studentId || !studentId.trim())) {
      errors.push('Student ID number is required for student registration.');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Registration validation failed.',
        errors
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedStudentId = studentId ? studentId.trim() : '';

    // Check if email or student ID is already registered in Turso
    const existingUser = await db.execute({
      sql: 'SELECT id, email, student_id FROM users WHERE LOWER(email) = ? OR (student_id != "" AND LOWER(student_id) = ?)',
      args: [normalizedEmail, normalizedStudentId.toLowerCase()]
    });

    if (existingUser.rows.length > 0) {
      const match = existingUser.rows[0];
      if (match.email && match.email.toLowerCase() === normalizedEmail) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email address is already registered.'
        });
      }
      if (normalizedStudentId && match.student_id && match.student_id.toLowerCase() === normalizedStudentId.toLowerCase()) {
        return res.status(400).json({
          success: false,
          message: 'An account with this Student ID Number is already registered.'
        });
      }
    }

    // Hash clean password with bcrypt
    const cleanPassword = password.trim();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(cleanPassword, salt);

    // Insert user into Turso SQL database
    const insertResult = await db.execute({
      sql: `INSERT INTO users (full_name, student_id, email, password, course, role)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        fullName.trim(),
        normalizedStudentId,
        normalizedEmail,
        hashedPassword,
        course ? course.trim() : 'BS Information Technology',
        userRole
      ]
    });

    const createdUserResult = await db.execute({
      sql: 'SELECT id, full_name, student_id, email, course, role FROM users WHERE id = ?',
      args: [insertResult.lastInsertRowid]
    });

    const newUser = createdUserResult.rows[0];

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully!',
      user: {
        id: newUser.id,
        fullName: newUser.full_name,
        studentId: newUser.student_id,
        email: newUser.email,
        course: newUser.course,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error during account registration.',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & return credentials from Turso database (Accepts Email OR Student ID)
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password, targetPortal } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email/student ID and password.'
      });
    }

    const normalizedInput = email.trim().toLowerCase();
    const rawPassword = password;
    const trimmedPassword = password.trim();

    // Find user in Turso database by email OR student_id (case-insensitive)
    let userResult = await db.execute({
      sql: 'SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(student_id) = ?',
      args: [normalizedInput, normalizedInput]
    });

    // If default demo accounts missing, re-seed and query again
    const isDefaultSeed = ['admin@cca.edu.ph', 'jaynellan@cca.edu.ph', '23-67894', 'admin-001'].includes(normalizedInput);
    if (userResult.rows.length === 0 && isDefaultSeed) {
      await seedDefaultAccounts();
      userResult = await db.execute({
        sql: 'SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(student_id) = ?',
        args: [normalizedInput, normalizedInput]
      });
    }

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. No account found matching this Email Address or Student ID.'
      });
    }

    const user = userResult.rows[0];

    // Check password (try raw, and try trimmed as fallback)
    let isMatch = await bcrypt.compare(rawPassword, user.password);
    if (!isMatch && trimmedPassword !== rawPassword) {
      isMatch = await bcrypt.compare(trimmedPassword, user.password);
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password is incorrect.'
      });
    }

    // Check if student account is deactivated
    if (user.status && (user.status.toLowerCase() === 'inactive' || user.status.toLowerCase() === 'deactivated')) {
      return res.status(403).json({
        success: false,
        isDeactivated: true,
        message: 'Your student account has been deactivated. Access to CCA DocTrack is restricted. Please submit a reactivation request.',
        studentId: user.student_id,
        email: user.email,
        fullName: user.full_name
      });
    }

    // Role check if logging in to admin portal
    if (targetPortal === 'admin' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Administrator privileges are required to access the Registrar Admin Portal. Please switch the portal indicator to "Student".'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.full_name}!`,
      user: {
        id: user.id,
        fullName: user.full_name,
        studentId: user.student_id,
        email: user.email,
        course: user.course,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication.',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/auth/change-password
 * @desc    Change student/admin account password
 * @access  Public (Authenticated session)
 */
router.post('/change-password', async (req, res) => {
  try {
    const { identifier, email, studentId, currentPassword, newPassword } = req.body;
    const targetIdentifier = identifier || email || studentId;

    if (!targetIdentifier || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide identifier, current password, and new password.'
      });
    }

    const normalizedInput = targetIdentifier.trim().toLowerCase();

    // Find user
    const userResult = await db.execute({
      sql: 'SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(student_id) = ?',
      args: [normalizedInput, normalizedInput]
    });

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    const user = userResult.rows[0];

    // Verify current password
    const isCurrentMatch = await bcrypt.compare(currentPassword.trim(), user.password);
    if (!isCurrentMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect. Please try again.'
      });
    }

    // Validate new password rules: 8-12 characters, uppercase, lowercase, number/special
    const cleanNewPw = newPassword.trim();
    if (cleanNewPw.length < 8 || cleanNewPw.length > 12) {
      return res.status(400).json({
        success: false,
        message: 'New password must be between 8 and 12 characters long.'
      });
    }
    if (!/[A-Z]/.test(cleanNewPw)) {
      return res.status(400).json({
        success: false,
        message: 'New password must contain at least one uppercase letter (A-Z).'
      });
    }
    if (!/[a-z]/.test(cleanNewPw)) {
      return res.status(400).json({
        success: false,
        message: 'New password must contain at least one lowercase letter (a-z).'
      });
    }
    if (!/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(cleanNewPw)) {
      return res.status(400).json({
        success: false,
        message: 'New password must contain at least one number or special character.'
      });
    }

    // Hash and update
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(cleanNewPw, salt);

    await db.execute({
      sql: 'UPDATE users SET password = ? WHERE id = ?',
      args: [newHash, user.id]
    });

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully! Your account is now secured.'
    });
  } catch (error) {
    console.error('Change password error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating password.',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/auth/students
 * @desc    Get all registered student accounts from Turso database (no fake data)
 * @access  Public
 */
router.get('/students', async (req, res) => {
  try {
    const result = await db.execute("SELECT id, full_name, student_id, email, course, role, status, created_at FROM users WHERE role != 'admin' ORDER BY id ASC");
    const students = result.rows.map(r => ({
      id: r.id,
      name: r.full_name,
      studentId: r.student_id,
      email: r.email,
      course: r.course || 'BS Information Technology',
      status: r.status || 'Active',
      createdAt: r.created_at
    }));

    return res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    console.error('Error fetching students:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve students from database.',
      error: error.message
    });
  }
});

/**
 * @route   PATCH /api/auth/students/:identifier/status
 * @desc    Deactivate or reactivate a student account
 * @access  Public (Admin)
 */
router.patch('/students/:identifier/status', async (req, res) => {
  try {
    const { identifier } = req.params;
    const { status } = req.body;

    if (!status || !['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Status must be "Active" or "Inactive".'
      });
    }

    const target = identifier.trim().toLowerCase();

    // Check if user exists
    const checkUser = await db.execute({
      sql: 'SELECT id, full_name, student_id, email FROM users WHERE LOWER(student_id) = ? OR LOWER(email) = ? OR id = ?',
      args: [target, target, target]
    });

    if (checkUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Student '${identifier}' not found in database.`
      });
    }

    await db.execute({
      sql: 'UPDATE users SET status = ? WHERE LOWER(student_id) = ? OR LOWER(email) = ? OR id = ?',
      args: [status, target, target, target]
    });

    // If reactivated, mark any pending reactivation requests as Approved
    if (status === 'Active') {
      try {
        await db.execute({
          sql: "UPDATE reactivation_requests SET status = 'Approved' WHERE LOWER(student_id) = ? OR LOWER(email) = ?",
          args: [target, target]
        });
      } catch (err) {}
    }

    return res.status(200).json({
      success: true,
      message: `Student account successfully ${status === 'Active' ? 'reactivated' : 'deactivated'}.`,
      studentId: checkUser.rows[0].student_id,
      status: status
    });
  } catch (error) {
    console.error('Error updating student status:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update student account status.',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/auth/reactivation-request
 * @desc    Student submits an account reactivation request
 * @access  Public
 */
router.post('/reactivation-request', async (req, res) => {
  try {
    const { studentId, email, reason } = req.body;

    if (!studentId || !email || !reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Student ID, institutional email, and reason are required.'
      });
    }

    const targetId = studentId.trim().toLowerCase();
    const targetEmail = email.trim().toLowerCase();

    // Verify user exists in database
    const userCheck = await db.execute({
      sql: 'SELECT id, full_name, student_id, email, status FROM users WHERE LOWER(student_id) = ? OR LOWER(email) = ?',
      args: [targetId, targetEmail]
    });

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No student account matches the provided Student ID or email.'
      });
    }

    const studentUser = userCheck.rows[0];

    await db.execute({
      sql: 'INSERT INTO reactivation_requests (student_id, full_name, email, reason, status) VALUES (?, ?, ?, ?, ?)',
      args: [studentUser.student_id, studentUser.full_name, studentUser.email, reason.trim(), 'Pending']
    });

    return res.status(201).json({
      success: true,
      message: 'Your reactivation request has been submitted to the Registrar. You will be notified once reviewed.'
    });
  } catch (error) {
    console.error('Reactivation request error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit reactivation request.',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/auth/reactivation-requests
 * @desc    Get all reactivation requests (for Admin review)
 * @access  Public (Admin)
 */
router.get('/reactivation-requests', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM reactivation_requests ORDER BY id DESC');
    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching reactivation requests:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve reactivation requests.',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/auth/seed
 * @desc    Trigger default accounts seeding
 */
router.get('/seed', async (req, res) => {
  await seedDefaultAccounts();
  return res.json({ success: true, message: 'Seeded default demo accounts.' });
});

module.exports = router;
