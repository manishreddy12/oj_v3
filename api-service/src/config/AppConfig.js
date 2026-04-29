'use strict';
require('dotenv').config();

class AppConfig {
  constructor() {
    this.port = process.env.PORT || 5000;
    this.mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/online_judge';
    this.jwtSecret = process.env.JWT_SECRET || 'supersecretkey';
    this.jwtExpiry = process.env.JWT_EXPIRY || '1d';
    this.executionServiceUrl = process.env.EXECUTION_SERVICE_URL || 'http://localhost:5001';
    this.nodeEnv = process.env.NODE_ENV || 'development';
    this.redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.cacheEnabled = process.env.CACHE_ENABLED === 'true';
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  }
}

module.exports = new AppConfig();
