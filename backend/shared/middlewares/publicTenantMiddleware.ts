/**
 * publicTenantMiddleware — Resuelve la institución (tenant) para endpoints públicos.
 * No usa JWT.
 */
import { Request, Response, NextFunction } from 'express';
import prisma from '../../core/db/prisma';

const KNOWN_PUBLIC_HOSTS = new Set(['localhost', '127.0.0.1']);

function extractSubdomainFromHost(host: string | undefined): string | null {
  if (!host) return null;
  const cleanHost = host.split(':')[0].toLowerCase();
  if (KNOWN_PUBLIC_HOSTS.has(cleanHost)) return null;
  const parts = cleanHost.split('.');
  if (parts.length < 3) return null;
  const sub = parts[0];
  if (!sub || sub === 'www' || sub === 'api') return null;
  return sub;
}

export const resolvePublicTenant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const headerSlug = ((req.headers['x-tenant-slug'] as string) || '').trim().toLowerCase();
    const headerSubdom = ((req.headers['x-tenant-subdominio'] as string) || '').trim().toLowerCase();
    const querySlug = ((req.query.tenant as string) || '').toString().trim().toLowerCase();
    const hostSubdomain = extractSubdomainFromHost(req.headers.host);

    let tenant = null;

    if (hostSubdomain) {
      tenant = await prisma.instituciones.findFirst({ where: { activo: true, subdominio: hostSubdomain } });
    }
    if (!tenant && headerSlug) {
      tenant = await prisma.instituciones.findFirst({ where: { activo: true, slug: headerSlug } });
    }
    if (!tenant && headerSubdom) {
      tenant = await prisma.instituciones.findFirst({ where: { activo: true, subdominio: headerSubdom } });
    }
    if (!tenant && querySlug) {
      tenant = await prisma.instituciones.findFirst({ where: { activo: true, slug: querySlug } });
    }

    if (!tenant) {
      res.status(404).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'No se pudo identificar la institución.'
      });
      return;
    }

    const reqWithTenant = req as Request & { tenant?: object; tenantId?: number };
    reqWithTenant.tenant = {
      id_institucion: tenant.id_institucion,
      slug: tenant.slug,
      subdominio: tenant.subdominio,
      nombre: tenant.nombre,
      fk_id_cat_locale_default: tenant.fk_id_cat_locale_default,
      fk_id_cat_moneda: tenant.fk_id_cat_moneda
    };
    reqWithTenant.tenantId = tenant.id_institucion;
    return next();
  } catch (err) {
    return next(err);
  }
};
