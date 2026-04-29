'use strict';

const request = require('supertest');

// Mock mongoose to prevent actual DB connections
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    connect: jest.fn().mockResolvedValue({ connection: { host: 'mock-host' } }),
    disconnect: jest.fn().mockResolvedValue(),
    model: actualMongoose.model.bind(actualMongoose),
    Schema: actualMongoose.Schema,
  };
});

const App = require('../src/app');

describe('Execution Service Health Check', () => {
  let app;

  beforeAll(() => {
    const appInstance = new App();
    app = appInstance.getApp();
  });

  test('GET /api/health should return 200 with success message', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message', 'Execution Service is running');
    expect(response.body).toHaveProperty('timestamp');
  });

  test('GET /api/nonexistent should return 404', async () => {
    const response = await request(app).get('/api/nonexistent');

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('success', false);
  });

  test('POST /api/submissions with missing fields should return 400', async () => {
    const response = await request(app)
      .post('/api/submissions')
      .send({ userId: '123' }) // missing required fields
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('success', false);
  });

  test('POST /api/submissions with invalid language should return 400', async () => {
    const response = await request(app)
      .post('/api/submissions')
      .send({
        userId: '123',
        problemId: '456',
        language: 'ruby',
        sourceCode: 'puts "hello"',
      })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.message).toContain('Language must be one of');
  });
});
