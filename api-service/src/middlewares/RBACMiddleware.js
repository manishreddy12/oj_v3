'use strict';

const AppError = require('../../shared/errors/AppError');

class RBACMiddleware {
  
  static authorize(...allowedRoles) {
    return (req, res, next) => {
      if (!req.user) {
        return next(AppError.unauthorized('Authentication required'));
      }

      if (!allowedRoles.includes(req.user.role)) {
        return next(
          AppError.forbidden(
            `Access denied. Required role(s): ${allowedRoles.join(', ')}`
          )
        );
      }

      next();
    };
  }
}

module.exports = RBACMiddleware;
