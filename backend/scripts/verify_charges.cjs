
const { sequelize, Cargo, Clase, Materia, Alumno, Usuario, PerfilAlumno } = require('../server/models');
const { Op } = require('sequelize');

async function generarCargosManual() {
    try {
        console.log('Iniciando generación manual de cargos...');
        
        // Obtener fecha actual
        const today = new Date();
        // Definir el ID del periodo actual, ej: "ENERO-2024"
        const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
        const mesActual = meses[today.getMonth()];
        const anioActual = today.getFullYear();
        const periodoIdentificadorBase = `${mesActual}-${anioActual}`;

        console.log(`Periodo Base: ${periodoIdentificadorBase}`);

        // Check Materias and Users
        const materiasCount = await Materia.count();
        const usersCount = await Usuario.count();
        console.log(`Materias in DB: ${materiasCount}`);
        console.log(`Users in DB: ${usersCount}`);

        let materia;
        let alumno;

        if (materiasCount === 0) {
            console.log('🌱 Seeding Materia de prueba...');
            materia = await Materia.create({
                nombre: 'Pintura Básica',
                descripcion: 'Curso de prueba',
                precio: 1500.00,
                periodo_pago: 'Mensual - Día 1',
                activo: true
            });
        } else {
            materia = await Materia.findOne();
        }

        let profesor = await Usuario.findOne({ where: { fk_id_cat_tipo_usuario: 2 } });
        if (!profesor) {
             console.log('⚠️ No se encontró profesor, usando usuario disponible');
             profesor = await Usuario.findOne();
        }

        const { Salon, CatDia } = require('../server/models');
        let salon = await Salon.findOne();
        if (!salon) {
             console.log('🌱 Creando Salon de prueba...');
             salon = await Salon.create({ nombre: 'Salon A', capacidad: 20, activo: true });
        }

        let dia = await CatDia.findOne({ where: { nombre: 'Lunes' } });
        if (!dia) dia = await CatDia.findOne();

        if (usersCount > 0) {
            alumno = await Usuario.findOne({ where: { fk_id_cat_tipo_usuario: 3 } }); // Buscar alumno (tipo 3 usually)
            if (!alumno) {
                 console.log('⚠️ No se encontró alumno, usando el primer usuario disponible (puede ser admin)');
                 alumno = await Usuario.findOne();
            }
        } else {
             console.log('🌱 Seeding Alumno de prueba...');
             // Create simplified user
             alumno = await Usuario.create({
                 nombre: 'Juan Test',
                 email: 'test@alumno.com',
                 password: 'hash',
                 fk_id_cat_tipo_usuario: 3, 
                 activo: true
             });
        }

        // Crear Clase Activa
        console.log('🌱 Creando Clase de prueba...');
        await Clase.create({
            fk_id_usuario_alumno: alumno.id_usuario,
            fk_id_cat_materia: materia.id_cat_materia,
            fk_id_usuario_profesor: profesor.id_usuario,
            fk_id_salon: salon.id_salon,
            fk_id_cat_dia: dia.id_cat_dia,
            hora_inicio: '10:00:00',
            hora_fin: '12:00:00',
            activo: true,
            fecha_inicio: new Date(),
            fecha_fin: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        });

        // Obtener clases activas REFRESHED
        const clases = await Clase.findAll({
            where: {
                 activo: true
            },
            include: [
                {
                    model: Materia,
                    as: 'materia'
                },
                {
                    model: Usuario,
                    as: 'alumno'
                }
            ]
        });

        console.log(`Total clases activas: ${clases.length}`);

        let cargosGenerados = 0;

        for (const clase of clases) {
            const materia = clase.materia;
            const alumno = clase.alumno;

            if (!materia || !alumno) continue;

            // Lógica simplificada de periodicidad (solo MENSUAL por ahora)
            // Asumimos que si tiene periodo_pago, aplica cargo mensual
            if (materia.periodo_pago && materia.periodo_pago.includes('Mensual')) {
                
                const periodoIdentificador = `${periodoIdentificadorBase}-${materia.id_cal_materia}`;

                // Verificar si ya existe el cargo
                const existeCargo = await Cargo.findOne({
                    where: {
                        fk_id_usuario_alumno: alumno.id_usuario,
                        periodo_identificador: periodoIdentificador
                    }
                });

                if (!existeCargo) {
                    // Crear cargo
                    // Fecha límite: día X del mes? O fin de mes?
                    // Por defecto fin de mes actual
                    const fechaLimite = new Date(today.getFullYear(), today.getMonth() + 1, 0);

                    await Cargo.create({
                        fk_id_usuario_alumno: alumno.id_usuario,
                        concepto: `Mensualidad ${materia.nombre} - ${mesActual}`,
                        monto_total: materia.precio,
                        saldo_pendiente: materia.precio,
                        fecha_limite: fechaLimite,
                        estatus: 'PENDIENTE',
                        periodo_identificador: periodoIdentificador
                    });

                    console.log(`✅ Cargo generado para ${alumno.nombre} - ${materia.nombre}`);
                    cargosGenerados++;
                } else {
                    console.log(`ℹ️ Cargo ya existe para ${alumno.nombre} - ${materia.nombre}`);
                }
            }
        }

        console.log(`\nResumen: ${cargosGenerados} cargos generados.`);

    } catch (error) {
        console.error('Error generando cargos manuales:', error);
    } finally {
        await sequelize.close();
    }
}

// Ejecutar
// Necesitamos aseguranos que DB connection funciona
generarCargosManual();
