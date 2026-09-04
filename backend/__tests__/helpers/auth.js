/**
 * Firma un JWT admin para usar en tests de integración.
 * Reusa el secreto del .env del backend.
 */

const jwt = require('jsonwebtoken');

function signAdminToken({ id = 1, role = 'GLOBAL_ADMIN', name = 'tester', institutionId = 1 } = {}) {
    return jwt.sign(
        { id, role, name, institutionId },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
    );
}

function adminHeaders(opts = {}) {
    return {
        Authorization: `Bearer ${signAdminToken(opts)}`,
        'x-institution-id': String(opts.institutionId || 1)
    };
}

module.exports = { signAdminToken, adminHeaders };
