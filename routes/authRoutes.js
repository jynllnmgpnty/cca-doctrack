const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');

/**
 * Seed initial administrative and student accounts if database is empty
 */
const seedDefaultAccounts = async () => {
  try {
    const adminExists = await User.findOne({ email: 'admin@cca.edu.ph' });
    if (!adminExists) {
      await User.create({
        fullName: 'Office of the College Registrar',
        studentId: 'ADMIN-001',
        email: 'admin@cca.edu.ph',
        password: 'admin123',
        role: 'admin',
        course: 'Registrar Staff'
      });
      console.log('Seeded default registrar administrator: admin@cca.edu.ph');
    }

    const studentExists = await User.findOne({ email: 'jaynellan@cca.edu.ph' });
    if (!studentExists) {
      await User.create({
        fullName: 'Jaynellan Almary O. Magpantay',
        studentId: '23-67894',
        email: 'jaynellan@cca.edu.ph',
        password: 'student123',
        role: 'student',
        course: 'BS Information Technology'
      });
      console.log('Seeded default student account: jaynellan@cca.edu.ph');
    }
  } catch (err) {
    console.warn('Note on default account seeding:', err.message);
  }
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new Student or Admin account in MongoDB Atlas
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database service unavailable. Please check MongoDB Atlas connection.'
      });
    }

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

    // Check if email already registered
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address is already registered.'
      });
    }

    // Create user in MongoDB Atlas
    const newUser = await User.create({
      fullName: fullName.trim(),
      studentId: studentId ? studentId.trim() : '',
      email: normalizedEmail,
      password: password,
      course: course ? course.trim() : 'BS Information Technology',
      role: userRole
    });

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully!',
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        studentId: newUser.studentId,
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
 * @desc    Authenticate user & return credentials
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database service unavailable. Please check MongoDB Atlas connection.'
      });
    }

    const { email, password, targetPortal } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Ensure seed accounts exist if user tries default demo credentials
    if (
      normalizedEmail === 'admin@cca.edu.ph' ||
      normalizedEmail === 'jaynellan@cca.edu.ph'
    ) {
      await seedDefaultAccounts();
    }

    // Find user in MongoDB Atlas
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. No account found with this email.'
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password is incorrect.'
      });
    }

    // Role check if logging in to a specific portal
    if (targetPortal === 'admin' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Administrator privileges are required to access the Registrar Admin Portal.'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.fullName}!`,
      user: {
        id: user._id,
        fullName: user.fullName,
        studentId: user.studentId,
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
