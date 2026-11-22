const mongoose = require('mongoose');

/**
 * Request Schema for CCA DocTrack
 * Represents a student document request submitted through the system.
 */
const requestSchema = new mongoose.Schema(
  {
    studentName: {
      type: String,
      required: [true, 'Student name is required.'],
      trim: true,
      maxlength: [100, 'Student name cannot exceed 100 characters.']
    },
    studentId: {
      type: String,
      required: [true, 'Student ID is required.'],
      trim: true,
      maxlength: [30, 'Student ID cannot exceed 30 characters.']
    },
    documentType: {
      type: String,
      required: [true, 'Document type is required.'],
      enum: {
        values: [
          'Report Card',
          'Certificate of Enrollment',
          'Good Moral Certificate',
          'Transcript of Records'
        ],
        message: '{VALUE} is not a valid document type.'
      }
    },
    purpose: {
      type: String,
      required: [true, 'Purpose of request is required.'],
      trim: true,
      maxlength: [500, 'Purpose cannot exceed 500 characters.']
    },
    dateSubmitted: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'Processing', 'Completed'],
        message: '{VALUE} is not a valid status.'
      },
      default: 'Pending'
    }
  },
  {
    timestamps: true // Automatically manages createdAt and updatedAt
  }
);

module.exports = mongoose.model('Request', requestSchema);
