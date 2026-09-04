/**
 * voucherService — integration tests.
 *
 * Cubre el ciclo manual: emitir → redimir parcial → redimir total → cancelar
 * (con voucher recreado para el último paso).
 */

const voucherService = require('../../modules/marketing/services/voucherService');
const { Voucher, VoucherMovimiento, CatEstatusVoucher } = require('../../core/db');

const INST = 1;
const createdIds = [];

async function _cleanup(id) {
    await VoucherMovimiento.destroy({ where: { fk_id_voucher: id } });
    await Voucher.destroy({ where: { id_voucher: id } });
}

afterAll(async () => {
    for (const id of createdIds) {
        try { await _cleanup(id); } catch { /* noop */ }
    }
});

describe('voucherService', () => {
    test('emitir manual deja saldo = monto y movimiento "emision"', async () => {
        const v = await voucherService.emitir({
            institucionId: INST,
            tipoCodigo: 'monto_fijo',
            montoCentavos: 50000,        // $500
            vencimientoDias: 30,
            origen: 'manual',
            comprador: { nombre: 'Jest Comprador', email: 'jest_comp@example.com' },
            destinatario: { nombre: 'Jest Destinatario', email: 'jest_dest@example.com' }
        });
        createdIds.push(v.id_voucher);
        expect(v.id_voucher).toBeGreaterThan(0);
        expect(v.codigo).toMatch(/^[A-Z0-9-]{6,}$/);
        expect(v.saldo_centavos).toBe(50000);
        expect(v.monto_emitido_centavos).toBe(50000);

        const movs = await VoucherMovimiento.findAll({ where: { fk_id_voucher: v.id_voucher } });
        expect(movs).toHaveLength(1);
        expect(movs[0].tipo_movimiento).toBe('emision');
        expect(movs[0].saldo_resultante).toBe(50000);
    });

    test('redimirManual parcial deja estatus=parcial', async () => {
        const v = await voucherService.emitir({
            institucionId: INST, tipoCodigo: 'monto_fijo',
            montoCentavos: 30000, origen: 'manual',
            destinatario: { email: 'jest_redparcial@example.com' }
        });
        createdIds.push(v.id_voucher);

        const r = await voucherService.redimirManual({
            codigo: v.codigo,
            montoCentavos: 10000,
            usuarioId: null,
            notas: 'jest parcial',
            tenantId: INST
        });
        expect(r.voucher.saldo_centavos).toBe(20000);
        expect(r.movimiento.tipo_movimiento).toBe('redencion');
        expect(r.movimiento.monto_centavos).toBe(10000);

        const fresh = await Voucher.findByPk(v.id_voucher, { include: [{ model: CatEstatusVoucher, as: 'estatus' }] });
        expect(fresh.estatus.codigo).toBe('parcial');
    });

    test('redimirManual hasta el saldo deja estatus=canjeado', async () => {
        const v = await voucherService.emitir({
            institucionId: INST, tipoCodigo: 'monto_fijo',
            montoCentavos: 5000, origen: 'manual',
            destinatario: { email: 'jest_redtotal@example.com' }
        });
        createdIds.push(v.id_voucher);
        await voucherService.redimirManual({ codigo: v.codigo, montoCentavos: 5000, usuarioId: null, tenantId: INST });
        const fresh = await Voucher.findByPk(v.id_voucher, { include: [{ model: CatEstatusVoucher, as: 'estatus' }] });
        expect(fresh.saldo_centavos).toBe(0);
        expect(fresh.estatus.codigo).toBe('canjeado');
    });

    test('redimirManual con monto > saldo lanza SALDO_INSUFICIENTE', async () => {
        const v = await voucherService.emitir({
            institucionId: INST, tipoCodigo: 'monto_fijo',
            montoCentavos: 1000, origen: 'manual',
            destinatario: { email: 'jest_overflow@example.com' }
        });
        createdIds.push(v.id_voucher);
        await expect(
            voucherService.redimirManual({ codigo: v.codigo, montoCentavos: 9999, usuarioId: null, tenantId: INST })
        ).rejects.toMatchObject({ code: 'SALDO_INSUFICIENTE' });
    });

    test('cancelarManual sobre voucher emitido lo deja en estatus=cancelado y saldo=0', async () => {
        const v = await voucherService.emitir({
            institucionId: INST, tipoCodigo: 'monto_fijo',
            montoCentavos: 8000, origen: 'manual',
            destinatario: { email: 'jest_cancel@example.com' }
        });
        createdIds.push(v.id_voucher);
        const updated = await voucherService.cancelarManual({ voucherId: v.id_voucher, usuarioId: null, notas: 'jest cancel' });
        const fresh = await Voucher.findByPk(updated.id_voucher, { include: [{ model: CatEstatusVoucher, as: 'estatus' }] });
        expect(fresh.estatus.codigo).toBe('cancelado');
        expect(fresh.saldo_centavos).toBe(0);

        // No se puede cancelar dos veces
        await expect(
            voucherService.cancelarManual({ voucherId: v.id_voucher, usuarioId: null })
        ).rejects.toMatchObject({ code: 'VOUCHER_NO_CANCELABLE' });
    });

    test('emitir con monto inválido lanza MONTO_INVALIDO', async () => {
        await expect(
            voucherService.emitir({ institucionId: INST, tipoCodigo: 'monto_fijo', montoCentavos: 0, origen: 'manual' })
        ).rejects.toMatchObject({ code: 'MONTO_INVALIDO' });
    });
});
