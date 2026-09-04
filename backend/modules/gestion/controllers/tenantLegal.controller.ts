import type { Request, Response, NextFunction } from 'express';
import * as tenantLegalService from '../services/tenantLegalService';
import prisma from '../../../core/db/prisma';

export async function getAdminLegal(req: Request, res: Response, next: NextFunction) {
  try {
    const instId = req.institutionId;
    if (!instId) return res.status(400).json({ success: false, message: 'Institución no determinada' });
    const codigo = req.params.codigo;
    const doc = await tenantLegalService.getVigenteByPublicSlug(instId, codigo);
    return res.json({ success: true, doc });
  } catch (e) { next(e); }
}

export async function putAdminLegal(req: Request, res: Response, next: NextFunction) {
  try {
    const instId = req.institutionId;
    if (!instId) return res.status(400).json({ success: false, message: 'Institución no determinada' });
    const doc = await tenantLegalService.upsertVigente(instId, req.params.codigo, {
      titulo: req.body?.titulo,
      contenido_html: req.body?.contenido_html
    });
    return res.json({ success: true, doc });
  } catch (e) { next(e); }
}

export async function publishAdminLegal(req: Request, res: Response, next: NextFunction) {
  try {
    const instId = req.institutionId;
    if (!instId) return res.status(400).json({ success: false, message: 'Institución no determinada' });
    const doc = await tenantLegalService.publishNewVersion(instId, req.params.codigo);
    return res.json({ success: true, doc });
  } catch (e) { next(e); }
}

export async function listPublicLegal(req: Request, res: Response, next: NextFunction) {
  try {
    const slug = String(req.query.tenant || req.headers['x-tenant-slug'] || '').trim();
    if (!slug) return res.status(400).json({ success: false, message: 'tenant requerido' });
    const inst = await prisma.instituciones.findFirst({
      where: { OR: [{ slug }, { subdominio: slug }], activo: true }
    });
    if (!inst) return res.status(404).json({ success: false, message: 'Tenant no encontrado' });
    const docs = await tenantLegalService.listVigentesPublic(inst.id_institucion);
    return res.json({ success: true, docs });
  } catch (e) { next(e); }
}

export async function getPublicLegalByCodigo(req: Request, res: Response, next: NextFunction) {
  try {
    const slug = String(req.query.tenant || req.headers['x-tenant-slug'] || '').trim();
    if (!slug) return res.status(400).json({ success: false, message: 'tenant requerido' });
    const inst = await prisma.instituciones.findFirst({
      where: { OR: [{ slug }, { subdominio: slug }], activo: true }
    });
    if (!inst) return res.status(404).json({ success: false, message: 'Tenant no encontrado' });
    const doc = await tenantLegalService.getVigenteByPublicSlug(inst.id_institucion, req.params.codigo);
    if (!doc) return res.status(404).json({ success: false, message: 'Documento no encontrado' });
    return res.json({ success: true, doc });
  } catch (e) { next(e); }
}
