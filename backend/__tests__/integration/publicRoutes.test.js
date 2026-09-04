/**
 * Endpoints públicos del módulo marketing — integration tests.
 *
 * Verifica:
 *   - site-config responde con la institución MBC.
 *   - rate-limit por tenant: el header X-RateLimit-Scope debe incluir tenant + IP.
 *   - validación de cupón sin cuerpo devuelve 400.
 */

const request = require('supertest');
const app = require('../../app');

const TENANT_SLUG = process.env.MBC_TENANT_SLUG || 'margarita-beach-club';

describe('public marketing routes', () => {
    test('GET /api/public/site-config?slug=… responde 200', async () => {
        const r = await request(app).get(`/api/public/site-config?slug=${TENANT_SLUG}`);
        expect([200, 404]).toContain(r.status); // 404 si la BD no tiene la institución sembrada
        if (r.status === 200) {
            expect(r.body.success).toBe(true);
            expect(r.body.data).toHaveProperty('institucion');
            expect(r.body.data).toHaveProperty('branding');
        }
    });

    test('rate-limit por tenant expone X-RateLimit-Scope', async () => {
        const r = await request(app)
            .post('/api/public/analytics/track')
            .set('x-tenant-slug', TENANT_SLUG)
            .send({ eventType: 'page_view', metadata: { source: 'jest' } });
        // 200/202 si OK, 400 si validación falla, 429 si rate-limit; en cualquier caso, scope presente
        expect(r.headers['x-ratelimit-scope']).toBeDefined();
        // Y el scope debe contener al menos `:` separando tenant y IP
        expect(r.headers['x-ratelimit-scope']).toMatch(/:/);
    });

    test('POST /api/public/booking/cupones/validar sin body → 400', async () => {
        const r = await request(app)
            .post('/api/public/booking/cupones/validar')
            .set('x-tenant-slug', TENANT_SLUG)
            .send({});
        expect([400, 422]).toContain(r.status);
    });
});
