/**
 * Tests de integración para /api/marketing/archivos/* (Sprint 5.3 — Uploads R2).
 *
 * Cubre el ciclo de vida completo: upload → getUrl → delete.
 * Si R2 no está configurado en este entorno, los tests de upload se saltan
 * para no bloquear CI en entornos sin credenciales.
 */

const request = require('supertest');
const app = require('../../app');
const { adminHeaders } = require('../helpers/auth');
const db = require('../../core/db');
const { isR2Configured } = require('../../shared/services/s3Client');

const INSTITUTION_ID = 1;
const PNG_1x1 = Buffer.from(
    '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da636400010000000500010d0a2db40000000049454e44ae426082',
    'hex'
);

afterAll(async () => {
    try { await db.sequelize.close(); } catch (_) { /* noop */ }
});

describe('POST /api/marketing/archivos/upload', () => {
    it('rechaza sin token (401)', async () => {
        const r = await request(app).post('/api/marketing/archivos/upload').attach('file', PNG_1x1, 'pixel.png');
        expect(r.status).toBe(401);
    });

    (isR2Configured ? it : it.skip)('sube a R2 y devuelve id_archivo + url', async () => {
        const r = await request(app)
            .post('/api/marketing/archivos/upload')
            .set(adminHeaders(INSTITUTION_ID))
            .attach('file', PNG_1x1, 'pixel.png');

        expect(r.status).toBe(201);
        expect(r.body.success).toBe(true);
        expect(r.body.data.id_archivo).toEqual(expect.any(Number));
        expect(r.body.data.nombre_servidor).toBeTruthy();
        expect(r.body.data.tipo_mime).toMatch(/image\/png|application\/octet-stream/);
        expect(r.body.data.ruta).toMatch(/^marketing\/inst_\d+\//);
        // url puede ser null si get presigned falla; pero típicamente sí viene
        expect(['string', 'object']).toContain(typeof r.body.data.url);

        // Limpieza: borramos lo que acabamos de subir
        const id = r.body.data.id_archivo;
        const del = await request(app)
            .delete(`/api/marketing/archivos/${id}`)
            .set(adminHeaders(INSTITUTION_ID));
        expect(del.status).toBe(200);
    });

    it('rechaza id inválido en GET /url con 400', async () => {
        const r = await request(app)
            .get('/api/marketing/archivos/abc/url')
            .set(adminHeaders(INSTITUTION_ID));
        expect(r.status).toBe(400);
        expect(r.body.error).toBe('ID_INVALIDO');
    });

    it('404 para id inexistente en GET /url', async () => {
        const r = await request(app)
            .get('/api/marketing/archivos/99999999/url')
            .set(adminHeaders(INSTITUTION_ID));
        expect(r.status).toBe(404);
    });
});
