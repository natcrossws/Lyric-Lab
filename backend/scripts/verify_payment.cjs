
const { sequelize, Cargo, Pago, Usuario, CatPago } = require('../server/models');
const { Op } = require('sequelize');

async function verificarPago() {
    try {
        console.log('🧪 Iniciando verificación de pagos...');
        
        // 1. Buscar un Cargo con saldo pendiente
        const cargo = await Cargo.findOne({
            where: {
                saldo_pendiente: { [Op.gt]: 0 },
                estatus: 'PENDIENTE'
            }
        });

        if (!cargo) {
            console.log('⚠️ No hay cargos pendientes para probar.');
            return;
        }

        console.log(`📋 Cargo encontrado: ID ${cargo.id_cargo} - ${cargo.concepto} - Saldo: ${cargo.saldo_pendiente}`);

        // 2. Simular Pago Parcial
        const montoPago = 500.00;
        console.log(`💸 Registrando pago de $${montoPago}...`);

        const t = await sequelize.transaction();
        
        try {
            // Lógica similar al controlador
            const nuevoSaldo = parseFloat(cargo.saldo_pendiente) - montoPago;
            const statusCargo = nuevoSaldo <= 0.01 ? 'PAGADO' : 'PARCIAL';

            // Actualizar Cargo
            cargo.saldo_pendiente = nuevoSaldo > 0 ? nuevoSaldo : 0;
            cargo.estatus = statusCargo;
            await cargo.save({ transaction: t });

            // Crear Pago
            const pago = await Pago.create({
                fk_id_usuario_alumno: cargo.fk_id_usuario_alumno,
                concepto: 'Abono Parcial Test',
                monto: montoPago,
                folio: 'TEST-001',
                estatus: 'PENDIENTE', // Pagos de padre entran como pendiente
                fecha_pago: new Date(),
                metodo_pago: 'TRANSFERENCIA',
                fk_id_cargo: cargo.id_cargo,
                saldo_anterior: parseFloat(cargo.saldo_pendiente) + montoPago,
                saldo_nuevo: cargo.saldo_pendiente,
                banco_origen: 'Banco Test',
                nombre_remitente: 'Tester'
            }, { transaction: t });

            await t.commit();
            console.log(`✅ Pago registrado: ID ${pago.id_pago}`);
            console.log(`📉 Nuevo saldo del cargo: ${cargo.saldo_pendiente} (Estatus: ${cargo.estatus})`);

            // Verificación
            const cargoVerificado = await Cargo.findByPk(cargo.id_cargo);
            if (parseFloat(cargoVerificado.saldo_pendiente) === parseFloat(cargo.saldo_pendiente)) {
                console.log('✅ Verificación EXITOSA: El saldo en DB coincide.');
            } else {
                console.error('❌ ERROR: Discrepancia en saldo.');
            }

        } catch (error) {
            await t.rollback();
            throw error;
        }

    } catch (error) {
        console.error('❌ Error en verificación de pago:', error);
    } finally {
        await sequelize.close();
    }
}

verificarPago();
