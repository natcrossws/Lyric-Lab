/**
 * modules/marketing/middleware/inMemoryRateLimit — unit tests.
 */

const { inMemoryRateLimit, defaultKeyFn } = require('../../modules/marketing/middleware/inMemoryRateLimit');

function makeReq({ ip = '1.2.3.4', tenantId, headers = {} } = {}) {
    return { ip, tenantId, headers };
}
function makeRes() {
    const headers = {};
    let status = 200;
    let body = null;
    return {
        set: (k, v) => { headers[k] = v; },
        status: (s) => { status = s; return { json: (b) => { body = b; return body; } }; },
        get headers() { return headers; },
        get _status() { return status; },
        get _body() { return body; }
    };
}

describe('inMemoryRateLimit', () => {
    test('defaultKeyFn combina tenant + IP', () => {
        expect(defaultKeyFn(makeReq({ ip: '10.0.0.1', tenantId: 7 }))).toBe('t7:10.0.0.1');
        expect(defaultKeyFn(makeReq({ ip: '10.0.0.1' }))).toBe('anon:10.0.0.1');
    });

    test('permite hasta max requests por ventana', () => {
        const rl = inMemoryRateLimit({ windowMs: 1000, max: 3 });
        const next = jest.fn();
        const res = makeRes();
        for (let i = 0; i < 3; i++) {
            rl(makeReq({ ip: '1.1.1.1' }), res, next);
        }
        expect(next).toHaveBeenCalledTimes(3);
        expect(res._status).toBe(200);
    });

    test('bloquea con 429 al exceder max', () => {
        const rl = inMemoryRateLimit({ windowMs: 1000, max: 2 });
        const next = jest.fn();
        const res = makeRes();
        const req = makeReq({ ip: '1.1.1.2' });
        rl(req, res, next);
        rl(req, res, next);
        rl(req, res, next);
        expect(next).toHaveBeenCalledTimes(2);
        expect(res._status).toBe(429);
        expect(res._body.error).toBe('RATE_LIMIT_EXCEDIDO');
        expect(res.headers['Retry-After']).toBeDefined();
    });

    test('aísla por clave (tenant/IP) — A no afecta a B', () => {
        const rl = inMemoryRateLimit({ windowMs: 1000, max: 1 });
        const next = jest.fn();
        const res = makeRes();
        rl(makeReq({ ip: '10.0.0.1', tenantId: 1 }), res, next); // A
        rl(makeReq({ ip: '10.0.0.1', tenantId: 1 }), res, next); // A bloqueado
        const next2 = jest.fn();
        const res2 = makeRes();
        rl(makeReq({ ip: '10.0.0.1', tenantId: 2 }), res2, next2); // B pasa
        expect(next).toHaveBeenCalledTimes(1);
        expect(next2).toHaveBeenCalledTimes(1);
        expect(res2._status).toBe(200);
    });

    test('expone X-RateLimit-Limit/Remaining/Reset/Scope', () => {
        const rl = inMemoryRateLimit({ windowMs: 60_000, max: 10 });
        const res = makeRes();
        rl(makeReq({ ip: '8.8.8.8', tenantId: 5 }), res, () => {});
        expect(res.headers['X-RateLimit-Limit']).toBe('10');
        expect(res.headers['X-RateLimit-Remaining']).toBe('9');
        expect(res.headers['X-RateLimit-Reset']).toBeDefined();
        expect(res.headers['X-RateLimit-Scope']).toBe('t5:8.8.8.8');
    });
});
