'use strict';

const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema(
  {
    input: {
      type: String,
      required: [true, 'Test case input is required'],
    },
    expectedOutput: {
      type: String,
      required: [true, 'Expected output is required'],
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const problemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Problem title is required'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      required: [true, 'Problem description is required'],
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      required: [true, 'Difficulty level is required'],
    },
    tags: {
      type: [String],
      default: [],
    },
    constraints: {
      type: String,
      default: '',
    },
    testCases: {
      type: [testCaseSchema],
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: 'At least one test case is required',
      },
    },
    boilerplateCode: {
      cpp: { type: String, default: '' },
      python: { type: String, default: '' },
      java: { type: String, default: '' },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Problem creator is required'],
    },
  },
  {
    timestamps: true,
  }
);

const Problem = mongoose.model('Problem', problemSchema);

module.exports = Problem;
