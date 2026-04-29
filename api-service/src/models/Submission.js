'use strict';

const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    user: { type: String, required: true },
    username: { type: String, default: '' },
    problem: { type: String, required: true },
    problemTitle: { type: String, default: '' },
    language: {
      type: String,
      enum: ['cpp', 'python', 'c'],
      required: true,
    },
    sourceCode: { type: String, default: '' },
    status: {
      type: String,
      enum: [
        'Pending', 'Accepted', 'Wrong Answer',
        'Time Limit Exceeded', 'Runtime Error', 'Compilation Error',
      ],
      default: 'Pending',
    },
    executionTime: { type: Number, default: 0 },
    memoryUsed: { type: Number, default: 0 },
    output: { type: String, default: '' },
    error: { type: String, default: '' },
    failedTestCase: { type: Number, default: null },
    totalTestCases: { type: Number, default: 0 },
    expectedOutput: { type: String, default: '' },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

const Submission = mongoose.model('Submission', submissionSchema);

module.exports = Submission;
