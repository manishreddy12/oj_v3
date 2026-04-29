'use strict';

const express = require('express');
const AuthMiddleware = require('../middlewares/AuthMiddleware');
const RBACMiddleware = require('../middlewares/RBACMiddleware');

class UserRoutes {
  constructor(userController) {
    this.router = express.Router();
    this.userController = userController;
    this.authMiddleware = new AuthMiddleware();
    this._initializeRoutes();
  }

  _initializeRoutes() {
    // All user routes require authentication
    this.router.use(this.authMiddleware.authenticate());

    // Get current user's profile
    this.router.get('/profile', this.userController.getProfile());

    // Update profile image (authenticated user)
    this.router.put('/profile/image', this.userController.updateProfileImage());

    // Admin-only routes
    this.router.get(
      '/',
      RBACMiddleware.authorize('admin'),
      this.userController.getAllUsers()
    );

    this.router.get(
      '/:id',
      RBACMiddleware.authorize('admin'),
      this.userController.getUserById()
    );

    this.router.put(
      '/:id',
      RBACMiddleware.authorize('admin'),
      this.userController.updateUser()
    );

    this.router.delete(
      '/:id',
      RBACMiddleware.authorize('admin'),
      this.userController.deleteUser()
    );
  }

  getRouter() {
    return this.router;
  }
}

module.exports = UserRoutes;
