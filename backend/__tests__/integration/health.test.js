/**
 * Health endpoints — integration tests.
 */

const request = require('supertest');
const app = require('../../app');

describe('health endpoints', () => {
    test('GET /health → 200 ok', async () => {
        const r = await request(app).get('/health');
        expect(r.status).toBe(200);
        expect(r.body.success).toBe(true);
        expect(r.body.status).toBe('ok');
        expect(typeof r.body.uptimeMs).toBe('number');
        expect(r.headers['x-request-id']).toBeDefined();
    });

    test('GET /health/ready → 200 ready (DB up)', async () => {
        const r = await request(app).get('/health/ready');
        expect(r.status).toBe(200);
        expect(r.body.success).toBe(true);
        expect(r.body.checks.db).toBe('ok');
    });

    test('header X-Request-Id reflejado del entrante', async () => {
        const r = await request(app)
            .get('/health')
            .set('X-Request-Id', 'jest-trace-001');
        expect(r.headers['x-request-id']).toBe('jest-trace-001');
    });
});
