const express = require('express');
const router = express.Router();
const { dbRequests } = require('../db');

// Allowed enum values for validation
const ALLOWED_DOCUMENT_TYPES = [
  'Report Card',
  'Report Card / Form 137',
  'Form 137',
  'Certificate of Enrollment',
  'Good Moral Certificate',
  'Certificate of Good Moral',
  'Transcript of Records',
  'Transcript of Records (TOR)',
  'TOR',
  'Certificate of Graduation',
  'Certified True Copy (CTC)',
  'Certified True Copy',
  'Certificate of Grades',
  'Certificate of Registration',
  'Honorable Dismissal',
  'Diploma',
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
 * Helper to build 500 error responses without exposing raw internal error details in production
 */
function build500Response(message, error) {
  const payload = {
    success: false,
    message: message
  };
  if (process.env.NODE_ENV === 'development') {
    payload.error = error && error.message ? error.message : String(error);
  }
  return payload;
}

/**
 * @route   GET /api/requests
 * @desc    Retrieve student document requests (supports ?studentId= and ?email= filter)
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
    return res.status(500).json(build500Response('Failed to retrieve document requests from database.', error));
  }
});

/**
 * @route   POST /api/requests
 * @desc    Create a new student document request
 * @access  Public
 */
router.post('/', async (req, res) => {
  try {
    // Reject non-object, null, array, or empty bodies
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body) || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body must be a non-empty JSON object.',
        errors: ['Request body must be a non-empty JSON object.']
      });
    }

    const rawName = typeof req.body.studentName === 'string' ? req.body.studentName.trim() : '';
    const rawStudentId = typeof req.body.studentId === 'string' ? req.body.studentId.trim() : '';
    const rawCourse = typeof req.body.course === 'string' ? req.body.course.trim() : '';
    const rawEmail = typeof req.body.email === 'string' ? req.body.email.trim() : '';
    const rawDocType = typeof req.body.documentType === 'string' ? req.body.documentType.trim() : '';
    const rawPurpose = typeof req.body.purpose === 'string' ? req.body.purpose.trim() : '';
    const { dateSubmitted } = req.body;

    // Field-level validation
    const errors = [];
    if (!rawName) {
      errors.push('Student name is required.');
    } else if (rawName.length > 100) {
      errors.push('Student name must not exceed 100 characters.');
    }

    if (!rawStudentId) {
      errors.push('Student ID is required.');
    } else if (rawStudentId.length > 30) {
      errors.push('Student ID must not exceed 30 characters.');
    }

    if (!rawDocType) {
      errors.push('Document type is required.');
    } else if (rawDocType.length < 2 || rawDocType.length > 150) {
      errors.push('Document type must be between 2 and 150 characters.');
    }

    if (!rawPurpose) {
      errors.push('Purpose of request is required.');
    } else if (rawPurpose.length > 500) {
      errors.push('Purpose of request must not exceed 500 characters.');
    }

    if (rawEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(rawEmail)) {
        errors.push('Invalid email format provided.');
      }
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
      studentName: rawName,
      studentId: rawStudentId,
      course: rawCourse,
      email: rawEmail,
      documentType: rawDocType,
      purpose: rawPurpose,
      dateSubmitted: submissionDate
    });

    return res.status(201).json({
      success: true,
      message: 'Document request created successfully.',
      data: savedRequest
    });
  } catch (error) {
    console.error('Error creating document request:', error.message);
    return res.status(500).json(build500Response('Server error while saving document request.', error));
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

    // Validate ID: strictly positive numeric integer; do not strip non-digits
    if (!/^\d+$/.test(String(id).trim())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request ID format. ID must be a numeric integer.'
      });
    }

    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request ID format. ID must be a positive integer.'
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
    return res.status(500).json(build500Response('Server error while fetching document request.', error));
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

    // Validate ID: strictly positive numeric integer; do not strip non-digits
    if (!/^\d+$/.test(String(id).trim())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request ID format. ID must be a numeric integer.'
      });
    }

    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request ID format. ID must be a positive integer.'
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
    return res.status(500).json(build500Response('Server error while updating request status.', error));
  }
});

/**
 * @route   PUT /api/requests/:id
 * @desc    Update an existing document request in-place without creating a new record
 * @access  Public
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, pickupDate, pickup_date } = req.body;

    if (!/^\d+$/.test(String(id).trim())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request ID format. ID must be a numeric integer.'
      });
    }

    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request ID format.'
      });
    }

    const resolvedStatus = status || 'Processing';
    const resolvedPickupDate = pickupDate !== undefined ? pickupDate : pickup_date;
    const updatedRequest = await dbRequests.updateStatus(numericId, resolvedStatus, resolvedPickupDate);

    if (!updatedRequest) {
      return res.status(404).json({
        success: false,
        message: `Document request with ID '${id}' was not found.`
      });
    }

    return res.status(200).json({
      success: true,
      message: `Document request #${id} updated in-place successfully.`,
      data: updatedRequest
    });
  } catch (error) {
    console.error('Error updating request via PUT:', error.message);
    return res.status(500).json(build500Response('Server error while updating request.', error));
  }
});

/**
 * @route   DELETE /api/requests/:id
 * @desc    Delete a document request by ID
 * @access  Public (Admin)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(String(id).trim())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request ID format. ID must be a numeric integer.'
      });
    }

    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request ID format.'
      });
    }

    const success = await dbRequests.delete(numericId);
    return res.status(200).json({
      success: true,
      message: `Document request #${numericId} deleted successfully from database.`
    });
  } catch (error) {
    console.error('Error deleting document request:', error.message);
    return res.status(500).json(build500Response('Server error while deleting document request.', error));
  }
});

module.exports = router;
