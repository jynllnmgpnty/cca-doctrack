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
    if (!password || password.length < 6) errors.push('Password must be at least 6 characters long.');

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

    // Check if email already registered in Turso
    const existingUser = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [normalizedEmail]
    });

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address is already registered.'
      });
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user into Turso SQL database
    const insertResult = await db.execute({
      sql: `INSERT INTO users (full_name, student_id, email, password, course, role)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        fullName.trim(),
        studentId ? studentId.trim() : '',
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
 * @desc    Authenticate user & return credentials from Turso database
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password, targetPortal } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user in Turso database
    let userResult = await db.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [normalizedEmail]
    });

    // If default demo accounts missing, re-seed and query again
    if (userResult.rows.length === 0 && (normalizedEmail === 'admin@cca.edu.ph' || normalizedEmail === 'jaynellan@cca.edu.ph')) {
      await seedDefaultAccounts();
      userResult = await db.execute({
        sql: 'SELECT * FROM users WHERE email = ?',
        args: [normalizedEmail]
      });
    }

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. No account found with this email.'
      });
    }

    const user = userResult.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
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
        message: 'Access denied. Administrator privileges are required to access the Registrar Admin Portal.'
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
