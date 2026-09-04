import fs from 'fs';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import prisma from '../../../core/db/prisma';

const INSTITUCION_NOMBRE_MAX = 150;
const INSTITUCION_SLUG_MAX = 50;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

async function buildPlanSummaryPayload(instId: number) {
  const inst = await prisma.instituciones.findUnique({
    where: { id_institucion: instId },
    select: {
      id_institucion: true,
      nombre: true,
      slug: true,
      fk_id_cat_plan_suscripcion: true,
      activo: true,
      cat_planes_suscripcion: {
        select: {
          id_cat_plan_suscripcion: true,
          nombre: true,
          precio_mensual: true,
          limite_horas_ia: true,
          limite_storage_gb: true,
          limite_users: true,
          activo: true
        }
      }
    }
  });

  if (!inst) return null;

  const estatusVigente = await prisma.cat_estatus_suscripcion.findFirst({
    where: { codigo: 'vigente' }
  });

  let suscripcionActiva = null;
  if (estatusVigente) {
    const sub = await prisma.suscripciones.findFirst({
      where: {
        fk_id_institucion: instId,
        fk_id_cat_estatus_suscripcion: estatusVigente.id_cat_estatus_suscripcion
      },
      orderBy: { fecha_inicio: 'desc' },
      include: {
        cat_estatus_suscripcion: { select: { codigo: true, nombre: true } },
        cat_planes_suscripcion: {
          select: { id_cat_plan_suscripcion: true, nombre: true, precio_mensual: true }
        },
        cat_intervalo_facturacion: { select: { codigo: true, nombre: true } }
      }
    });
    if (sub) {
      suscripcionActiva = {
        id_suscripcion: sub.id_suscripcion,
        fecha_inicio: sub.fecha_inicio,
        fecha_proximo_cobro: sub.fecha_proximo_cobro,
        fecha_fin: sub.fecha_fin,
        precio_total_mensual_snapshot:
          sub.precio_total_mensual_snapshot != null ? Number(sub.precio_total_mensual_snapshot) : null,
        estatus: sub.cat_estatus_suscripcion,
        plan: sub.cat_planes_suscripcion
          ? {
              ...sub.cat_planes_suscripcion,
              precio_mensual:
                sub.cat_planes_suscripcion.precio_mensual != null
                  ? Number(sub.cat_planes_suscripcion.precio_mensual)
                  : null
            }
          : null,
        intervalo: sub.cat_intervalo_facturacion
      };
    }
  }

  const plan = inst.cat_planes_suscripcion;
  return {
    institucion: {
      id_institucion: inst.id_institucion,
      nombre: inst.nombre,
      slug: inst.slug,
      fk_id_cat_plan_suscripcion: inst.fk_id_cat_plan_suscripcion,
      activo: inst.activo === true
    },
    planAsignado: plan
      ? {
          id_cat_plan_suscripcion: plan.id_cat_plan_suscripcion,
          nombre: plan.nombre,
          precio_mensual: plan.precio_mensual != null ? Number(plan.precio_mensual) : null,
          limite_horas_ia: plan.limite_horas_ia,
          limite_storage_gb: plan.limite_storage_gb,
          limite_users: plan.limite_users,
          activo: plan.activo
        }
      : null,
    suscripcionActiva
  };
}

export const getAll = async (_req: Request, res: Response): Promise<void> => {
  try {
    const instituciones = await prisma.instituciones.findMany({
      select: { id_institucion: true, nombre: true },
      where: { activo: true },
      orderBy: { nombre: 'asc' }
    });
    res.json({ success: true, data: instituciones });
  } catch (error) {
    console.error('Error fetching instituciones:', error);
    res.status(500).json({ success: false, error: 'Error al obtener instituciones' });
  }
};

export const getMyPlanSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const instId = req.institutionId;
    if (!instId) {
      res.status(400).json({ success: false, message: 'Institución no determinada' });
      return;
    }

    const payload = await buildPlanSummaryPayload(instId);
    if (!payload) {
      res.status(404).json({ success: false, message: 'Institución no encontrada' });
      return;
    }

    const { institucion, planAsignado, suscripcionActiva } = payload;
    res.json({
      success: true,
      data: {
        institucion: institucion
          ? { id_institucion: institucion.id_institucion, nombre: institucion.nombre, slug: institucion.slug }
          : null,
        planAsignado,
        suscripcionActiva
      }
    });
  } catch (error) {
    console.error('getMyPlanSummary:', error);
    res.status(500).json({ success: false, error: 'Error al obtener el plan de la institución' });
  }
};

