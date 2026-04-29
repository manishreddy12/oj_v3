'use strict';

/**
 * Deployment Smoke Tests
 *
 * Run after deploying services to verify they are up and responding.
 * Set environment variables before running:
 *
 *   API_URL=https://your-api.onrender.com \
 *   EXEC_URL=http://your-ec2-ip:5001 \
 *   npx jest tests/deployment-smoke.test.js
 *
 * Prerequisites: npm install -g jest (or use npx)
 */

const API_URL = process.env.API_URL || 'http://localhost:5000';
const EXEC_URL = process.env.EXEC_URL || 'http://localhost:5001';

describe('Deployment Smoke Tests', () => {
  // ── API Service ──
  describe('API Service', () => {
    test('Health check should return 200', async () => {
      const response = await fetch(`${API_URL}/api/health`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('API Service is running');
    });

    test('GET /api/problems should return 200', async () => {
      const response = await fetch(`${API_URL}/api/problems`);
      expect(response.status).toBe(200);
    });

    test('GET /api/contests should return 200', async () => {
      const response = await fetch(`${API_URL}/api/contests`);
      expect(response.status).toBe(200);
    });

    test('Invalid route should return 404', async () => {
      const response = await fetch(`${API_URL}/api/nonexistent`);
      expect(response.status).toBe(404);
    });
  });

  // ── Execution Service ──
  describe('Execution Service', () => {
    test('Health check should return 200', async () => {
      const response = await fetch(`${EXEC_URL}/api/health`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Execution Service is running');
    });

    test('Submit Python code should return 201 with verdict', async () => {
      const response = await fetch(`${EXEC_URL}/api/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'smoke-test-user',
          problemId: 'smoke-test-problem',
          language: 'python',
          sourceCode: 'n = int(input())\nprint(n * 2)',
          testCases: [
            { input: '5', expectedOutput: '10' },
          ],
          username: 'SmokeTestUser',
          problemTitle: 'Smoke Test Problem',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.submission).toBeDefined();
      expect(data.data.submission.status).toBe('Accepted');
    });

    test('Submit code with wrong answer should return verdict with details', async () => {
      const response = await fetch(`${EXEC_URL}/api/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'smoke-test-user',
          problemId: 'smoke-test-problem',
          language: 'python',
          sourceCode: 'n = int(input())\nprint(n + 1)',
          testCases: [
            { input: '5', expectedOutput: '10' },
          ],
          username: 'SmokeTestUser',
          problemTitle: 'Smoke Test Problem',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data.submission.status).toBe('Wrong Answer');
      expect(data.data.submission.failedTestCase).toBe(1);
      expect(data.data.submission.output).toBeDefined();
      expect(data.data.submission.expectedOutput).toBeDefined();
    });

    test('Submit with missing fields should return 400', async () => {
      const response = await fetch(`${EXEC_URL}/api/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'smoke-test-user',
        }),
      });

      expect(response.status).toBe(400);
    });

    test('Submit with invalid language should return 400', async () => {
      const response = await fetch(`${EXEC_URL}/api/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'smoke-test-user',
          problemId: 'smoke-test-problem',
          language: 'java',
          sourceCode: 'System.out.println("hello")',
        }),
      });

      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.message).toContain('Language must be one of');
    });

    test('Invalid route should return 404', async () => {
      const response = await fetch(`${EXEC_URL}/api/nonexistent`);
      expect(response.status).toBe(404);
    });
  });

  // ── Cross-Service ──
  describe('Cross-Service Communication', () => {
    test('API service EXECUTION_SERVICE_URL should be reachable', async () => {
      // This tests that the execution service health endpoint is accessible
      // from the perspective of whoever runs these tests
      const response = await fetch(`${EXEC_URL}/api/health`);
      expect(response.ok).toBe(true);
    });
  });
});
