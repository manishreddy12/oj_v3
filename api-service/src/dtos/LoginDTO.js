'use strict';

const AppError = require('../../shared/errors/AppError');

class LoginDTO {
  constructor({ email, password }) {
    this.email = email;
    this.password = password;
  }
    // Validate the DTO fields
    // @throws {AppError} if validation fails
   
  validate() {
    if (!this.email || !/^\S+@\S+\.\S+$/.test(this.email)) {
      throw AppError.badRequest('A valid email is required');
    }
    if (!this.password || this.password.length === 0) {
      throw AppError.badRequest('Password is required');
    }
  }
}

module.exports = LoginDTO;
