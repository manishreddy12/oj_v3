'use strict';

const Logger = require('../../shared/logger/Logger');

/**
 * No-op cache client — same interface as RedisClient.
 * Used when Redis is not available (e.g., Render deployment).
 * All get() calls return null; set() and delete() are no-ops.
 */
class NoCacheClient {
  constructor() {
    this.logger = new Logger('NoCacheClient');
  }

  async connect() {
    this.logger.info('Cache disabled — using NoCacheClient (all cache operations are no-ops)');
  }

  async get(key) {
    return null;
  }

  async set(key, value, ttl) {
    // no-op
  }

  async delete(key) {
    // no-op
  }

  async disconnect() {
    // no-op
  }
}

module.exports = NoCacheClient;
