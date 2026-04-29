'use strict';

const AppError = require('../../shared/errors/AppError');

class RegisterUserDTO {
  constructor({ username, email, password, role, userimage }) {
    this.username = username;
    this.email = email;
    this.password = password;
    this.role = role || 'student';
    this.userimage = userimage || '';
  }

  
  //  Validate the DTO fields
  //  @throws {AppError} if validation fails
  validate() {
    if (!this.username || this.username.trim().length < 3) {
      throw AppError.badRequest('Username must be at least 3 characters');
    }
    if (!this.email || !/^\S+@\S+\.\S+$/.test(this.email)) {
      throw AppError.badRequest('A valid email is required');
    }
    if (!this.password || this.password.length < 6) {
      throw AppError.badRequest('Password must be at least 6 characters');
    }
    const validRoles = ['student', 'problem_setter', 'admin', 'guest'];
    if (!validRoles.includes(this.role)) {
      throw AppError.badRequest(`Role must be one of: ${validRoles.join(', ')}`);
    }
  }
}

module.exports = RegisterUserDTO;