export const listInstitucionesGlobalAdmin = async (_req: Request, res: Response): Promise<void> => {
  try {
    const rows = await prisma.instituciones.findMany({
      select: {
        id_institucion: true,
        nombre: true,
        slug: true,
        activo: true,
        fk_id_cat_plan_suscripcion: true,
        f_reg: true,
        cat_planes_suscripcion: {
          select: { id_cat_plan_suscripcion: true, nombre: true, precio_mensual: true }
        }
      },
      orderBy: { nombre: 'asc' }
    });

    res.status(200).json({
      success: true,
      instituciones: rows.map((r) => ({
        id_institucion: r.id_institucion,
        nombre: r.nombre,
        slug: r.slug,
        activo: r.activo === true,
        fk_id_cat_plan_suscripcion: r.fk_id_cat_plan_suscripcion,
        f_reg: r.f_reg,
        plan_catalogo: r.cat_planes_suscripcion
          ? {
              id_cat_plan_suscripcion: r.cat_planes_suscripcion.id_cat_plan_suscripcion,
              nombre: r.cat_planes_suscripcion.nombre,
              precio_mensual:
                r.cat_planes_suscripcion.precio_mensual != null
                  ? Number(r.cat_planes_suscripcion.precio_mensual)
                  : null
            }
          : null
      }))
    });
  } catch (error) {
    console.error('listInstitucionesGlobalAdmin:', error);
    res.status(500).json({ success: false, error: 'Error al listar instituciones' });
  }
};

export const getInstitucionPlanResumenGlobal = async (req: Request, res: Response): Promise<void> => {
  try {
    const instId = parseInt(req.params.institutionId, 10);
    if (Number.isNaN(instId)) {
      res.status(400).json({ success: false, message: 'institutionId inválido' });
      return;
    }

    const payload = await buildPlanSummaryPayload(instId);
    if (!payload) {
      res.status(404).json({ success: false, message: 'Institución no encontrada' });
      return;
    }

    const pagosRecientes = await prisma.pagos_suscripciones.findMany({
      where: { fk_id_institucion: instId },
      orderBy: { fecha_pago: 'desc' },
      take: 10
    });

    res.status(200).json({
      success: true,
      data: {
        ...payload,
        pagosRecientes: pagosRecientes.map((p) => ({
          id_pago_suscripcion: p.id_pago_suscripcion,
          monto: p.monto != null ? Number(p.monto) : null,
          status: p.status,
          fecha_pago: p.fecha_pago,
          intervalo: p.intervalo
        }))
      }
    });
  } catch (error) {
    console.error('getInstitucionPlanResumenGlobal:', error);
    res.status(500).json({ success: false, error: 'Error al obtener resumen de la institución' });
  }
};

export const getInstitucionPagosSuscripcionGlobal = async (req: Request, res: Response): Promise<void> => {
  try {
    const instId = parseInt(req.params.institutionId, 10);
    if (Number.isNaN(instId)) {
      res.status(400).json({ success: false, message: 'institutionId inválido' });
      return;
    }

    const exists = await prisma.instituciones.findUnique({
      where: { id_institucion: instId },
      select: { id_institucion: true }
    });
    if (!exists) {
      res.status(404).json({ success: false, message: 'Institución no encontrada' });
      return;
    }

    const pagos = await prisma.pagos_suscripciones.findMany({
      where: { fk_id_institucion: instId },
      orderBy: { fecha_pago: 'desc' },
      take: 50
    });

    res.status(200).json({
      success: true,
      pagos: pagos.map((p) => ({
        id_pago_suscripcion: p.id_pago_suscripcion,
        monto: p.monto != null ? Number(p.monto) : null,
        moneda: p.moneda,
        status: p.status,
        fecha_pago: p.fecha_pago,
        metodo_pago: p.metodo_pago,
        intervalo: p.intervalo,
        stripe_session_id: p.stripe_session_id,
        fk_id_suscripcion: p.fk_id_suscripcion
      }))
    });
  } catch (error) {
    console.error('getInstitucionPagosSuscripcionGlobal:', error);
    res.status(500).json({ success: false, error: 'Error al listar pagos de suscripción' });
  }
};

