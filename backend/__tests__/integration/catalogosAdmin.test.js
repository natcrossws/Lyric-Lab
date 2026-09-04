/**
 * Tests de integración para /api/marketing/catalogos (Sprint 5.3 — UI marketing).
 *
 * Verifica que el endpoint devuelva las 4 colecciones esperadas y que se proteja
 * con JWT + x-institution-id.
 */

const request = require('supertest');
const app = require('../../app');
const { adminHeaders } = require('../helpers/auth');
const db = require('../../core/db');

const INSTITUTION_ID = 1;

afterAll(async () => {
    try { await db.sequelize.close(); } catch (_) { /* noop */ }
});

describe('GET /api/marketing/catalogos', () => {
    it('rechaza sin token (401)', async () => {
        const r = await request(app).get('/api/marketing/catalogos');
        expect(r.status).toBe(401);
    });

    it('devuelve monedas, menu_tipos, menu_documento_tipos y actividad_categorias', async () => {
        const r = await request(app)
            .get('/api/marketing/catalogos')
            .set(adminHeaders(INSTITUTION_ID));

        expect(r.status).toBe(200);
        expect(r.body.success).toBe(true);
        expect(r.body.data).toBeDefined();
        expect(Array.isArray(r.body.data.monedas)).toBe(true);
        expect(Array.isArray(r.body.data.menu_tipos)).toBe(true);
        expect(Array.isArray(r.body.data.menu_documento_tipos)).toBe(true);
        expect(Array.isArray(r.body.data.actividad_categorias)).toBe(true);

        // El seed mínimo (100_seed_marketing_mbc) debe traer MXN al menos.
        const codigosMonedas = r.body.data.monedas.map(m => m.codigo);
        expect(codigosMonedas).toContain('MXN');
    });
});
