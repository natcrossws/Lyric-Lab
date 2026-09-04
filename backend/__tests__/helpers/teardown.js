/**
 * Cierra el pool de Sequelize al terminar la suite de integración para que
 * jest no quede colgado por handles abiertos.
 */

module.exports = async function globalTeardown() {
    try {
        const sequelize = require('../../core/db/database');
        await sequelize.close();
    } catch { /* noop */ }
};
