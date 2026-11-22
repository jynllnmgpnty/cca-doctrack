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
 * @route   GET /api/auth/seed
 * @desc    Trigger default accounts seeding
 */
router.get('/seed', async (req, res) => {
  await seedDefaultAccounts();
  return res.json({ success: true, message: 'Seeded default demo accounts.' });
});

module.exports = router;
