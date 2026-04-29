'use strict';

const ResponseFormatter = require('../utils/ResponseFormatter');
const AppError = require('../../shared/errors/AppError');

class UserController {

  constructor(userService) {
    this.userService = userService;
  }

  // GET /api/users
  getAllUsers() {
    return async (req, res, next) => {
      try {
        const users = await this.userService.getAllUsers();
        return ResponseFormatter.success(res, 200, 'Users retrieved successfully', { users });
      } catch (error) {
        next(error);
      }
    };
  }

  // GET /api/users/:id
  getUserById() {
    return async (req, res, next) => {
      try {
        const user = await this.userService.getUserById(req.params.id);
        return ResponseFormatter.success(res, 200, 'User retrieved successfully', { user });
      } catch (error) {
        next(error);
      }
    };
  }

  // GET /api/users/profile
  getProfile() {
    return async (req, res, next) => {
      try {
        const user = await this.userService.getUserById(req.user.userId);
        return ResponseFormatter.success(res, 200, 'Profile retrieved successfully', { user });
      } catch (error) {
        next(error);
      }
    };
  }

  // PUT /api/users/:id (admin can update role)
  updateUser() {
    return async (req, res, next) => {
      try {
        const user = await this.userService.updateUser(
          req.params.id,
          req.body,
          req.user.role // Pass caller's role for authorization
        );
        return ResponseFormatter.success(res, 200, 'User updated successfully', { user });
      } catch (error) {
        next(error);
      }
    };
  }

  // PUT /api/users/profile/image
  updateProfileImage() {
    return async (req, res, next) => {
      try {
        const { imageUrl } = req.body;
        if (!imageUrl) {
          throw AppError.badRequest('imageUrl is required');
        }
        const user = await this.userService.updateProfileImage(req.user.userId, imageUrl);
        return ResponseFormatter.success(res, 200, 'Profile image updated successfully', { user });
      } catch (error) {
        next(error);
      }
    };
  }

  // DELETE /api/users/:id
  deleteUser() {
    return async (req, res, next) => {
      try {
        await this.userService.deleteUser(req.params.id);
        return ResponseFormatter.success(res, 200, 'User deleted successfully');
      } catch (error) {
        next(error);
      }
    };
  }
}

module.exports = UserController;
