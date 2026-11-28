const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { dbUsers, dbReactivations, seedDefaultAccounts } = require('../db');

// Persistent Avatar File Storage
const avatarsFilePath = path.resolve(__dirname, '..', 'data', 'avatars.json');

function getStoredAvatars() {
  try {
    if (!fs.existsSync(avatarsFilePath)) return {};
    const raw = fs.readFileSync(avatarsFilePath, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    return {};
  }
}

function saveStoredAvatar(identifier, avatarData, secondaryIdentifier = null) {
  try {
    const dir = path.dirname(avatarsFilePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const avatars = getStoredAvatars();
    const key = String(identifier).trim().toLowerCase();
    avatars[key] = avatarData;
    if (secondaryIdentifier) {
      avatars[String(secondaryIdentifier).trim().toLowerCase()] = avatarData;
    }
    if (key.includes('admin') || key === 'admin@cca.edu.ph') {
      avatars['admin'] = avatarData;
      avatars['admin@cca.edu.ph'] = avatarData;
    }
    fs.writeFileSync(avatarsFilePath, JSON.stringify(avatars), 'utf8');
  } catch (e) {
    console.warn('Could not save avatar file:', e.message);
  }
}

function getStoredAvatar(identifier, secondaryIdentifier = null) {
  if (!identifier && !secondaryIdentifier) return null;
  const avatars = getStoredAvatars();
  const k1 = identifier ? String(identifier).trim().toLowerCase() : '';
  const k2 = secondaryIdentifier ? String(secondaryIdentifier).trim().toLowerCase() : '';

  if (k1 && avatars[k1]) return avatars[k1];
  if (k2 && avatars[k2]) return avatars[k2];

  if (k1.includes('admin') || k2.includes('admin')) {
    return avatars['admin'] || avatars['admin@cca.edu.ph'] || null;
  }
  return null;
}

/**
 * @route   POST /api/auth/register
 * @desc    Register a new Student or Admin account in database
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const { fullName, studentId, email, password, course, role } = req.body;

    // Field-level validation
    const errors = [];
    if (!fullName || !fullName.trim()) errors.push('Full name is required.');
    if (!email || !email.trim()) errors.push('Email address is required.');

    const normalizedEmail = email ? email.trim().toLowerCase() : '';
    const normalizedStudentId = studentId ? studentId.trim() : '';

    // Enforce CCA Institutional Email domain (@cca.edu.ph)
    if (normalizedEmail && !normalizedEmail.endsWith('@cca.edu.ph')) {
      errors.push('Institutional email must end with @cca.edu.ph (e.g., student@cca.edu.ph).');
    }

    // Password validation: at least 8 characters, uppercase, lowercase, numbers
    if (!password) {
      errors.push('Password is required.');
    } else {
      if (password.length < 8) {
        errors.push('Password must be at least 8 characters long.');
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

    // Privilege Escalation Prevention: Restrict public registration strictly to students
    if (role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin accounts cannot be created via public registration.'
      });
    }
    const userRole = 'student';

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

    // Check if email or student ID is already registered
    const existingUsers = await dbUsers.findDuplicate(normalizedEmail, normalizedStudentId);

    if (existingUsers && existingUsers.length > 0) {
      const match = existingUsers[0];
      if (match.email && match.email.toLowerCase() === normalizedEmail) {
        return res.status(400).json({
          success: false,
          message: 'An account with this institutional email address already exists. Please sign in or use a different email.'
        });
      }
      if (normalizedStudentId && match.student_id && match.student_id.toLowerCase() === normalizedStudentId.toLowerCase()) {
        return res.status(400).json({
          success: false,
          message: 'An account with this Student ID Number already exists. Please sign in or check your Student ID.'
        });
      }
      return res.status(400).json({
        success: false,
        message: 'An account with these credentials already exists. Please sign in.'
      });
    }

    // Hash clean password with bcrypt
    const cleanPassword = password.trim();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(cleanPassword, salt);

    // Insert user into database
    const newUser = await dbUsers.create({
      fullName: fullName.trim(),
      studentId: normalizedStudentId,
      email: normalizedEmail,
      password: hashedPassword,
      course: course ? course.trim() : 'BS Information Technology',
      role: userRole
    });

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully!',
      user: newUser
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
 * @desc    Authenticate user & return credentials from database (Accepts Email OR Student ID)
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

    // Find user in database by email OR student_id (case-insensitive)
    let user = await dbUsers.findByEmailOrStudentId(normalizedInput);

    // If default demo accounts missing or shortcut used, check fallback
    if (!user) {
      if (['admin', 'admin@cca.edu.ph', 'admin-001'].includes(normalizedInput)) {
        user = await dbUsers.getAdminUser();
      } else if (['student', 'student@cca.edu.ph', '23-67894', 'jaynellan@cca.edu.ph'].includes(normalizedInput)) {
        user = await dbUsers.findByEmailOrStudentId('student@cca.edu.ph') || await dbUsers.findByEmailOrStudentId('23-67894');
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. No account found matching this Email Address or Student ID.'
      });
    }

    // Check password strictly with bcrypt
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(rawPassword, user.password);
      if (!isMatch && trimmedPassword !== rawPassword) {
        isMatch = await bcrypt.compare(trimmedPassword, user.password);
      }
    } catch (e) {
      isMatch = false;
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

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.full_name}!`,
      user: {
        id: user.id,
        fullName: user.full_name,
        studentId: user.student_id,
        email: user.email,
        course: user.course,
        role: user.role,
        avatar: getStoredAvatar(user.email || user.student_id)
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
    const user = await dbUsers.findByEmailOrStudentId(normalizedInput);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    // Verify current password (with trimmed fallback)
    let isCurrentMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentMatch && currentPassword.trim() !== currentPassword) {
      isCurrentMatch = await bcrypt.compare(currentPassword.trim(), user.password);
    }
    if (!isCurrentMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect. Please try again.'
      });
    }

    // Validate new password rules: at least 8 characters, uppercase, lowercase, number/special
    const cleanNewPw = newPassword.trim();
    if (cleanNewPw.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long.'
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
    if (!/[0-9]/.test(cleanNewPw)) {
      return res.status(400).json({
        success: false,
        message: 'New password must contain at least one number (0-9).'
      });
    }

    // Hash and update
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(cleanNewPw, salt);

    await dbUsers.updatePassword(user.id, newHash);

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
 * @route   PATCH /api/auth/profile
 * @desc    Update user profile name, course, etc. in Supabase
 * @access  Public (Authenticated session)
 */
/**
 * @route   GET /api/auth/profile
 * @desc    Get live authenticated user profile from database
 * @access  Public
 */
router.get('/profile', async (req, res) => {
  try {
    const identifier = req.query.identifier || req.query.email || req.query.studentId || req.query.id;
    const requestedRole = req.query.role ? String(req.query.role).trim().toLowerCase() : '';
    if (!identifier && requestedRole !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Identifier is required to fetch profile.'
      });
    }

    let user = null;
    if (identifier) {
      const normalized = String(identifier).trim().toLowerCase();
      user = await dbUsers.findByEmailOrStudentId(normalized);
      if (!user && (normalized === 'admin' || normalized.includes('admin') || requestedRole === 'admin')) {
        user = await dbUsers.getAdminUser();
      }
    } else if (requestedRole === 'admin') {
      user = await dbUsers.getAdminUser();
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        fullName: user.full_name,
        full_name: user.full_name,
        studentId: user.student_id,
        student_id: user.student_id,
        email: user.email,
        course: user.course,
        role: user.role,
        status: user.status,
        avatar: getStoredAvatar(user.email, user.student_id)
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile.',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/auth/avatar
 * @desc    Persist user profile photo/avatar across devices
 * @access  Public (Authenticated session)
 */
router.post('/avatar', async (req, res) => {
  try {
    const { identifier, avatar } = req.body;
    if (!identifier || !avatar) {
      return res.status(400).json({
        success: false,
        message: 'Identifier and avatar data are required.'
      });
    }

    let secondary = null;
    try {
      const found = await dbUsers.findByEmailOrStudentId(identifier);
      if (found) {
        secondary = (found.student_id && String(found.student_id).toLowerCase() !== String(identifier).toLowerCase())
          ? found.student_id
          : found.email;
      }
    } catch (e) {}

    saveStoredAvatar(identifier, avatar, secondary);
    return res.status(200).json({
      success: true,
      message: 'Profile avatar saved and synchronized successfully!'
    });
  } catch (error) {
    console.error('Error saving avatar:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to save avatar.',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/auth/avatar
 * @desc    Get user profile photo/avatar across devices
 * @access  Public
 */
router.get('/avatar', (req, res) => {
  try {
    const identifier = req.query.identifier || req.query.email || req.query.studentId;
    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'Identifier is required.'
      });
    }

    const avatar = getStoredAvatar(identifier);
    return res.status(200).json({
      success: true,
      avatar
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch avatar.',
      error: error.message
    });
  }
});

/**
 * @route   PATCH /api/auth/profile
 * @desc    Update student or administrator profile in Supabase
 * @access  Public
 */
router.patch('/profile', async (req, res) => {
  try {
    const { identifier, email, studentId, fullName, course, newEmail, role } = req.body;
    const targetIdentifier = identifier || email || studentId;

    if (!targetIdentifier) {
      return res.status(400).json({
        success: false,
        message: 'User identifier is required to update profile.'
      });
    }

    const updates = {};
    if (fullName !== undefined && String(fullName).trim()) updates.fullName = String(fullName).trim();
    if (course !== undefined && String(course).trim()) updates.course = String(course).trim();
    if (studentId !== undefined && String(studentId).trim()) updates.studentId = String(studentId).trim();
    if (role !== undefined && String(role).trim()) updates.role = String(role).trim();
    if (req.body.phone !== undefined || req.body.contactNumber !== undefined) {
      updates.phone = String(req.body.phone || req.body.contactNumber).trim();
      updates.contactNumber = updates.phone;
    }

    // Check if new email is provided
    if (newEmail && String(newEmail).trim()) {
      updates.email = String(newEmail).trim().toLowerCase();
    } else if (email && String(email).trim() && String(email).trim().toLowerCase() !== String(targetIdentifier).trim().toLowerCase()) {
      updates.email = String(email).trim().toLowerCase();
    }

    if (req.body.avatar) {
      saveStoredAvatar(targetIdentifier, req.body.avatar);
    }

    const updatedUser = await dbUsers.updateProfile(targetIdentifier, updates);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    const resolvedFullName = updatedUser.fullName || updatedUser.full_name || fullName;
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully in database.',
      user: {
        ...updatedUser,
        fullName: resolvedFullName,
        full_name: resolvedFullName,
        avatar: getStoredAvatar(updatedUser.email || updatedUser.studentId || targetIdentifier)
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile in database.',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/auth/students
 * @desc    Get all registered student accounts from database (no fake data)
 * @access  Public
 */
router.get('/students', async (req, res) => {
  try {
    const students = await dbUsers.getStudents();

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

    const updated = await dbUsers.updateStatus(identifier, status);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: `Student '${identifier}' not found in database.`
      });
    }

    return res.status(200).json({
      success: true,
      message: `Student account successfully ${status === 'Active' ? 'reactivated' : 'deactivated'}.`,
      studentId: updated.studentId,
      status: updated.status
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
 * @route   DELETE /api/auth/students/:identifier
 * @route   DELETE /api/auth/users/:identifier
 * @desc    Delete a user account and cascade delete all their document requests, reactivation requests, and history
 * @access  Public (Admin)
 */
async function handleDeleteUser(req, res) {
  try {
    const { identifier } = req.params;
    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'Identifier is required to delete account.'
      });
    }

    const deleted = await dbUsers.delete(identifier);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: `Account '${identifier}' not found in database.`
      });
    }

    return res.status(200).json({
      success: true,
      message: `Account '${identifier}' and all associated document requests, reactivation records, and history successfully deleted from database.`
    });
  } catch (error) {
    console.error('Error deleting account:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete account from database.',
      error: error.message
    });
  }
}

router.delete('/students/:identifier', handleDeleteUser);
router.delete('/users/:identifier', handleDeleteUser);

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
    const user = await dbUsers.findByEmailOrStudentId(targetId) || await dbUsers.findByEmailOrStudentId(targetEmail);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No student account matches the provided Student ID or email.'
      });
    }

    await dbReactivations.create({
      studentId: user.student_id,
      fullName: user.full_name,
      email: user.email,
      reason: reason.trim()
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
    const requests = await dbReactivations.getAll();
    return res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
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
 * @route   POST /api/auth/seed
 * @desc    Trigger default accounts seeding (Restricted to non-production or authorized setup)
 */
router.post('/seed', async (req, res) => {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_PROD_SEED) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Seeding endpoint is disabled in production.'
    });
  }
  await seedDefaultAccounts();
  return res.json({ success: true, message: 'Seeded default demo accounts.' });
});

module.exports = router;
