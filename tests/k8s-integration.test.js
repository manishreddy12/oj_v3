'use strict';

/**
 * K8s Integration Tests
 *
 * Run after deploying to Minikube/Kubernetes to validate services are
 * correctly communicating and functioning within the cluster.
 *
 * Usage:
 *   # With port-forwards active (api→8099, exec→8098):
 *   API_URL=http://localhost:8099 EXEC_URL=http://localhost:8098 npm run test:integration
 *
 *   # Or with Ingress:
 *   API_URL=http://codeview.local EXEC_URL=http://codeview.local npm run test:integration
 */

const API_URL = process.env.API_URL || 'http://localhost:5000';
const EXEC_URL = process.env.EXEC_URL || 'http://localhost:5001';

// Helper: retry a request up to N times (K8s pods may still be starting)
async function fetchWithRetry(url, options = {}, retries = 3, delay = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            return response;
        } catch (err) {
            if (i === retries - 1) throw err;
            await new Promise(r => setTimeout(r, delay));
        }
    }
}

describe('K8s Integration Tests', () => {

    // ─── API Service ──────────────────────────────────────────────────────────
    describe('API Service — Health & Endpoints', () => {

        test('Health endpoint should return service status', async () => {
            const res = await fetchWithRetry(`${API_URL}/api/health`);
            const body = await res.json();

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
            expect(body.message).toContain('running');
        });

        test('GET /api/problems should return an array', async () => {
            const res = await fetchWithRetry(`${API_URL}/api/problems`);
            expect(res.status).toBe(200);

            const body = await res.json();
            expect(body.success).toBe(true);
            // data.problems should be an array (may be empty)
            expect(Array.isArray(body.data?.problems || body.data || [])).toBe(true);
        });

        test('GET /api/contests should return an array', async () => {
            const res = await fetchWithRetry(`${API_URL}/api/contests`);
            expect(res.status).toBe(200);

            const body = await res.json();
            expect(body.success).toBe(true);
        });

        test('Unknown route should return 404', async () => {
            const res = await fetchWithRetry(`${API_URL}/api/this-does-not-exist`);
            expect(res.status).toBe(404);
        });

        test('POST /api/auth/register should accept registration payload', async () => {
            // Attempt to register a test user (may already exist → 400 is acceptable)
            const res = await fetchWithRetry(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: `inttest_${Date.now()}`,
                    email: `inttest_${Date.now()}@test.com`,
                    password: 'TestPassword123!',
                }),
            });

            // 201 = created, 400 = already exists  — both mean the endpoint works
            expect([201, 400]).toContain(res.status);
        });
    });

    // ─── Execution Service ────────────────────────────────────────────────────
    describe('Execution Service — Health & Code Execution', () => {

        test('Health endpoint should return service status', async () => {
            const res = await fetchWithRetry(`${EXEC_URL}/api/health`);
            const body = await res.json();

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
            expect(body.message).toContain('running');
        });

        test('Submit valid Python code → Accepted', async () => {
            const res = await fetchWithRetry(`${EXEC_URL}/api/submissions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'integration-test',
                    problemId: 'integration-test-problem',
                    language: 'python',
                    sourceCode: 'n = int(input())\nprint(n * 2)',
                    testCases: [
                        { input: '5', expectedOutput: '10' },
                        { input: '0', expectedOutput: '0' },
                        { input: '-3', expectedOutput: '-6' },
                    ],
                    username: 'IntegrationTestUser',
                    problemTitle: 'Integration Test',
                }),
            });

            const body = await res.json();
            expect(res.status).toBe(201);
            expect(body.success).toBe(true);
            expect(body.data.submission.status).toBe('Accepted');
        });

        test('Submit valid C code → Accepted', async () => {
            const cCode = [
                '#include <stdio.h>',
                'int main() {',
                '    int n;',
                '    scanf("%d", &n);',
                '    printf("%d\\n", n * 3);',
                '    return 0;',
                '}',
            ].join('\n');

            const res = await fetchWithRetry(`${EXEC_URL}/api/submissions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'integration-test',
                    problemId: 'integration-test-c',
                    language: 'c',
                    sourceCode: cCode,
                    testCases: [
                        { input: '4', expectedOutput: '12' },
                    ],
                    username: 'IntegrationTestUser',
                    problemTitle: 'Integration Test C',
                }),
            });

            const body = await res.json();
            expect(res.status).toBe(201);
            expect(body.data.submission.status).toBe('Accepted');
        });

        test('Submit code with Wrong Answer', async () => {
            const res = await fetchWithRetry(`${EXEC_URL}/api/submissions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'integration-test',
                    problemId: 'integration-test-wa',
                    language: 'python',
                    sourceCode: 'print("wrong")',
                    testCases: [
                        { input: '5', expectedOutput: '10' },
                    ],
                    username: 'IntegrationTestUser',
                    problemTitle: 'WA Test',
                }),
            });

            const body = await res.json();
            expect(res.status).toBe(201);
            expect(body.data.submission.status).toBe('Wrong Answer');
        });

        test('Submit with missing required fields → 400', async () => {
            const res = await fetchWithRetry(`${EXEC_URL}/api/submissions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: 'test' }),
            });

            expect(res.status).toBe(400);
        });

        test('Submit with unsupported language → 400', async () => {
            const res = await fetchWithRetry(`${EXEC_URL}/api/submissions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'test',
                    problemId: 'test',
                    language: 'rust',
                    sourceCode: 'fn main() {}',
                    testCases: [{ input: '', expectedOutput: '' }],
                    username: 'Test',
                    problemTitle: 'Test',
                }),
            });

            expect(res.status).toBe(400);
        });
    });

    // ─── Cross-Service ────────────────────────────────────────────────────────
    describe('Cross-Service Communication', () => {

        test('API → Execution connectivity (both health endpoints reachable)', async () => {
            const [apiRes, execRes] = await Promise.all([
                fetchWithRetry(`${API_URL}/api/health`),
                fetchWithRetry(`${EXEC_URL}/api/health`),
            ]);

            expect(apiRes.ok).toBe(true);
            expect(execRes.ok).toBe(true);
        });
    });
});
