const express = require('express');
const router = express.Router();
const {
  dbRequests,
  dbDocumentTypes,
  dbInventory,
  dbAuditLogs,
  dbNotifications
} = require('../db');
const { DEFAULT_PHILIPPINE_HOLIDAYS_2026, getPhilippineDateString } = require('../utils/dateUtils');

// Allowed enum values for validation
const ALLOWED_DOCUMENT_TYPES = [
  'Report Card',
  'Report Card / Form 137',
  'Form 137',
  'Certificate of Enrollment',
  'Certificate of Enrollment (COE)',
  'COE',
  'Good Moral Certificate',
  'Certificate of Good Moral Character',
  'Certificate of Good Moral',
  'GMC',
  'Transcript of Records',
  'Transcript of Records (TOR)',
  'TOR',
  'Certificate of Graduation',
  'Certified True Copy (CTC)',
  'Certified True Copy',
  'CTC',
  'Certificate of Grades',
  'Certificate of Registration',
  'Honorable Dismissal',
  'Diploma',
  'Diploma (Duplicate / Certified Copy)',
  'CAV (CHED/DepEd Verification)',
  'CAV',
  'Others'
];

const ALLOWED_STATUSES = [
  'Pending',
  'Approved',
  'Processing',
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

// ==============================================================================
// 1. Document Types & Configuration Endpoints
// ==============================================================================

/**
 * @route   GET /api/requests/document-types
 * @desc    Retrieve active document types with fees, duration, and quantity limits
 * @access  Public
 */
router.get('/document-types', async (req, res) => {
  try {
    const docTypes = await dbDocumentTypes.getAll();
    return res.status(200).json({
      success: true,
      count: docTypes.length,
      data: docTypes
    });
  } catch (error) {
    console.error('Error fetching document types:', error.message);
    return res.status(500).json(build500Response('Failed to retrieve document types.', error));
  }
});

/**
 * @route   PATCH /api/requests/document-types/:id
 * @desc    Update document configuration (fees, processing days, limits)
 * @access  Public (Admin)
 */
router.patch('/document-types/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await dbDocumentTypes.update(id, req.body);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: `Document type #${id} not found.`
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Document type settings updated successfully.',
      data: updated
    });
  } catch (error) {
    console.error('Error updating document type:', error.message);
    return res.status(500).json(build500Response('Failed to update document type settings.', error));
  }
});

// ==============================================================================
// 2. Inventory Management Endpoints
// ==============================================================================

/**
 * @route   GET /api/requests/inventory
 * @desc    Retrieve inventory of certificate papers, gold seals, and supplies
 * @access  Public (Admin)
 */
router.get('/inventory', async (req, res) => {
  try {
    const items = await dbInventory.getAll();
    return res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    console.error('Error fetching inventory:', error.message);
    return res.status(500).json(build500Response('Failed to retrieve inventory.', error));
  }
});

/**
 * @route   PATCH /api/requests/inventory/:id
 * @desc    Adjust inventory stock level with reason
 * @access  Public (Admin)
 */
router.patch('/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { newQuantity, reason, adminName } = req.body;

    if (newQuantity === undefined || isNaN(parseInt(newQuantity, 10)) || parseInt(newQuantity, 10) < 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid non-negative newQuantity is required.'
      });
    }

    const updated = await dbInventory.updateStock(id, newQuantity, reason, adminName);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: `Inventory item #${id} not found.`
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Inventory item stock updated successfully.',
      data: updated
    });
  } catch (error) {
    console.error('Error adjusting inventory:', error.message);
    return res.status(500).json(build500Response('Failed to adjust inventory.', error));
  }
});

// ==============================================================================
// 3. Document Claiming & QR / Pickup Code Verification
// ==============================================================================

/**
 * @route   POST /api/requests/verify-pickup
 * @desc    Verify QR pickup code (CCA-PK-XXXXXX) and mark document as claimed
 * @access  Public (Registrar / Admin)
 */
