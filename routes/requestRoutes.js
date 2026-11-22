const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Request = require('../models/Request');

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
 * @desc    Retrieve student document requests from MongoDB Atlas (supports ?studentId= filter)
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    // Check if database is connected before querying
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database service unavailable. Please check MongoDB Atlas connection.'
      });
    }

    const { studentId } = req.query;
    const filter = {};

    if (studentId && studentId.trim()) {
      filter.studentId = studentId.trim();
    }

    // Retrieve records sorted by submission date descending (newest first)
    const requests = await Request.find(filter).sort({ dateSubmitted: -1, createdAt: -1 });

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
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database service unavailable. Please check MongoDB Atlas connection.'
      });
    }

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

    // Prepare request document
    const newRequestData = {
      studentName: studentName.trim(),
      studentId: studentId.trim(),
      course: course ? course.trim() : 'BS Information Technology',
      email: email ? email.trim() : '',
      documentType: documentType.trim(),
      purpose: purpose.trim(),
      status: 'Pending'
    };

    // If a custom valid dateSubmitted is provided, use it; otherwise defaults to now
    if (dateSubmitted) {
      const parsedDate = new Date(dateSubmitted);
      if (!isNaN(parsedDate.getTime())) {
        newRequestData.dateSubmitted = parsedDate;
      }
    }

    const savedRequest = await Request.create(newRequestData);

    return res.status(201).json({
      success: true,
      message: 'Document request created successfully.',
      data: savedRequest
    });
  } catch (error) {
    console.error('Error creating document request:', error.message);

    // Handle Mongoose schema validation error
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error while saving document request.',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/requests/:id
 * @desc    Retrieve a specific document request by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request ID format.'
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database service unavailable. Please check MongoDB Atlas connection.'
      });
    }

    const request = await Request.findById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: `Document request with ID '${id}' was not found.`
      });
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
    const { status } = req.body;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
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

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database service unavailable. Please check MongoDB Atlas connection.'
      });
    }

    // Update document in MongoDB Atlas
    const updatedRequest = await Request.findByIdAndUpdate(
      id,
      { status: status },
      { new: true, runValidators: true }
    );

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
