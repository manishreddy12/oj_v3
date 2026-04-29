'use strict';

const request = require('supertest');

// Force NoCacheClient for health check tests (no Redis needed)
process.env.CACHE_ENABLED = 'false';

// Mock mongoose to prevent actual DB connections
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    connect: jest.fn().mockResolvedValue({ connection: { host: 'mock-host' } }),
    disconnect: jest.fn().mockResolvedValue(),
    model: jest.fn().mockReturnValue({}),
    Schema: actualMongoose.Schema,
  };
});

// We need to require App after mocking
const App = require('../src/app');

describe('API Service Health Check', () => {
  let app;

  beforeAll(async () => {
    const appInstance = new App();
    await appInstance.initializeAsync();
    app = appInstance.getApp();
  });

  test('GET /api/health should return 200 with success message', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message', 'API Service is running');
    expect(response.body).toHaveProperty('timestamp');
  });

  test('GET /api/nonexistent should return 404', async () => {
    const response = await request(app).get('/api/nonexistent');

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('success', false);
  });
});

describe('Cache Client Behavior', () => {
  test('NoCacheClient get() should return null', async () => {
    const NoCacheClient = require('../src/config/NoCacheClient');
    const client = new NoCacheClient();
    await client.connect();

    const result = await client.get('any-key');
    expect(result).toBeNull();
  });

  test('NoCacheClient set() and delete() should not throw', async () => {
    const NoCacheClient = require('../src/config/NoCacheClient');
    const client = new NoCacheClient();

    await expect(client.set('key', 'value', 300)).resolves.not.toThrow();
    await expect(client.delete('key')).resolves.not.toThrow();
    await expect(client.disconnect()).resolves.not.toThrow();
  });

  test('RedisClient should fallback to in-memory when Redis is unavailable', async () => {
    const RedisClient = require('../src/config/RedisClient');
    const client = new RedisClient();

    // Connect to a non-existent Redis — should fallback gracefully
    await client.connect('redis://localhost:59999');

    // Even if connection failed, it should work with in-memory fallback
    await client.set('test-key', { hello: 'world' }, 60);
    const result = await client.get('test-key');
    expect(result).toEqual({ hello: 'world' });

    await client.delete('test-key');
    const deleted = await client.get('test-key');
    expect(deleted).toBeNull();
  }, 15000); // 15s timeout for Redis connection retry
});
