/**
 * shared/observability/auditAdmin — unit tests con Sequelize mockeado.
 */

const path = require('path');

// Mock del módulo de DB para evitar conexión real.
jest.mock('../../core/db', () => {
    return { AppAdminAuditLog: { create: jest.fn().mockResolvedValue({ id_app_admin_audit_log: 1 }) } };
});

const { AppAdminAuditLog } = require('../../core/db');
const auditAdmin = require('../../shared/observability/auditAdmin');

function mockReq(extra = {}) {
    return {
        id: 'req-test-1',
        headers: { 'user-agent': 'jest', 'x-forwarded-for': '1.1.1.1' },
        ip: '1.1.1.1',
        user: { id_usuario: 99 },
        tenantId: 7,
        ...extra
    };
}

describe('auditAdmin', () => {
    beforeEach(() => { AppAdminAuditLog.create.mockClear(); });

    test('persiste con todos los campos clave', async () => {
        await auditAdmin(mockReq(), {
            accion: 'reserva.refund',
            entidad: 'reserva',
            entidadId: 'MBC-2026-0001',
            antes:   { estatus: 'pagada' },
            despues: { estatus: 'reembolsada' }
        });
        expect(AppAdminAuditLog.create).toHaveBeenCalledTimes(1);
        const arg = AppAdminAuditLog.create.mock.calls[0][0];
        expect(arg.accion).toBe('reserva.refund');
        expect(arg.entidad).toBe('reserva');
        expect(arg.entidad_id).toBe('MBC-2026-0001');
        expect(arg.fk_id_institucion).toBe(7);
        expect(arg.fk_id_usuario).toBe(99);
        expect(arg.estado).toBe('ok');
        expect(arg.request_id).toBe('req-test-1');
        expect(arg.ip).toBe('1.1.1.1');
        expect(arg.user_agent).toBe('jest');
        expect(arg.antes).toEqual({ estatus: 'pagada' });
        expect(arg.despues).toEqual({ estatus: 'reembolsada' });
    });

    test('truncate strings excesivamente largos', async () => {
        await auditAdmin(mockReq(), {
            accion: 'x'.repeat(120),
            entidad: 'y'.repeat(120),
            entidadId: 'z'.repeat(120),
            mensaje: 'm'.repeat(500)
        });
        const arg = AppAdminAuditLog.create.mock.calls[0][0];
        expect(arg.accion.length).toBeLessThanOrEqual(60);
        expect(arg.entidad.length).toBeLessThanOrEqual(60);
        expect(arg.entidad_id.length).toBeLessThanOrEqual(60);
        expect(arg.mensaje.length).toBeLessThanOrEqual(255);
    });

    test('no lanza si la BD falla', async () => {
        AppAdminAuditLog.create.mockRejectedValueOnce(new Error('boom'));
        await expect(auditAdmin(mockReq(), { accion: 'x.y' })).resolves.toBeUndefined();
    });

    test('auditError marca estado=error con mensaje del error', async () => {
        await auditAdmin.auditError(mockReq(), 'voucher.cancelar', new Error('SALDO_INSUFICIENTE'));
        const arg = AppAdminAuditLog.create.mock.calls[0][0];
        expect(arg.accion).toBe('voucher.cancelar');
        expect(arg.estado).toBe('error');
        expect(arg.mensaje).toBe('SALDO_INSUFICIENTE');
    });

    test('rescata payload sin objects (antes/despues no-objeto se ignoran)', async () => {
        await auditAdmin(mockReq(), {
            accion: 'x', antes: 'no-object', despues: 42
        });
        const arg = AppAdminAuditLog.create.mock.calls[0][0];
        expect(arg.antes).toBeNull();
        expect(arg.despues).toBeNull();
    });
});
