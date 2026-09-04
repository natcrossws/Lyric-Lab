/**
 * httpLogger — Sprint 5.1.
 */
import { Request, Response, NextFunction } from 'express';
import pinoHttp from 'pino-http';
import logger from './logger';
import * as metrics from './metrics';

const NOISY_PREFIXES = ['/health', '/metrics', '/favicon'];

function normalizeRoute(req: Request): string {
  const matched = req.route && req.route.path;
  const base = (req.baseUrl || '') + (matched || (req.path || req.url || ''));
  return base
    .replace(/\/\d+(?=\/|$)/g, '/:id')
    .replace(/\?.*$/, '')
    .slice(0, 200);
}

function tenantIdFromReq(req: Request): number | null {
  const r = req as Request & { tenantId?: number; institutionId?: number; tenant?: { id_institucion?: number } };
  return r.tenantId || r.institutionId || (r.tenant && r.tenant.id_institucion) || null;
}

function userIdFromReq(req: Request): number | null {
  return req.user?.id_usuario || null;
}

const httpLogger = pinoHttp({
  logger,
  genReqId: (req) => (req as Request & { id: string }).id,
  autoLogging: {
    ignore: (req) => NOISY_PREFIXES.some((p) => (req.url || '').startsWith(p))
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
  customErrorMessage: (req, res, err) => `${req.method} ${req.url} ${res.statusCode} ${err && err.message || ''}`,
  customProps: (req) => ({
    requestId: (req as Request & { id: string }).id,
    tenantId: tenantIdFromReq(req as Request),
    userId: userIdFromReq(req as Request)
  }),
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      remoteAddress: req.remoteAddress
    }),
    res: (res) => ({ statusCode: res.statusCode })
  }
});

/**
 * Middleware que envuelve a pino-http y además captura latencia para metrics.
 */
function httpObservability(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const latencyMs = Number(process.hrtime.bigint() - start) / 1e6;
    const route = normalizeRoute(req) || req.path || '/';
    if (NOISY_PREFIXES.some((p) => (req.url || '').startsWith(p))) return;
    try {
      metrics.observe({
        method: req.method,
        route,
        status: res.statusCode,
        latencyMs,
        tenantId: tenantIdFromReq(req)
      });
    } catch { /* nunca rompemos por métricas */ }
  });
  (httpLogger as (req: Request, res: Response, next: NextFunction) => void)(req, res, next);
}

export { httpLogger, httpObservability, normalizeRoute };
