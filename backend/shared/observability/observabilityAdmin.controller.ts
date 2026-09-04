/**
 * observabilityAdmin.controller — Sprint 5.1.
 * 
 * Note: AppErrorLog and AppAdminAuditLog tables are not part of the core template schema.
 * These controllers return 501 gracefully if the tables don't exist.
 */
import { Request, Response, NextFunction } from 'express';
import prisma from '../../core/db/prisma';
import * as metrics from './metrics';

type AdminRequest = Request & { user: { fk_id_cat_tipo_usuario?: number; role?: string }; institutionId?: number };

function _isGlobal(req: AdminRequest): boolean {
  const tipo = req.user?.fk_id_cat_tipo_usuario;
  const role = req.user?.role;
  return tipo === 1 || tipo === 6 || role === 'GLOBAL_ADMIN';
}

function _scopeWhere(req: AdminRequest): Record<string, unknown> {
  if (_isGlobal(req)) return {};
  const inst = req.institutionId ?? req.user?.fk_id_institucion;
  return inst ? { fk_id_institucion: inst } : { fk_id_institucion: -1 };
}

type ParsedWhere = Record<string, unknown>;

function _parseDateRange(req: Request): ParsedWhere {
  const where: ParsedWhere = {};
  const { from, to } = req.query as Record<string, string | undefined>;
  if (from || to) {
    where.f_reg = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {})
    };
  }
  return where;
}

export const metricsSnapshot = (_req: Request, res: Response, _next: NextFunction): Response => {
  return res.json({ success: true, data: metrics.snapshot() });
};

export const resetMetrics = (_req: Request, res: Response, _next: NextFunction): Response => {
  metrics.reset();
  return res.json({ success: true });
};

export const listErrors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // App error logs table may not exist in base template — graceful fallback
    const limit = Math.min(parseInt(String(req.query.limit || '50'), 10) || 50, 200);
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    const skip = (page - 1) * limit;
    const adminReq = req as AdminRequest;
    const scopeWhere = _scopeWhere(adminReq);
    const dateWhere = _parseDateRange(req);
    const where: ParsedWhere = { ...scopeWhere, ...dateWhere };

    if (req.query.status) where.status = parseInt(String(req.query.status), 10);
    if (req.query.route) where.route = { contains: String(req.query.route), mode: 'insensitive' };
    if (req.query.q) where.message = { contains: String(req.query.q), mode: 'insensitive' };

    try {
      const [rows, total] = await Promise.all([
        // @ts-expect-error
        prisma.app_error_logs?.findMany({ where, orderBy: { f_reg: 'desc' }, take: limit, skip }) ?? [],
        // @ts-expect-error
        prisma.app_error_logs?.count({ where }) ?? 0
      ]);
      res.json({
        success: true,
        data: rows || [],
        meta: { page, limit, total: total || 0, totalPages: Math.ceil((total || 0) / limit) }
      });
    } catch {
      res.json({ success: true, data: [], meta: { page, limit, total: 0, totalPages: 0 }, note: 'tabla_no_existe' });
    }
  } catch (err) { return next(err); }
};

export const detailError = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ success: false, error: 'ID_INVALIDO' });
      return;
    }
    res.json({ success: false, error: 'NO_IMPLEMENTADO', note: 'Tabla app_error_logs no es parte del schema base' });
  } catch (err) { return next(err); }
};

export const listAudit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit || '50'), 10) || 50, 200);
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);

    try {
      // @ts-expect-error — table may not exist in template schema
      const rows = await prisma.app_admin_audit_logs?.findMany({
        orderBy: { f_reg: 'desc' },
        take: limit,
        skip: (page - 1) * limit
      }) ?? [];
      // @ts-expect-error
      const total = await prisma.app_admin_audit_logs?.count() ?? 0;
      res.json({
        success: true,
        data: rows,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
      });
    } catch {
      res.json({ success: true, data: [], meta: { page, limit, total: 0, totalPages: 0 }, note: 'tabla_no_existe' });
    }
  } catch (err) { return next(err); }
};

// Re-export as named exports for routes
export { metricsSnapshot as metrics };
