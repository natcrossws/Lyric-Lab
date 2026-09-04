/**
 * shared/observability/metrics — unit tests.
 */

describe('metrics', () => {
    let metrics;
    beforeEach(() => {
        jest.resetModules();
        metrics = require('../../shared/observability/metrics');
        metrics.reset();
    });

    test('snapshot vacío tras reset', () => {
        const s = metrics.snapshot();
        expect(s.totalRequests).toBe(0);
        expect(s.routes).toEqual([]);
        expect(s.errorCounts).toEqual({ total: 0, by5xx: 0, by4xx: 0 });
    });

    test('observe agrupa por (method, route)', () => {
        metrics.observe({ method: 'GET', route: '/a', status: 200, latencyMs: 10 });
        metrics.observe({ method: 'GET', route: '/a', status: 200, latencyMs: 20 });
        metrics.observe({ method: 'POST', route: '/a', status: 201, latencyMs: 5 });
        const s = metrics.snapshot();
        expect(s.totalRequests).toBe(3);
        expect(s.routes).toHaveLength(2);
        const get = s.routes.find(r => r.key === 'GET /a');
        expect(get.count).toBe(2);
        expect(get.byStatus).toEqual({ 200: 2 });
        expect(get.avgLatencyMs).toBeCloseTo(15, 1);
        expect(get.minLatencyMs).toBe(10);
        expect(get.maxLatencyMs).toBe(20);
    });

    test('errorCounts cuenta 4xx y 5xx por separado', () => {
        metrics.observe({ method: 'GET', route: '/x', status: 200, latencyMs: 1 });
        metrics.observe({ method: 'GET', route: '/x', status: 404, latencyMs: 2 });
        metrics.observe({ method: 'GET', route: '/x', status: 500, latencyMs: 3 });
        metrics.observe({ method: 'GET', route: '/x', status: 502, latencyMs: 4 });
        const s = metrics.snapshot();
        expect(s.errorCounts.total).toBe(3);
        expect(s.errorCounts.by4xx).toBe(1);
        expect(s.errorCounts.by5xx).toBe(2);
    });

    test('percentiles p50/p95/p99 sobre 100 muestras', () => {
        for (let i = 1; i <= 100; i++) {
            metrics.observe({ method: 'GET', route: '/p', status: 200, latencyMs: i });
        }
        const r = metrics.snapshot().routes[0];
        // p50 ≈ 50 (índice floor(100*0.5)=50 → arr[50]=51 sorted asc)
        expect(r.p50).toBeGreaterThanOrEqual(50);
        expect(r.p50).toBeLessThanOrEqual(51);
        expect(r.p95).toBeGreaterThanOrEqual(95);
        expect(r.p99).toBeGreaterThanOrEqual(99);
        expect(r.maxLatencyMs).toBe(100);
        expect(r.minLatencyMs).toBe(1);
    });

    test('topTenants ordena descendente', () => {
        metrics.observe({ method: 'GET', route: '/x', status: 200, latencyMs: 1, tenantId: 'A' });
        metrics.observe({ method: 'GET', route: '/x', status: 200, latencyMs: 1, tenantId: 'A' });
        metrics.observe({ method: 'GET', route: '/x', status: 200, latencyMs: 1, tenantId: 'B' });
        const s = metrics.snapshot();
        expect(s.topTenants[0]).toEqual({ tenantId: 'A', count: 2 });
        expect(s.topTenants[1]).toEqual({ tenantId: 'B', count: 1 });
    });

    test('reset limpia todo', () => {
        metrics.observe({ method: 'GET', route: '/x', status: 200, latencyMs: 1 });
        metrics.reset();
        expect(metrics.snapshot().totalRequests).toBe(0);
    });
});
