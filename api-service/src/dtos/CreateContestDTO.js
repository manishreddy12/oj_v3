'use strict';

const AppError = require('../../shared/errors/AppError');

class CreateContestDTO {
  constructor({ title, description, problems, startTime, endTime, registrationDeadline, isPublic }) {
    this.title = title;
    this.description = description || '';
    this.problems = problems || [];
    this.startTime = startTime;
    this.endTime = endTime;
    this.registrationDeadline = registrationDeadline || null;
    this.isPublic = isPublic !== undefined ? isPublic : false;
  }

  validate() {
    if (!this.title || this.title.trim().length === 0) {
      throw AppError.badRequest('Contest title is required');
    }
    if (!this.startTime) {
      throw AppError.badRequest('Start time is required');
    }
    if (!this.endTime) {
      throw AppError.badRequest('End time is required');
    }
    const start = new Date(this.startTime);
    const end = new Date(this.endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw AppError.badRequest('Invalid date format for start or end time');
    }
    if (end <= start) {
      throw AppError.badRequest('End time must be after start time');
    }
    if (this.registrationDeadline) {
      const deadline = new Date(this.registrationDeadline);
      if (isNaN(deadline.getTime())) {
        throw AppError.badRequest('Invalid date format for registration deadline');
      }
    }
  }
}

module.exports = CreateContestDTO;
