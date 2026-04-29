'use strict';

const AppError = require('../../shared/errors/AppError');
const Logger = require('../../shared/logger/Logger');
const ResponseFormatter = require('../utils/ResponseFormatter');

class ErrorMiddleware {
  constructor() {
    this.logger = new Logger('ErrorMiddleware');
  }

  handleError() {
    return (err, req, res, _next) => {
      if (err instanceof AppError) {
        this.logger.warn(`Operational error: ${err.message}`, {
          statusCode: err.statusCode,
          path: req.originalUrl,
        });
        return ResponseFormatter.error(res, err.statusCode, err.message);
      }

      if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((e) => e.message);
        this.logger.warn('Validation error', { messages });
        return ResponseFormatter.error(res, 400, 'Validation Error', messages);
      }
      if (err.code === 11000) {
        const field = Object.keys(err.keyValue).join(', ');
        this.logger.warn(`Duplicate key error: ${field}`);
        return ResponseFormatter.error(res, 409, `Duplicate value for: ${field}`);
      }

      // Mongoose cast error (invalid ObjectId)
      if (err.name === 'CastError') {
        this.logger.warn(`Invalid ID: ${err.value}`);
        return ResponseFormatter.error(res, 400, `Invalid ID: ${err.value}`);
      }

      this.logger.error('Unexpected error', {
        message: err.message,
        stack: err.stack,
      });
      return ResponseFormatter.error(res, 500, 'Internal Server Error');
    };
  }
}

module.exports = ErrorMiddleware;
