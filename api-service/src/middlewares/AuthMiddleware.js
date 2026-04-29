'use strict';

const TokenManager = require('../utils/TokenManager');
const AppError = require('../../shared/errors/AppError');

class AuthMiddleware {
  constructor() {
    this.tokenManager = new TokenManager();
  }

    // Returns Express middleware that verifies JWT from Authorization header
    // @returns {Function}
   
  authenticate() {
    return (req, res, next) => {
      try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          throw AppError.unauthorized('Access denied. No token provided.');
        }

        const token = authHeader.split(' ')[1];
        const decoded = this.tokenManager.verifyToken(token);

        req.user = {
          userId: decoded.userId,
          role: decoded.role,
        };

        next();
      } catch (error) {
        if (error instanceof AppError) {
          next(error);
        } else {
          next(AppError.unauthorized('Invalid or expired token'));
        }
      }
    };
  }
}

module.exports = AuthMiddleware;