export const putInstitucionPlanCatalogoGlobal = async (req: Request, res: Response): Promise<void> => {
  try {
    const instId = parseInt(req.params.institutionId, 10);
    if (Number.isNaN(instId)) {
      res.status(400).json({ success: false, message: 'institutionId inválido' });
      return;
    }

    const raw = (req.body as Record<string, unknown>)?.fk_id_cat_plan_suscripcion;
    if (raw === undefined) {
      res.status(400).json({ success: false, message: 'fk_id_cat_plan_suscripcion requerido (o null)' });
      return;
    }

    const inst = await prisma.instituciones.findUnique({ where: { id_institucion: instId } });
    if (!inst) {
      res.status(404).json({ success: false, message: 'Institución no encontrada' });
      return;
    }

    let fkPlan: number | null = null;
    if (raw !== null && raw !== '') {
      fkPlan = parseInt(String(raw), 10);
      if (Number.isNaN(fkPlan)) {
        res.status(400).json({ success: false, message: 'fk_id_cat_plan_suscripcion inválido' });
        return;
      }
      const plan = await prisma.cat_planes_suscripcion.findUnique({
        where: { id_cat_plan_suscripcion: fkPlan }
      });
      if (!plan) {
        res.status(404).json({ success: false, message: 'Plan no encontrado' });
        return;
      }
    }

    await prisma.instituciones.update({
      where: { id_institucion: instId },
      data: { fk_id_cat_plan_suscripcion: fkPlan }
    });

    res.status(200).json({
      success: true,
      institucion: { id_institucion: instId, fk_id_cat_plan_suscripcion: fkPlan }
    });
  } catch (error) {
    console.error('putInstitucionPlanCatalogoGlobal:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar el plan de la institución' });
  }
};

export const putInstitucionDatosGlobal = async (req: Request, res: Response): Promise<void> => {
  try {
    const instId = parseInt(req.params.institutionId, 10);
    if (Number.isNaN(instId)) {
      res.status(400).json({ success: false, message: 'institutionId inválido' });
      return;
    }

    const inst = await prisma.instituciones.findUnique({ where: { id_institucion: instId } });
    if (!inst) {
      res.status(404).json({ success: false, message: 'Institución no encontrada' });
      return;
    }

    const { nombre: nombreRaw, slug: slugRaw, activo: activoRaw } = req.body as Record<string, unknown>;
    const updates: Record<string, unknown> = {};

    if (nombreRaw !== undefined) {
      const nombre = String(nombreRaw).trim();
      if (!nombre || nombre.length > INSTITUCION_NOMBRE_MAX) {
        res.status(400).json({ success: false, message: `El nombre es obligatorio y máximo ${INSTITUCION_NOMBRE_MAX} caracteres` });
        return;
      }
      updates.nombre = nombre;
    }

    if (slugRaw !== undefined) {
      const slug = String(slugRaw).trim().toLowerCase();
      if (!slug || slug.length > INSTITUCION_SLUG_MAX || !SLUG_RE.test(slug)) {
        res.status(400).json({ success: false, message: 'Slug inválido: solo minúsculas, números y guiones' });
        return;
      }
      const dup = await prisma.instituciones.findFirst({ where: { slug, NOT: { id_institucion: instId } } });
      if (dup) {
        res.status(409).json({ success: false, message: 'Ese slug ya está en uso' });
        return;
      }
      updates.slug = slug;
    }

    if (activoRaw !== undefined) updates.activo = Boolean(activoRaw);

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ success: false, message: 'No hay campos para actualizar' });
      return;
    }

    const updated = await prisma.instituciones.update({ where: { id_institucion: instId }, data: updates });

    res.status(200).json({
      success: true,
      institucion: { id_institucion: updated.id_institucion, nombre: updated.nombre, slug: updated.slug, activo: updated.activo }
    });
  } catch (error) {
    console.error('putInstitucionDatosGlobal:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar la institución' });
  }
};

