'use strict';

const mongoose = require('mongoose');
const Logger = require('../../shared/logger/Logger');

class Database {
  constructor() {
    this.logger = new Logger('Database');
    this.connection = null;
  }

  /** Connect to MongoDB
   */
  async connect(uri) {
    try {
      this.connection = await mongoose.connect(uri);
      this.logger.info(`MongoDB connected: ${this.connection.connection.host}`);
    } catch (error) {
      this.logger.error('MongoDB connection failed', { error: error.message });
      process.exit(1);
    }
  }

  /** Disconnect from MongoDB
   */
  async disconnect() {
    try {
      await mongoose.disconnect();
      this.logger.info('MongoDB disconnected');
    } catch (error) {
      this.logger.error('MongoDB disconnection failed', { error: error.message });
    }
  }
}

module.exports = Database;
