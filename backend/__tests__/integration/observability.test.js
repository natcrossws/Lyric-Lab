/**
 * /api/admin/observability/* — integration tests.
 *
 * Requiere BD arriba y JWT_SECRET en env.
 */

const request = require('supertest');
const app = require('../../app');
const { adminHeaders } = require('../helpers/auth');

describe('observability admin', () => {
    test('rechaza sin auth (401)', async () => {
        const r = await request(app).get('/api/admin/observability/metrics');
        expect(r.status).toBe(401);
        expect(r.body.requestId).toBeDefined();
    });

    test('GET /metrics con admin token', async () => {
        const r = await request(app)
            .get('/api/admin/observability/metrics')
            .set(adminHeaders());
        expect(r.status).toBe(200);
        expect(r.body.success).toBe(true);
        expect(r.body.data).toHaveProperty('startedAt');
        expect(r.body.data).toHaveProperty('uptimeMs');
        expect(Array.isArray(r.body.data.routes)).toBe(true);
    });

    test('GET /errors con admin token', async () => {
        const r = await request(app)
            .get('/api/admin/observability/errors?limit=5')
            .set(adminHeaders());
        expect(r.status).toBe(200);
        expect(Array.isArray(r.body.data)).toBe(true);
        expect(r.body.meta).toHaveProperty('total');
    });

    test('GET /errors/:id con id no numérico → 400 (no 500)', async () => {
        const r = await request(app)
            .get('/api/admin/observability/errors/abc')
            .set(adminHeaders());
        expect(r.status).toBe(400);
        expect(r.body.error).toBe('ID_INVALIDO');
    });

    test('GET /audit con admin token', async () => {
        const r = await request(app)
            .get('/api/admin/observability/audit?limit=5')
            .set(adminHeaders());
        expect(r.status).toBe(200);
        expect(Array.isArray(r.body.data)).toBe(true);
    });

    test('errorHandler devuelve requestId en body', async () => {
        const r = await request(app)
            .get('/api/admin/observability/errors')
            .set(adminHeaders())
            .set('X-Request-Id', 'jest-int-obs-1');
        expect(r.headers['x-request-id']).toBe('jest-int-obs-1');
    });
});
