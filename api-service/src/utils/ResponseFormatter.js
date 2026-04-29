'use strict';

class ResponseFormatter {
  /**
   * Format a success response
   * @param {object} res - Express response object
   * @param {number} statusCode
   * @param {string} message
   * @param {object} [data]
   * @returns {object}
   */
  static success(res, statusCode, message, data = null) {
    const response = {
      success: true,
      message,
    };
    if (data !== null) {
      response.data = data;
    }
    return res.status(statusCode).json(response);
  }

  static error(res, statusCode, message, errors = null) {
    const response = {
      success: false,
      message,
    };
    if (errors !== null) {
      response.errors = errors;
    }
    return res.status(statusCode).json(response);
  }
}

module.exports = ResponseFormatter;
