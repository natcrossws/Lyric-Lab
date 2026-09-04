/**
 * Métricas in-memory — Sprint 5.1.
 */

const SAMPLES_PER_BUCKET = 500;

interface ObserveParams {
  method: string;
  route: string;
  status: number;
  latencyMs: number;
  tenantId?: number | string | null;
}

interface BucketSnapshot {
  count: number;
  avgLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  p50: number;
  p95: number;
  p99: number;
  byStatus: Record<number, number>;
  lastAt: number | null;
}

interface RouteSnapshot extends BucketSnapshot {
  key: string;
}

class RouteBucket {
  count = 0;
  statusCounts = new Map<number, number>();
  latencies = new Float64Array(SAMPLES_PER_BUCKET);
  idx = 0;
  full = false;
  totalLatency = 0;
  minLatency = Infinity;
  maxLatency = 0;
  lastAt: number | null = null;

  add(status: number, latencyMs: number): void {
    this.count++;
    this.statusCounts.set(status, (this.statusCounts.get(status) || 0) + 1);
    this.latencies[this.idx] = latencyMs;
    this.idx = (this.idx + 1) % SAMPLES_PER_BUCKET;
    if (this.idx === 0) this.full = true;
    this.totalLatency += latencyMs;
    if (latencyMs < this.minLatency) this.minLatency = latencyMs;
    if (latencyMs > this.maxLatency) this.maxLatency = latencyMs;
    this.lastAt = Date.now();
  }

  percentiles(): { p50: number; p95: number; p99: number } {
    const n = this.full ? SAMPLES_PER_BUCKET : this.idx;
    if (n === 0) return { p50: 0, p95: 0, p99: 0 };
    const arr = Array.from(this.latencies.slice(0, n)).sort((a, b) => a - b);
    const at = (q: number) => arr[Math.min(arr.length - 1, Math.floor(arr.length * q))];
    return { p50: at(0.5), p95: at(0.95), p99: at(0.99) };
  }

  snapshot(): BucketSnapshot {
    const p = this.percentiles();
    return {
      count: this.count,
      avgLatencyMs: this.count ? +(this.totalLatency / this.count).toFixed(2) : 0,
      minLatencyMs: this.minLatency === Infinity ? 0 : +this.minLatency.toFixed(2),
      maxLatencyMs: +this.maxLatency.toFixed(2),
      p50: +p.p50.toFixed(2),
      p95: +p.p95.toFixed(2),
      p99: +p.p99.toFixed(2),
      byStatus: Object.fromEntries(this.statusCounts),
      lastAt: this.lastAt
    };
  }
}

const STARTED_AT = Date.now();
const buckets = new Map<string, RouteBucket>();
const tenantCounts = new Map<string, number>();
const errorCounts = { total: 0, by5xx: 0, by4xx: 0 };

function observe({ method, route, status, latencyMs, tenantId }: ObserveParams): void {
  const key = `${method} ${route}`;
  let b = buckets.get(key);
  if (!b) { b = new RouteBucket(); buckets.set(key, b); }
  b.add(status, latencyMs);
  if (status >= 400) {
    errorCounts.total++;
    if (status >= 500) errorCounts.by5xx++; else errorCounts.by4xx++;
  }
  if (tenantId != null) {
    tenantCounts.set(String(tenantId), (tenantCounts.get(String(tenantId)) || 0) + 1);
  }
}

function snapshot(): object {
  const routes: RouteSnapshot[] = [];
  for (const [key, b] of buckets) {
    routes.push({ key, ...b.snapshot() });
  }
  routes.sort((a, b) => b.count - a.count);
  return {
    startedAt: STARTED_AT,
    uptimeMs: Date.now() - STARTED_AT,
    memoryMb: +(process.memoryUsage().rss / 1024 / 1024).toFixed(1),
    totalRequests: routes.reduce((s, r) => s + r.count, 0),
    errorCounts,
    topTenants: Array.from(tenantCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tenantId, count]) => ({ tenantId, count })),
    routes
  };
}

function reset(): void {
  buckets.clear();
  tenantCounts.clear();
  errorCounts.total = 0; errorCounts.by5xx = 0; errorCounts.by4xx = 0;
}

export { observe, snapshot, reset };
