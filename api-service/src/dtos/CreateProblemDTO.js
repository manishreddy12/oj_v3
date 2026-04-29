'use strict';
const AppError = require('../../shared/errors/AppError');

class CreateProblemDTO {
  constructor({ title, description, difficulty, tags, constraints, testCases, boilerplateCode }) {
    this.title = title;
    this.description = description;
    this.difficulty = difficulty;
    this.tags = tags || [];
    this.constraints = constraints || '';
    this.testCases = testCases || [];
    this.boilerplateCode = boilerplateCode || { cpp: '', python: '', java: '' };
  }

   //Validate the DTO fields
   // @throws {AppError} if validation fails
   
  validate() {
    if (!this.title || this.title.trim().length === 0) {
      throw AppError.badRequest('Problem title is required');
    }
    if (!this.description || this.description.trim().length === 0) {
      throw AppError.badRequest('Problem description is required');
    }
    const validDifficulties = ['Easy', 'Medium', 'Hard'];
    if (!this.difficulty || !validDifficulties.includes(this.difficulty)) {
      throw AppError.badRequest(`Difficulty must be one of: ${validDifficulties.join(', ')}`);
    }
    if (!this.testCases || !Array.isArray(this.testCases) || this.testCases.length === 0) {
      throw AppError.badRequest('At least one test case is required');
    }
    for (const tc of this.testCases) {
      if (!tc.input && tc.input !== '') {
        throw AppError.badRequest('Each test case must have an input field');
      }
      if (!tc.expectedOutput && tc.expectedOutput !== '') {
        throw AppError.badRequest('Each test case must have an expectedOutput field');
      }
    }
  }
}

module.exports = CreateProblemDTO;
