'use strict';

const jwt = require('jsonwebtoken');
const appConfig = require('../config/AppConfig');

class TokenManager {
  generateToken(payload) {
    return jwt.sign(payload, appConfig.jwtSecret, {
      expiresIn: appConfig.jwtExpiry,
    });
  }

  verifyToken(token) {
    return jwt.verify(token, appConfig.jwtSecret);
  }
}

module.exports = TokenManager;