export const createInstitucionGlobalAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre: nombreRaw, slug: slugRaw, activo: activoRaw, subdominio: subdominioRaw } = req.body as Record<string, unknown>;

    const nombre = String(nombreRaw || '').trim();
    if (!nombre || nombre.length > INSTITUCION_NOMBRE_MAX) {
      res.status(400).json({ success: false, message: `El nombre es obligatorio y máximo ${INSTITUCION_NOMBRE_MAX} caracteres` });
      return;
    }

    let slug = String(slugRaw || '').trim().toLowerCase();
    if (!slug) {
      slug = nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }

    if (slug.length > INSTITUCION_SLUG_MAX || !SLUG_RE.test(slug)) {
      res.status(400).json({ success: false, message: 'Slug inválido' });
      return;
    }

    const dup = await prisma.instituciones.findFirst({ where: { slug } });
    if (dup) {
      res.status(409).json({ success: false, message: 'Ese slug ya está en uso' });
      return;
    }

    let subdominio: string | null = null;
    if (subdominioRaw) {
      subdominio = String(subdominioRaw).trim().toLowerCase();
      const dupSub = await prisma.instituciones.findFirst({ where: { subdominio } });
      if (dupSub) {
        res.status(409).json({ success: false, message: 'Ese subdominio ya está en uso' });
        return;
      }
    }

    const activo = activoRaw !== undefined ? Boolean(activoRaw) : true;

    const newInst = await prisma.instituciones.create({
      data: { nombre, slug, subdominio, activo, f_reg: new Date() }
    });

    res.status(201).json({
      success: true,
      institucion: {
        id_institucion: newInst.id_institucion,
        nombre: newInst.nombre,
        slug: newInst.slug,
        activo: newInst.activo,
        f_reg: newInst.f_reg
      }
    });
  } catch (error) {
    console.error('createInstitucionGlobalAdmin:', error);
    res.status(500).json({ success: false, error: 'Error al crear la institución' });
  }
};

export const updateApariencia = async (req: Request, res: Response): Promise<void> => {
  try {
    const instId = req.institutionId;
    if (!instId) {
      res.status(400).json({ success: false, message: 'Institución no determinada' });
      return;
    }

    const { 
      nombre, logoBase64, primaryColor, secondaryColor, tertiaryColor, 
      backgroundColor, textColor, loginTemplate,
      loginBackgroundType, loginPrimaryColor, loginSecondaryColor, 
      loginBackgroundColor, loginBackgroundUrl
    } = req.body as Record<string, unknown>;

    const inst = await prisma.instituciones.findUnique({ where: { id_institucion: instId } });
    if (!inst) {
      res.status(404).json({ success: false, message: 'Institución no encontrada' });
      return;
    }

    const currentConfig = (inst.configuracion_json as Record<string, unknown>) || {};
    const apariencia: Record<string, unknown> = (currentConfig.apariencia as Record<string, unknown>) || {};

    if (logoBase64 !== undefined) apariencia.logoBase64 = logoBase64;
    if (primaryColor !== undefined) apariencia.primaryColor = primaryColor;
    if (secondaryColor !== undefined) apariencia.secondaryColor = secondaryColor;
    if (tertiaryColor !== undefined) apariencia.tertiaryColor = tertiaryColor;
    if (backgroundColor !== undefined) apariencia.backgroundColor = backgroundColor;
    if (textColor !== undefined) apariencia.textColor = textColor;
    if (loginTemplate !== undefined) apariencia.loginTemplate = loginTemplate;
    if (loginBackgroundType !== undefined) apariencia.loginBackgroundType = loginBackgroundType;
    if (loginPrimaryColor !== undefined) apariencia.loginPrimaryColor = loginPrimaryColor;
    if (loginSecondaryColor !== undefined) apariencia.loginSecondaryColor = loginSecondaryColor;
    if (loginBackgroundColor !== undefined) apariencia.loginBackgroundColor = loginBackgroundColor;
    if (loginBackgroundUrl !== undefined) apariencia.loginBackgroundUrl = loginBackgroundUrl;

    currentConfig.apariencia = apariencia;

    const updateData: Record<string, unknown> = { configuracion_json: currentConfig };
    if (nombre !== undefined && String(nombre).trim() !== '') {
      updateData.nombre = String(nombre).trim();
    }

    await prisma.instituciones.update({ where: { id_institucion: instId }, data: updateData });

    // Guardar global_theme.json
    try {
      const dataDir = path.join(__dirname, '../../../../data');
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      const jsonPath = path.join(dataDir, 'global_theme.json');
      const globalThemeData = { nombre: updateData.nombre || inst.nombre, ...apariencia, updatedAt: new Date().toISOString() };
      fs.writeFileSync(jsonPath, JSON.stringify(globalThemeData, null, 2), 'utf8');
    } catch { /* no crítico */ }

    res.json({ success: true, data: { nombre: updateData.nombre || inst.nombre, apariencia } });
  } catch (error) {
    console.error('updateApariencia:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar la apariencia' });
  }
};

