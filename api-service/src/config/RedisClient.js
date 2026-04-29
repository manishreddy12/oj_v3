'use strict';

const Logger = require('../../shared/logger/Logger');

/**
 * Redis client wrapper with graceful fallback to in-memory cache.
 * If Redis is not available, uses a simple Map for caching.
 */
class RedisClient {
  constructor() {
    this.logger = new Logger('RedisClient');
    this.client = null;
    this.connected = false;
    this.fallbackCache = new Map();
    this.DEFAULT_TTL = 300; // 5 minutes
  }

  async connect(redisUrl) {
    try {
      const redis = require('redis');
      this.client = redis.createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: false, // Don't retry — fall back to in-memory immediately
          connectTimeout: 5000,
        },
      });

      this.client.on('error', (err) => {
        this.logger.warn(`Redis error: ${err.message}. Using in-memory fallback.`);
        this.connected = false;
      });

      this.client.on('connect', () => {
        this.logger.info('Redis connected');
        this.connected = true;
      });

      await this.client.connect();
      this.connected = true;
    } catch (error) {
      this.logger.warn(`Redis connection failed: ${error.message}. Using in-memory fallback cache.`);
      this.connected = false;
    }
  }

  async get(key) {
    try {
      if (this.connected && this.client) {
        const data = await this.client.get(key);
        return data ? JSON.parse(data) : null;
      }
      // Fallback
      const item = this.fallbackCache.get(key);
      if (item && item.expiry > Date.now()) {
        return item.data;
      }
      this.fallbackCache.delete(key);
      return null;
    } catch (error) {
      this.logger.warn(`Cache get error for key ${key}: ${error.message}`);
      return null;
    }
  }

  async set(key, value, ttl = this.DEFAULT_TTL) {
    try {
      if (this.connected && this.client) {
        await this.client.set(key, JSON.stringify(value), { EX: ttl });
        return;
      }
      // Fallback
      this.fallbackCache.set(key, {
        data: value,
        expiry: Date.now() + ttl * 1000,
      });
    } catch (error) {
      this.logger.warn(`Cache set error for key ${key}: ${error.message}`);
    }
  }

  async delete(key) {
    try {
      if (this.connected && this.client) {
        await this.client.del(key);
        return;
      }
      this.fallbackCache.delete(key);
    } catch (error) {
      this.logger.warn(`Cache delete error for key ${key}: ${error.message}`);
    }
  }

  async disconnect() {
    if (this.client && this.connected) {
      await this.client.quit();
      this.logger.info('Redis disconnected');
    }
  }
}

module.exports = RedisClient;
