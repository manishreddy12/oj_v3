'use strict';

const AppError = require('../../shared/errors/AppError');

class SubmitCodeDTO {
  constructor({ userId, problemId, language, sourceCode, testCases, username, problemTitle }) {
    this.userId = userId;
    this.problemId = problemId;
    this.language = language;
    this.sourceCode = sourceCode;
    this.testCases = testCases || [];
    this.username = username || '';
    this.problemTitle = problemTitle || '';
  }

  validate() {
    if (!this.userId) {
      throw AppError.badRequest('User ID is required');
    }
    if (!this.problemId) {
      throw AppError.badRequest('Problem ID is required');
    }
    const validLanguages = ['cpp', 'python', 'c'];
    if (!this.language || !validLanguages.includes(this.language)) {
      throw AppError.badRequest(`Language must be one of: ${validLanguages.join(', ')}`);
    }
    if (!this.sourceCode || this.sourceCode.trim().length === 0) {
      throw AppError.badRequest('Source code is required');
    }
  }
}

module.exports = SubmitCodeDTO;