router.post('/verify-pickup', async (req, res) => {
  try {
    const { pickupCode, claimantName, claimantIdType, claimantIdNumber, adminName } = req.body;
    if (!pickupCode || typeof pickupCode !== 'string' || !pickupCode.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Pickup verification code is required.'
      });
    }

    const completed = await dbRequests.verifyPickupCode(pickupCode.trim(), {
      claimedBy: claimantName,
      claimantIdType,
      claimantIdNumber,
      adminName
    });

    if (!completed) {
      return res.status(404).json({
        success: false,
        message: 'Invalid pickup code. No matching unreleased document request found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Document request ${completed.requestNumber || completed.id} successfully verified and released!`,
      data: completed
    });
  } catch (error) {
    console.error('Error verifying pickup code:', error.message);
    return res.status(500).json(build500Response('Server error verifying pickup code.', error));
  }
});

// ==============================================================================
// 4. Notifications & School Holidays
// ==============================================================================

/**
 * @route   GET /api/requests/notifications
 * @desc    Get user notifications
 * @access  Public
 */
router.get('/notifications', async (req, res) => {
  try {
    const userId = req.query.userId || req.query.user_id;
    const notifs = await dbNotifications.getForUser(userId);
    return res.status(200).json({
      success: true,
      count: notifs.length,
      data: notifs
    });
  } catch (error) {
    return res.status(500).json(build500Response('Failed to fetch notifications.', error));
  }
});

/**
 * @route   PATCH /api/requests/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Public
 */
router.patch('/notifications/:id/read', async (req, res) => {
  try {
    await dbNotifications.markRead(req.params.id);
    return res.status(200).json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    return res.status(500).json(build500Response('Failed to mark notification read.', error));
  }
});

/**
 * @route   GET /api/requests/holidays
 * @desc    Get official Philippine school calendar non-working holidays
 * @access  Public
 */
router.get('/holidays', (req, res) => {
  return res.status(200).json({
    success: true,
    data: DEFAULT_PHILIPPINE_HOLIDAYS_2026
  });
});

/**
 * @route   GET /api/requests/audit-logs
 * @desc    Get system audit logs
 * @access  Public (Admin)
 */
router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await dbAuditLogs.getAll(150);
    return res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    return res.status(500).json(build500Response('Failed to retrieve audit logs.', error));
  }
});

// ==============================================================================
// 5. Core Document Requests CRUD
// ==============================================================================

/**
 * @route   GET /api/requests
 * @desc    Retrieve student document requests (supports ?studentId=, ?email=, ?userId= filter)
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { studentId, email, userId } = req.query;
    const requests = await dbRequests.getAll(studentId, email, userId);

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
    const quantity = parseInt(req.body.quantity, 10) || 1;
    const { dateSubmitted, userId } = req.body;

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

    if (quantity < 1 || quantity > 10) {
      errors.push('Quantity must be between 1 and 10 copies.');
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

    // Determine submission date (YYYY-MM-DD format in Philippine Time)
    let submissionDate = getPhilippineDateString();
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
      quantity,
      dateSubmitted: submissionDate,
      userId: userId || null
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
 * @desc    Update the status of a specific document request in-place
 * @access  Public (Admin)
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      pickupDate,
      pickup_date,
      rejectionReason,
      rejection_reason,
      claimedBy,
      claimantIdType,
      claimantIdNumber,
      adminName
    } = req.body;

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

    // Rejection requires a valid non-empty reason
    const resolvedRejectionReason = rejectionReason || rejection_reason;
    if (status === 'Rejected' && (!resolvedRejectionReason || !String(resolvedRejectionReason).trim())) {
      return res.status(400).json({
        success: false,
        message: 'A rejection reason is required when rejecting a request.'
      });
    }

    const resolvedPickupDate = pickupDate !== undefined ? pickupDate : pickup_date;
    const updatedRequest = await dbRequests.updateStatus(numericId, status, {
      pickupDate: resolvedPickupDate,
      rejectionReason: resolvedRejectionReason,
      claimedBy,
      claimantIdType,
      claimantIdNumber,
      adminName
    });

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
    const updatedRequest = await dbRequests.updateStatus(numericId, resolvedStatus, { pickupDate: resolvedPickupDate });

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
