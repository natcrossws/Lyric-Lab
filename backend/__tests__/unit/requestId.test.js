/**
 * shared/observability/requestId — unit tests.
 */

const requestId = require('../../shared/observability/requestId');

function mockReqRes(headers = {}) {
    const req = { headers };
    const setHeaders = {};
    const res = { setHeader: (k, v) => { setHeaders[k] = v; } };
    return { req, res, setHeaders };
}

describe('requestId middleware', () => {
    test('genera un id si no viene en header', () => {
        const { req, res, setHeaders } = mockReqRes();
        const next = jest.fn();
        requestId(req, res, next);
        expect(typeof req.id).toBe('string');
        expect(req.id.length).toBeGreaterThanOrEqual(20);
        expect(setHeaders['X-Request-Id']).toBe(req.id);
        expect(next).toHaveBeenCalled();
    });

    test('respeta x-request-id válido entrante', () => {
        const { req, res } = mockReqRes({ 'x-request-id': 'trace-abc-123' });
        requestId(req, res, () => {});
        expect(req.id).toBe('trace-abc-123');
    });

    test('rechaza header inválido (caracteres no permitidos) y genera uno nuevo', () => {
        const { req, res } = mockReqRes({ 'x-request-id': 'abc xyz \n bad' });
        requestId(req, res, () => {});
        expect(req.id).not.toBe('abc xyz \n bad');
        expect(req.id.length).toBeGreaterThanOrEqual(20);
    });

    test('rechaza header demasiado corto', () => {
        const { req, res } = mockReqRes({ 'x-request-id': 'ab' });
        requestId(req, res, () => {});
        expect(req.id).not.toBe('ab');
    });

    test('cada request genera un id distinto', () => {
        const ids = new Set();
        for (let i = 0; i < 50; i++) {
            const { req, res } = mockReqRes();
            requestId(req, res, () => {});
            ids.add(req.id);
        }
        expect(ids.size).toBe(50);
    });
});