export const getPublicTheme = async (req: Request, res: Response): Promise<void> => {
  try {
    const { hostname, id } = req.query as Record<string, string | undefined>;

    const dataDir = path.join(__dirname, '../../../../data');
    const jsonPath = path.join(dataDir, 'global_theme.json');

    let globalThemeFile: Record<string, unknown> | null = null;
    if (fs.existsSync(jsonPath)) {
      try {
        globalThemeFile = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      } catch { /* ignore */ }
    }

    if (globalThemeFile && (!hostname || hostname === 'localhost')) {
      res.json({
        success: true,
        data: {
          nombre: globalThemeFile.nombre,
          logoBase64: globalThemeFile.logoBase64 || null,
          primaryColor: globalThemeFile.primaryColor || null,
          secondaryColor: globalThemeFile.secondaryColor || null,
          tertiaryColor: globalThemeFile.tertiaryColor || null,
          backgroundColor: globalThemeFile.backgroundColor || null,
          textColor: globalThemeFile.textColor || null,
          loginTemplate: globalThemeFile.loginTemplate || 'default',
          loginBackgroundType: globalThemeFile.loginBackgroundType || 'waves',
          loginPrimaryColor: globalThemeFile.loginPrimaryColor || null,
          loginSecondaryColor: globalThemeFile.loginSecondaryColor || null,
          loginBackgroundColor: globalThemeFile.loginBackgroundColor || null,
          loginBackgroundUrl: globalThemeFile.loginBackgroundUrl || null
        }
      });
      return;
    }

    let inst = null;

    if (id) {
      inst = await prisma.instituciones.findUnique({
        where: { id_institucion: parseInt(id, 10) },
        select: { nombre: true, configuracion_json: true }
      });
    } else if (hostname) {
      const parts = hostname.split('.');
      let subdominio: string | null = null;
      if (parts.length > 2) subdominio = parts[0];
      if (subdominio && subdominio !== 'www') {
        inst = await prisma.instituciones.findFirst({
          where: { subdominio },
          select: { nombre: true, configuracion_json: true }
        });
      }
    }

    if (!inst) {
      inst = await prisma.instituciones.findUnique({
        where: { id_institucion: 1 },
        select: { nombre: true, configuracion_json: true }
      });
    }

    if (!inst) {
      res.json({ success: true, data: null });
      return;
    }

    const config = (inst.configuracion_json as Record<string, unknown>) || {};
    const apariencia = (config.apariencia as Record<string, unknown>) || {};

    res.json({
      success: true,
      data: {
        nombre: inst.nombre,
        logoBase64: apariencia.logoBase64 || null,
        primaryColor: apariencia.primaryColor || null,
        secondaryColor: apariencia.secondaryColor || null,
        tertiaryColor: apariencia.tertiaryColor || null,
        backgroundColor: apariencia.backgroundColor || null,
        textColor: apariencia.textColor || null,
        loginTemplate: apariencia.loginTemplate || 'default',
        loginBackgroundType: apariencia.loginBackgroundType || 'waves',
        loginPrimaryColor: apariencia.loginPrimaryColor || null,
        loginSecondaryColor: apariencia.loginSecondaryColor || null,
        loginBackgroundColor: apariencia.loginBackgroundColor || null,
        loginBackgroundUrl: apariencia.loginBackgroundUrl || null
      }
    });
  } catch (error) {
    console.error('getPublicTheme:', error);
    res.status(500).json({ success: false, error: 'Error al obtener el tema' });
  }
};
