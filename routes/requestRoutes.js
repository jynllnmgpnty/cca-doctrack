const express = require('express');
const router = express.Router();
const { dbRequests } = require('../db');

// Allowed enum values for validation
const ALLOWED_DOCUMENT_TYPES = [
  'Report Card',
  'Certificate of Enrollment',
  'Good Moral Certificate',
  'Transcript of Records',
  'Transcript of Records (TOR)',
  'TOR',
  'Certificate of Good Moral',
  'Certificate of Grades',
  'Others'
];

const ALLOWED_STATUSES = [
  'Pending',
  'Processing',
  'Approved',
  'For Release',
  'Completed',
  'Rejected'
];

/**
 * @route   GET /api/requests
 * @desc    Retrieve student document requests (supports ?studentId= filter)
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { studentId, email } = req.query;
    const requests = await dbRequests.getAll(studentId, email);

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
 * @desc    Create a new student document request
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

    const savedRequest = await dbRequests.create({
      studentName,
      studentId,
      course,
      email,
      documentType,
      purpose,
      dateSubmitted: submissionDate
    });

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
 * @desc    Retrieve a specific document request by numeric ID
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

    const request = await dbRequests.getById(numericId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: `Document request with ID '${id}' was not found.`
      });
    }

    // Access control: if studentId is provided and caller is not admin, verify ownership
    if (req.query.studentId && req.query.role !== 'admin') {
      const qStudentId = req.query.studentId.trim().toLowerCase();
      const reqStudentId = (request.studentId || '').trim().toLowerCase();
      if (reqStudentId && qStudentId !== reqStudentId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view your own document requests.'
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: request
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
 * @desc    Update the status of a specific document request
 * @access  Public (Admin)
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, pickupDate, pickup_date } = req.body;
    let numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId <= 0) {
      const extracted = String(id).replace(/\D/g, '');
      if (extracted) {
        numericId = parseInt(extracted, 10);
      }
    }

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

    const resolvedPickupDate = pickupDate !== undefined ? pickupDate : pickup_date;
    const updatedRequest = await dbRequests.updateStatus(numericId, status, resolvedPickupDate);

    if (!updatedRequest) {
      return res.status(404).json({
        success: false,
        message: `Document request with ID '${id}' was not found.`
      });
    }

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
