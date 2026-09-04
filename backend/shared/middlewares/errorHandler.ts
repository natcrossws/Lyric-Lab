/**
 * errorHandler — Sprint 5.1.
 */
import { Request, Response, NextFunction } from 'express';
import logger from '../observability/logger';

interface AppError extends Error {
  statusCode?: number;
  status?: number;
  code?: string;
}

function ipFromReq(req: Request): string | null {
  const xff = (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim();
  return (xff || req.ip || (req.socket?.remoteAddress) || '').slice(0, 45) || null;
}

function tenantIdFromReq(req: Request): number | null {
  const r = req as Request & { tenantId?: number; institutionId?: number; tenant?: { id_institucion?: number } };
  return r.tenantId || r.institutionId || (r.tenant && r.tenant.id_institucion)
    || (r.user && r.user.fk_id_institucion) || null;
}

function userIdFromReq(req: Request): number | null {
  return req.user?.id_usuario || null;
}

function safeRouteFromReq(req: Request): string {
  const matched = req.route && req.route.path;
  const base = (req.baseUrl || '') + (matched || (req.path || req.url || ''));
  return base.replace(/\?.*$/, '').slice(0, 255);
}

function sanitizeBody(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== 'object') return null;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
    if (/(password|token|secret|authorization|cookie)/i.test(k)) {
      out[k] = '[REDACTED]';
    } else if (typeof v === 'string' && v.length > 500) {
      out[k] = `${v.slice(0, 500)}…(+${v.length - 500})`;
    } else {
      out[k] = v;
    }
  }
  return out;
}

const errorHandler = (err: AppError, req: Request, res: Response, _next: NextFunction): void => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Error interno del servidor';
  const requestId = req && req.id;

  const logCtx = {
    requestId,
    method: req.method,
    url: req.originalUrl,
    status: statusCode,
    tenantId: tenantIdFromReq(req),
    userId: userIdFromReq(req),
    err: {
      message,
      code: err.code,
      stack: err.stack
    }
  };

  if (statusCode >= 500) logger.error(logCtx, '[err] 5xx');
  else if (statusCode >= 400) logger.warn(logCtx, '[err] 4xx');

  // Persistir 5xx en tabla si existe (best-effort, no bloquea respuesta)
  if (statusCode >= 500) {
    (async () => {
      try {
        const prismaModule = await import('../../core/db/prisma');
        const p = prismaModule.default;
        // @ts-expect-error — app_error_logs may not exist in base schema
        if (p.app_error_logs) {
          // @ts-expect-error
          await p.app_error_logs.create({
            data: {
              level: 'error',
              code: err.code ? String(err.code).slice(0, 60) : null,
              message,
              stack: err.stack || null,
              method: req.method,
              route: safeRouteFromReq(req),
              status: statusCode,
              request_id: requestId,
              fk_id_institucion: tenantIdFromReq(req),
              fk_id_usuario: userIdFromReq(req),
              user_agent: (req.headers['user-agent'] || '').toString().slice(0, 255) || null,
              ip: ipFromReq(req),
              payload: {
                query: req.query,
                params: req.params,
                body: sanitizeBody(req.body)
              }
            }
          });
        }
      } catch { /* silencioso */ }
    })();
  }

  res.status(statusCode).json({
    success: false,
    error: err.code || message,
    message,
    requestId,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

export default errorHandler;
