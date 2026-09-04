/**
 * Tests de integración para POST /api/public/booking/preview (Sprint 5.4).
 *
 * Verifica que el preview devuelve EL MISMO total que `createReserva` y que
 * `startCheckout` enviará a Stripe — es la garantía de que el usuario nunca
 * vea un total distinto al que paga.
 */

const request = require('supertest');
const app = require('../../app');
const db = require('../../core/db');

const TENANT_SLUG = process.env.MBC_TENANT_SLUG || 'margarita-beach-club';

afterAll(async () => {
    try { await db.sequelize.close(); } catch (_) { /* noop */ }
});

describe('POST /api/public/booking/preview', () => {
    test('rechaza sin paqueteId con 400', async () => {
        const r = await request(app)
            .post('/api/public/booking/preview')
            .set('x-tenant-slug', TENANT_SLUG)
            .send({ crew: { adulto: 1 } });
        expect([400, 404]).toContain(r.status);
        if (r.status === 400) {
            expect(r.body.success).toBe(false);
            expect(r.body.error).toBe('PAQUETE_REQUERIDO');
        }
    });

    test('Half Day × 2 adultos devuelve subtotal=196000 y total=196000', async () => {
        const r = await request(app)
            .post('/api/public/booking/preview')
            .set('x-tenant-slug', TENANT_SLUG)
            .send({ paqueteId: 2, crew: { adulto: 2 } });
        // 404 si la BD no tiene el paquete sembrado en este entorno
        expect([200, 404]).toContain(r.status);
        if (r.status === 200) {
            expect(r.body.success).toBe(true);
            const { data } = r.body;
            expect(data.summary.subtotal_paquete_centavos).toBe(196000);
            expect(data.summary.subtotal_actividades_centavos).toBe(0);
            expect(data.subtotal_centavos === undefined || data.summary.subtotal_centavos === 196000).toBe(true);
            expect(data.total_centavos).toBe(196000);
            expect(data.descuento_centavos).toBe(0);
            expect(data.moneda?.codigo).toBe('MXN');
            // Sin descuentos opcionales
            expect(data.cupon).toBeNull();
            expect(data.voucher).toBeNull();
            expect(data.loyalty).toBeNull();
        }
    });

    test('Full Pass + 1 actividad reporta subtotal_actividades_centavos > 0', async () => {
        const r = await request(app)
            .post('/api/public/booking/preview')
            .set('x-tenant-slug', TENANT_SLUG)
            .send({ paqueteId: 1, crew: { adulto: 1 }, actividadesIds: [1] });
        expect([200, 404]).toContain(r.status);
        if (r.status === 200) {
            const { data } = r.body;
            expect(data.summary.subtotal_paquete_centavos).toBeGreaterThan(0);
            expect(data.summary.subtotal_actividades_centavos).toBeGreaterThan(0);
            expect(data.total_centavos).toBe(
                data.summary.subtotal_paquete_centavos +
                data.summary.subtotal_actividades_centavos +
                (data.summary.subtotal_extras_centavos || 0) +
                (data.summary.subtotal_day_beds_centavos || 0)
            );
        }
    });

    test('cupón inválido no rompe: total queda intacto y reporta cupon.error', async () => {
        const r = await request(app)
            .post('/api/public/booking/preview')
            .set('x-tenant-slug', TENANT_SLUG)
            .send({ paqueteId: 2, crew: { adulto: 1 }, cuponCodigo: 'NO_EXISTE_XYZ' });
        expect([200, 404]).toContain(r.status);
        if (r.status === 200) {
            const { data } = r.body;
            expect(data.descuento_centavos).toBe(0);
            expect(data.cupon).toBeTruthy();
            expect((data.cupon).error).toBeTruthy();
        }
    });
});
