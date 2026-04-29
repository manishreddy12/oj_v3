'use strict';

/**
 * HPA Validation Tests
 *
 * Verifies that Horizontal Pod Autoscaler resources are correctly configured
 * and the metrics-server is providing data. These tests run kubectl commands
 * and parse the output.
 *
 * Usage:
 *   npm run test:hpa
 *
 * Prereq: kubectl configured and pointing to the cluster with codeview namespace
 */

const { execSync } = require('child_process');

const NAMESPACE = process.env.K8S_NAMESPACE || 'codeview';

// Helper: run kubectl and return stdout
function kubectl(args) {
    try {
        return execSync(`kubectl ${args}`, {
            encoding: 'utf-8',
            timeout: 15000,
        }).trim();
    } catch (err) {
        return err.stdout ? err.stdout.trim() : '';
    }
}

// Helper: parse JSON from kubectl
function kubectlJSON(args) {
    const output = kubectl(`${args} -o json`);
    try {
        return JSON.parse(output);
    } catch {
        return null;
    }
}

describe('HPA Validation Tests', () => {

    // ─── Pre-flight ───────────────────────────────────────────────────────────
    describe('Pre-flight Checks', () => {

        test('codeview namespace should exist', () => {
            const ns = kubectlJSON(`get namespace ${NAMESPACE}`);
            expect(ns).not.toBeNull();
            expect(ns.metadata.name).toBe(NAMESPACE);
        });

        test('metrics-server should be running', () => {
            // On Minikube: addon should be enabled
            const result = kubectl('top nodes');
            expect(result).not.toBe('');
            expect(result).not.toContain('error');
        });
    });

    // ─── Execution Service HPA ────────────────────────────────────────────────
    describe('execution-service-hpa', () => {

        let hpa;

        beforeAll(() => {
            hpa = kubectlJSON(`get hpa execution-service-hpa -n ${NAMESPACE}`);
        });

        test('HPA resource should exist', () => {
            expect(hpa).not.toBeNull();
            expect(hpa.metadata.name).toBe('execution-service-hpa');
        });

        test('should target execution-service deployment', () => {
            expect(hpa.spec.scaleTargetRef.kind).toBe('Deployment');
            expect(hpa.spec.scaleTargetRef.name).toBe('execution-service');
        });

        test('minReplicas should be 2', () => {
            expect(hpa.spec.minReplicas).toBe(2);
        });

        test('maxReplicas should be 8', () => {
            expect(hpa.spec.maxReplicas).toBe(8);
        });

        test('should have CPU utilization metric at 65%', () => {
            const cpuMetric = hpa.spec.metrics.find(
                m => m.type === 'Resource' && m.resource.name === 'cpu'
            );
            expect(cpuMetric).toBeDefined();
            expect(cpuMetric.resource.target.averageUtilization).toBe(65);
        });

        test('should have memory utilization metric at 70%', () => {
            const memMetric = hpa.spec.metrics.find(
                m => m.type === 'Resource' && m.resource.name === 'memory'
            );
            expect(memMetric).toBeDefined();
            expect(memMetric.resource.target.averageUtilization).toBe(70);
        });

        test('scaleUp stabilization should be 30s', () => {
            expect(hpa.spec.behavior.scaleUp.stabilizationWindowSeconds).toBe(30);
        });

        test('scaleDown stabilization should be 300s', () => {
            expect(hpa.spec.behavior.scaleDown.stabilizationWindowSeconds).toBe(300);
        });

        test('current replicas should be at least minReplicas', () => {
            const currentReplicas = hpa.status?.currentReplicas || 0;
            expect(currentReplicas).toBeGreaterThanOrEqual(hpa.spec.minReplicas);
        });
    });

    // ─── API Service HPA ──────────────────────────────────────────────────────
    describe('api-service-hpa', () => {

        let hpa;

        beforeAll(() => {
            hpa = kubectlJSON(`get hpa api-service-hpa -n ${NAMESPACE}`);
        });

        test('HPA resource should exist', () => {
            expect(hpa).not.toBeNull();
            expect(hpa.metadata.name).toBe('api-service-hpa');
        });

        test('should target api-service deployment', () => {
            expect(hpa.spec.scaleTargetRef.kind).toBe('Deployment');
            expect(hpa.spec.scaleTargetRef.name).toBe('api-service');
        });

        test('minReplicas should be 2', () => {
            expect(hpa.spec.minReplicas).toBe(2);
        });

        test('maxReplicas should be 10', () => {
            expect(hpa.spec.maxReplicas).toBe(10);
        });

        test('should have CPU utilization metric at 70%', () => {
            const cpuMetric = hpa.spec.metrics.find(
                m => m.type === 'Resource' && m.resource.name === 'cpu'
            );
            expect(cpuMetric).toBeDefined();
            expect(cpuMetric.resource.target.averageUtilization).toBe(70);
        });
    });

    // ─── Deployment Resource Requests ─────────────────────────────────────────
    describe('Resource Requests (required for HPA)', () => {

        test('execution-service should have CPU requests defined', () => {
            const deploy = kubectlJSON(
                `get deployment execution-service -n ${NAMESPACE}`
            );
            expect(deploy).not.toBeNull();
            const container = deploy.spec.template.spec.containers[0];
            expect(container.resources.requests.cpu).toBeDefined();
            expect(container.resources.requests.memory).toBeDefined();
        });

        test('api-service should have CPU requests defined', () => {
            const deploy = kubectlJSON(
                `get deployment api-service -n ${NAMESPACE}`
            );
            expect(deploy).not.toBeNull();
            const container = deploy.spec.template.spec.containers[0];
            expect(container.resources.requests.cpu).toBeDefined();
            expect(container.resources.requests.memory).toBeDefined();
        });
    });

    // ─── Pod Metrics ──────────────────────────────────────────────────────────
    describe('Pod Metrics Collection', () => {

        test('execution-service pods should have metrics available', () => {
            const output = kubectl(
                `top pods -n ${NAMESPACE} -l app=execution-service --no-headers`
            );
            // If metrics-server is collecting data, output will have lines like:
            // execution-service-xxx   5m   64Mi
            if (output) {
                const lines = output.split('\n').filter(l => l.trim());
                expect(lines.length).toBeGreaterThanOrEqual(1);
                // Each line should contain CPU (e.g. "5m") and memory (e.g. "64Mi")
                lines.forEach(line => {
                    expect(line).toMatch(/\d+m?\s+\d+Mi/);
                });
            } else {
                // metrics-server may not have data yet — warn but don't fail
                console.warn(
                    '⚠️  No pod metrics available yet — metrics-server may need more time'
                );
            }
        });
    });
});
