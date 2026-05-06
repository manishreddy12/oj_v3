'use strict';

const AppError = require('../../shared/errors/AppError');
const Logger = require('../../shared/logger/Logger');
const PasswordHasher = require('../utils/PasswordHasher');

class UserService {

  constructor(userRepository) {
    this.userRepository = userRepository;
    this.logger = new Logger('UserService');
    this.passwordHasher = new PasswordHasher();
  }

  async getAllUsers() {
    return this.userRepository.findAll();
  }

  async getUserById(id) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw AppError.notFound('User not found');
    }
    return user;
  }

  /**
   * Update user. Admins can update roles.
   * @param {string} id - user ID to update
   * @param {object} updateData - fields to update
   * @param {string} callerRole - role of the caller (for authorization)
   */
  async updateUser(id, updateData, callerRole = 'student') {
    // Prevent updating password directly
    delete updateData.password;

    // Only admins can update roles
    if (callerRole !== 'admin') {
      delete updateData.role;
    }

    const user = await this.userRepository.update(id, updateData);
    if (!user) {
      throw AppError.notFound('User not found');
    }
    this.logger.info(`User updated: ${user.email}`);
    return user;
  }

  /**
   * Update profile image for a user
   */
  async updateProfileImage(userId, imageUrl) {
    const user = await this.userRepository.update(userId, { userimage: imageUrl });
    if (!user) {
      throw AppError.notFound('User not found');
    }
    this.logger.info(`Profile image updated for: ${user.email}`);
    return user;
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await this.userRepository.findByIdWithPassword(userId);
    if (!user) {
      throw AppError.notFound('User not found');
    }
    const isMatch = await this.passwordHasher.compare(currentPassword, user.password);
    if (!isMatch) {
      throw AppError.badRequest('Current password is incorrect');
    }
    const hashed = await this.passwordHasher.hash(newPassword);
    await this.userRepository.update(userId, { password: hashed });
    this.logger.info(`Password changed for: ${user.email}`);
  }

  async deleteUser(id) {
    const user = await this.userRepository.delete(id);
    if (!user) {
      throw AppError.notFound('User not found');
    }
    this.logger.info(`User deleted: ${user.email}`);
    return user;
  }
}

module.exports = UserService;
