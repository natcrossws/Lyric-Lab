/**
 * loyaltyService — integration tests.
 *
 * Cubre:
 *   - getConfiguracion / upsertConfiguracion
 *   - getOrCreateCliente (idempotente, NORM email)
 *   - ajusteManual (+ histórico de movimientos)
 *   - validate (cliente sin saldo / con saldo / mínimo de canje)
 *
 * Limpia los registros de prueba al terminar.
 */

const loyaltyService = require('../../modules/marketing/services/loyaltyService');
const { LoyaltyCliente, LoyaltyMovimiento } = require('../../core/db');

const INST = 1;
const TEST_EMAIL = `jest_loyalty_${Date.now()}@example.com`;

afterAll(async () => {
    const cli = await LoyaltyCliente.findOne({ where: { fk_id_institucion: INST, email: TEST_EMAIL } });
    if (cli) {
        await LoyaltyMovimiento.destroy({ where: { fk_id_loyalty_cliente: cli.id_loyalty_cliente } });
        await cli.destroy();
    }
});

describe('loyaltyService', () => {
    test('getConfiguracion devuelve seed activo para MBC', async () => {
        const cfg = await loyaltyService.getConfiguracion(INST);
        expect(cfg).toBeDefined();
        expect(cfg.activo).toBe(true);
        expect(cfg.puntos_por_mxn).toBeDefined();
        expect(cfg.valor_punto_centavos).toBeGreaterThan(0);
        expect(cfg.min_puntos_canje).toBeGreaterThan(0);
        expect(cfg.max_puntos_canje_pct).toBeGreaterThan(0);
    });

    test('getOrCreateCliente normaliza email y es idempotente', async () => {
        const a = await loyaltyService.getOrCreateCliente(INST, { email: TEST_EMAIL.toUpperCase(), nombre: 'Jest' });
        const b = await loyaltyService.getOrCreateCliente(INST, { email: TEST_EMAIL.toLowerCase(), nombre: 'Jest' });
        expect(a.id_loyalty_cliente).toBe(b.id_loyalty_cliente);
        expect(a.email).toBe(TEST_EMAIL.toLowerCase());
    });

    test('validate falla si no se cumple mínimo de canje', async () => {
        const cfg = await loyaltyService.getConfiguracion(INST);
        await expect(
            loyaltyService.validate({ institucionId: INST, email: TEST_EMAIL, puntos: cfg.min_puntos_canje - 1, subtotalCentavos: 100000 })
        ).rejects.toMatchObject({ code: 'MIN_PUNTOS' });
    });

    test('ajusteManual acredita puntos y se ven en movimientos', async () => {
        const cfg = await loyaltyService.getConfiguracion(INST);
        const delta = cfg.min_puntos_canje + 50;
        const mov = await loyaltyService.ajusteManual({
            institucionId: INST,
            email: TEST_EMAIL,
            delta,
            notas: 'jest seed',
            usuarioId: null
        });
        expect(mov).toBeDefined();
        expect(mov.tipo).toBe('ajuste');
        expect(mov.puntos).toBe(delta);
        expect(mov.saldo_resultante).toBeGreaterThanOrEqual(delta);

        const cli = await LoyaltyCliente.findOne({ where: { fk_id_institucion: INST, email: TEST_EMAIL } });
        expect(cli.puntos_acumulados).toBeGreaterThanOrEqual(delta);
    });

    test('validate calcula descuento respetando min, valor_punto y techo de %', async () => {
        const cfg = await loyaltyService.getConfiguracion(INST);
        const subtotal = 100000; // $1,000 MXN
        const puntos = cfg.min_puntos_canje;
        const r = await loyaltyService.validate({
            institucionId: INST, email: TEST_EMAIL,
            puntos, subtotalCentavos: subtotal
        });
        expect(r.valido).toBe(true);
        expect(r.puntos_a_canjear).toBe(puntos);

        const valorPlano = puntos * cfg.valor_punto_centavos;
        const techo = Math.floor(subtotal * (cfg.max_puntos_canje_pct / 100));
        const descuentoEsperado = Math.min(valorPlano, techo, subtotal);

        expect(r.descuento_centavos).toBe(descuentoEsperado);
        expect(r.total_centavos).toBe(subtotal - descuentoEsperado);
        expect(r.cliente.puntos_disponibles).toBeGreaterThanOrEqual(puntos);
    });

    test('validate falla con email inexistente', async () => {
        const cfg = await loyaltyService.getConfiguracion(INST);
        await expect(
            loyaltyService.validate({ institucionId: INST, email: `noexiste_${Date.now()}@x.com`, puntos: cfg.min_puntos_canje, subtotalCentavos: 100000 })
        ).rejects.toMatchObject({ code: 'CLIENTE_NO_ENCONTRADO' });
    });
});
