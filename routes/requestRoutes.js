const express = require('express');
const router = express.Router();
const { db, formatRequest } = require('../db');

// Allowed enum values for validation
const ALLOWED_DOCUMENT_TYPES = [
  'Report Card',
  'Certificate of Enrollment',
  'Good Moral Certificate',
  'Transcript of Records'
];

const ALLOWED_STATUSES = ['Pending', 'Processing', 'Completed'];

/**
 * @route   GET /api/requests
 * @desc    Retrieve student document requests from Turso Cloud / libSQL (supports ?studentId= filter)
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { studentId } = req.query;
    let result;

    if (studentId && studentId.trim()) {
      result = await db.execute({
        sql: 'SELECT * FROM document_requests WHERE student_id = ? ORDER BY id DESC',
        args: [studentId.trim()]
      });
    } else {
      result = await db.execute('SELECT * FROM document_requests ORDER BY id DESC');
    }

    const requests = result.rows.map(formatRequest);

    return res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error('Error fetching document requests:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve document requests from database.',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/requests
 * @desc    Create a new student document request in Turso
 * @access  Public
 */
router.post('/', async (req, res) => {
  try {
    const { studentName, studentId, course, email, documentType, purpose, dateSubmitted } = req.body;

    // Field-level validation
    const errors = [];
    if (!studentName || !studentName.trim()) {
      errors.push('Student name is required.');
    }
    if (!studentId || !studentId.trim()) {
      errors.push('Student ID is required.');
    }
    if (!documentType || !documentType.trim()) {
      errors.push('Document type is required.');
    } else if (!ALLOWED_DOCUMENT_TYPES.includes(documentType.trim())) {
      errors.push(
        `Invalid document type. Allowed types: ${ALLOWED_DOCUMENT_TYPES.join(', ')}`
      );
    }
    if (!purpose || !purpose.trim()) {
      errors.push('Purpose of request is required.');
    }

    // Return 400 Bad Request if validation errors exist
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed. Please correct the input fields.',
        errors: errors
      });
    }

    // Determine submission date (YYYY-MM-DD format)
    let submissionDate = new Date().toISOString().split('T')[0];
    if (dateSubmitted) {
      const parsedDate = new Date(dateSubmitted);
      if (!isNaN(parsedDate.getTime())) {
        submissionDate = parsedDate.toISOString().split('T')[0];
      }
    }

    const courseVal = course ? course.trim() : 'BS Information Technology';
    const emailVal = email ? email.trim() : '';

    // Insert new request record into Turso SQL database
    const insertResult = await db.execute({
      sql: `INSERT INTO document_requests (student_name, student_id, document_type, purpose, date_submitted, status, course, email)
            VALUES (?, ?, ?, ?, ?, 'Pending', ?, ?)`,
      args: [
        studentName.trim(),
        studentId.trim(),
        documentType.trim(),
        purpose.trim(),
        submissionDate,
        courseVal,
        emailVal
      ]
    });

    const newId = insertResult.lastInsertRowid;
    const fetchResult = await db.execute({
      sql: 'SELECT * FROM document_requests WHERE id = ?',
      args: [newId]
    });

    const savedRequest = formatRequest(fetchResult.rows[0]);

    return res.status(201).json({
      success: true,
      message: 'Document request created successfully.',
      data: savedRequest
    });
  } catch (error) {
    console.error('Error creating document request:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while saving document request.',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/requests/:id
 * @desc    Retrieve a specific document request by ID from Turso
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const numericId = parseInt(id, 10);

    if (isNaN(numericId) || numericId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request ID format.'
      });
    }

    const result = await db.execute({
      sql: 'SELECT * FROM document_requests WHERE id = ?',
      args: [numericId]
    });

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Document request with ID '${id}' was not found.`
      });
    }

    return res.status(200).json({
      success: true,
      data: formatRequest(result.rows[0])
    });
  } catch (error) {
    console.error('Error fetching request by ID:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching document request.',
      error: error.message
    });
  }
});

/**
 * @route   PATCH /api/requests/:id
 * @desc    Update the status of a specific document request in Turso
 * @access  Public (Admin)
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const numericId = parseInt(id, 10);

    // Validate ID format
    if (isNaN(numericId) || numericId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request ID format.'
      });
    }

    // Validate status presence and value
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status field is required.'
      });
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status '${status}'. Allowed statuses: ${ALLOWED_STATUSES.join(', ')}`
      });
    }

    // Check if record exists
    const checkResult = await db.execute({
      sql: 'SELECT id FROM document_requests WHERE id = ?',
      args: [numericId]
    });

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Document request with ID '${id}' was not found.`
      });
    }

    // Update status in Turso
    await db.execute({
      sql: 'UPDATE document_requests SET status = ? WHERE id = ?',
      args: [status, numericId]
    });

    const updatedResult = await db.execute({
      sql: 'SELECT * FROM document_requests WHERE id = ?',
      args: [numericId]
    });

    const updatedRequest = formatRequest(updatedResult.rows[0]);

    return res.status(200).json({
      success: true,
      message: `Request status successfully updated to '${status}'.`,
      data: updatedRequest
    });
  } catch (error) {
    console.error('Error updating request status:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating request status.',
      error: error.message
    });
  }
});

module.exports = router;
