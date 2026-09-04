/**
 * Catálogo de planes + editor de submódulos por portal.
 */
import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../../../core/db/prisma';
import { SOLO_TIPO_6_RUTAS } from '../../../shared/services/planUsuarioSeedService';

const MAX_PRECIO_PLAN = 99999999.99;
const PLAN_NOMBRE_MAX = 50;

function roundPrecioPlan(pr: number): number {
  return Math.round(Number(pr) * 100) / 100;
}

const PROFILE_GROUPS = [
  { key: 'admin_inst', prefijo: '/admin', fk_id_cat_tipo_usuario: 5, etiqueta: 'Admin del tenant' },
  { key: 'admin_global', prefijo: '/admin', fk_id_cat_tipo_usuario: 6, etiqueta: 'Admin global' }
] as const;

const TIPOS_VALIDOS = new Set(PROFILE_GROUPS.map((g) => g.fk_id_cat_tipo_usuario));

type ModuloRow = {
  id_modulo: number;
  titulo: string;
  orden: number | null;
  submodulos: Array<{
    id_submodulo: number;
    titulo: string;
    descripcion: string | null;
    orden: number | null;
    rutas: { ruta: string } | null;
  }>;
};

function modulesForPrefixTipo(
  modulosRows: ModuloRow[],
  prefijo: string,
  grantedSetForTipo: Set<number>
) {
  const modulesOut = [];
  for (const m of modulosRows) {
    const subs = (m.submodulos || [])
      .filter((s) => {
        const r = s.rutas?.ruta ? String(s.rutas.ruta).trim() : '';
        return r && r.startsWith(prefijo);
      })
      .sort((a, b) => (a.orden || 0) - (b.orden || 0));

    if (subs.length === 0) continue;

    modulesOut.push({
      id_modulo: m.id_modulo,
      titulo: m.titulo,
      items: subs.map((s) => ({
        id_submodulo: s.id_submodulo,
        titulo: s.titulo,
        descripcion: s.descripcion || '',
        ruta: s.rutas?.ruta || '',
        in_plan: grantedSetForTipo.has(s.id_submodulo)
      }))
    });
  }
  return modulesOut;
}

function serializePlan(p: {
  id_cat_plan_suscripcion: number;
  nombre: string;
  precio_mensual: Prisma.Decimal | null;
  limite_horas_ia: number | null;
  limite_storage_gb: number | null;
  limite_users: number | null;
  activo: boolean;
}) {
  return {
    id_cat_plan_suscripcion: p.id_cat_plan_suscripcion,
    nombre: p.nombre,
    precio_mensual: p.precio_mensual != null ? Number(p.precio_mensual) : null,
    limite_horas_ia: p.limite_horas_ia,
    limite_storage_gb: p.limite_storage_gb,
    limite_users: p.limite_users,
    activo: p.activo === true
  };
}

export const listCatPlanes = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rows = await prisma.cat_planes_suscripcion.findMany({
      orderBy: { id_cat_plan_suscripcion: 'asc' }
    });
    res.status(200).json({ success: true, planes: rows.map(serializePlan) });
  } catch (err) {
    next(err);
  }
};

export const putCatPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const planId = parseInt(req.params.planId, 10);
    if (Number.isNaN(planId)) {
      res.status(400).json({ success: false, message: 'planId inválido' });
      return;
    }

    const plan = await prisma.cat_planes_suscripcion.findUnique({
      where: { id_cat_plan_suscripcion: planId }
    });
    if (!plan) {
      res.status(404).json({ success: false, message: 'Plan no encontrado' });
      return;
    }

    const body = req.body || {};
    const updates: Prisma.cat_planes_suscripcionUpdateInput = {};

    if (body.nombre !== undefined) {
      const n = String(body.nombre).trim();
      if (!n || n.length > PLAN_NOMBRE_MAX) {
        res.status(400).json({
          success: false,
          message: `El nombre es obligatorio y máximo ${PLAN_NOMBRE_MAX} caracteres`
        });
        return;
      }
      updates.nombre = n;
    }

    if (body.precio_mensual !== undefined) {
      const pr = Number(body.precio_mensual);
      if (Number.isNaN(pr) || pr < 0) {
        res.status(400).json({ success: false, message: 'precio_mensual inválido' });
        return;
      }
      const rounded = roundPrecioPlan(pr);
      if (!Number.isFinite(rounded) || rounded > MAX_PRECIO_PLAN) {
        res.status(400).json({
          success: false,
          message: `precio_mensual fuera de rango permitido (máx. ${MAX_PRECIO_PLAN})`
        });
        return;
      }
      updates.precio_mensual = rounded;
    }

    if (body.limite_horas_ia !== undefined) {
      const h = parseInt(String(body.limite_horas_ia), 10);
      if (!Number.isFinite(h) || h < 0) {
        res.status(400).json({ success: false, message: 'limite_horas_ia inválido' });
        return;
      }
      updates.limite_horas_ia = h;
    }

    if (body.limite_storage_gb !== undefined) {
      const g = parseInt(String(body.limite_storage_gb), 10);
      if (!Number.isFinite(g) || g < 0) {
        res.status(400).json({ success: false, message: 'limite_storage_gb inválido' });
        return;
      }
      updates.limite_storage_gb = g;
    }

    if (body.limite_users !== undefined) {
      const u = parseInt(String(body.limite_users), 10);
      if (!Number.isFinite(u) || u < 0) {
        res.status(400).json({ success: false, message: 'limite_users inválido (0 = ilimitado)' });
        return;
      }
      updates.limite_users = u;
    }

    if (body.activo !== undefined) {
      updates.activo = Boolean(body.activo);
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ success: false, message: 'No hay campos para actualizar' });
      return;
    }

    const updated = await prisma.cat_planes_suscripcion.update({
      where: { id_cat_plan_suscripcion: planId },
      data: updates
    });
    res.status(200).json({ success: true, plan: serializePlan(updated) });
  } catch (err) {
    next(err);
  }
};

export const postCatPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = req.body || {};
    const nombre = String(body.nombre || '').trim();
    if (!nombre || nombre.length > PLAN_NOMBRE_MAX) {
      res.status(400).json({
        success: false,
        message: `El nombre es obligatorio y máximo ${PLAN_NOMBRE_MAX} caracteres`
      });
      return;
    }

    const pr = Number(body.precio_mensual);
    if (Number.isNaN(pr) || pr < 0) {
      res.status(400).json({ success: false, message: 'precio_mensual inválido' });
      return;
    }
    const precioMensual = roundPrecioPlan(pr);
    if (!Number.isFinite(precioMensual) || precioMensual > MAX_PRECIO_PLAN) {
      res.status(400).json({
        success: false,
        message: `precio_mensual debe ser un monto válido y como máximo ${MAX_PRECIO_PLAN}`
      });
      return;
    }

    const h = parseInt(String(body.limite_horas_ia ?? 0), 10);
    const g = parseInt(String(body.limite_storage_gb ?? 0), 10);
    const u = parseInt(String(body.limite_users ?? 0), 10);
    if (!Number.isFinite(h) || h < 0 || !Number.isFinite(g) || g < 0 || !Number.isFinite(u) || u < 0) {
      res.status(400).json({ success: false, message: 'Límites numéricos inválidos' });
      return;
    }

    const plan = await prisma.$transaction(async (tx) => {
      const created = await tx.cat_planes_suscripcion.create({
        data: {
          nombre,
          precio_mensual: precioMensual,
          limite_horas_ia: h,
          limite_storage_gb: g,
          limite_users: u,
          activo: body.activo === undefined ? true : Boolean(body.activo)
        }
      });

      const newId = created.id_cat_plan_suscripcion;
      const cloneRaw = body.clonar_submodulos_de_plan_id;

      if (cloneRaw != null && cloneRaw !== '') {
        const srcId = parseInt(String(cloneRaw), 10);
        if (!Number.isNaN(srcId) && srcId !== newId) {
          const src = await tx.cat_planes_suscripcion.findUnique({
            where: { id_cat_plan_suscripcion: srcId }
          });
          if (!src) {
            throw Object.assign(new Error('Plan origen para clonar submódulos no encontrado'), { status: 400 });
          }
          const relSrc = await tx.rel_cat_plan_suscripcion_submodulo.findMany({
            where: { fk_id_cat_plan_suscripcion: srcId }
          });
          const seenPairs = new Set<string>();
          const rowsClone = [];
          for (const row of relSrc) {
            const key = `${row.fk_id_submodulo}_${row.fk_id_cat_tipo_usuario}`;
            if (seenPairs.has(key)) continue;
            seenPairs.add(key);
            rowsClone.push({
              fk_id_cat_plan_suscripcion: newId,
              fk_id_submodulo: row.fk_id_submodulo,
              fk_id_cat_tipo_usuario: row.fk_id_cat_tipo_usuario,
              vigente: row.vigente !== false
            });
          }
          if (rowsClone.length > 0) {
            await tx.rel_cat_plan_suscripcion_submodulo.createMany({ data: rowsClone });
          }
        }
      }

      const rutasRows = await tx.rutas.findMany({
        where: { ruta: { in: [...SOLO_TIPO_6_RUTAS] } },
        select: { id_ruta: true }
      });
      for (const rr of rutasRows) {
        const sm = await tx.submodulos.findFirst({
          where: { fk_id_ruta: rr.id_ruta, activo: true },
          select: { id_submodulo: true }
        });
        if (!sm) continue;
        const exists = await tx.rel_cat_plan_suscripcion_submodulo.findFirst({
          where: {
            fk_id_cat_plan_suscripcion: newId,
            fk_id_submodulo: sm.id_submodulo,
            fk_id_cat_tipo_usuario: 6
          }
        });
        if (!exists) {
          await tx.rel_cat_plan_suscripcion_submodulo.create({
            data: {
              fk_id_cat_plan_suscripcion: newId,
              fk_id_submodulo: sm.id_submodulo,
              fk_id_cat_tipo_usuario: 6,
              vigente: true
            }
          });
        }
      }

      return created;
    });

    res.status(201).json({ success: true, plan: serializePlan(plan) });
  } catch (err) {
    const e = err as Error & { status?: number };
    if (e.status === 400) {
      res.status(400).json({ success: false, message: e.message });
      return;
    }
    next(err);
  }
};

export const getPlanSubmodulosEditor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const planId = parseInt(req.params.planId, 10);
    if (Number.isNaN(planId)) {
      res.status(400).json({ success: false, message: 'planId inválido' });
      return;
    }

    const plan = await prisma.cat_planes_suscripcion.findUnique({
      where: { id_cat_plan_suscripcion: planId }
    });
    if (!plan) {
      res.status(404).json({ success: false, message: 'Plan no encontrado' });
      return;
    }

    const grantedRows = await prisma.rel_cat_plan_suscripcion_submodulo.findMany({
      where: { fk_id_cat_plan_suscripcion: planId, vigente: true },
      select: { fk_id_submodulo: true, fk_id_cat_tipo_usuario: true }
    });
    const grantedByTipo = new Map<number, Set<number>>();
    for (const row of grantedRows) {
      if (!grantedByTipo.has(row.fk_id_cat_tipo_usuario)) {
        grantedByTipo.set(row.fk_id_cat_tipo_usuario, new Set());
      }
      grantedByTipo.get(row.fk_id_cat_tipo_usuario)!.add(row.fk_id_submodulo);
    }

    const modulos = await prisma.modulos.findMany({
      where: { activo: true, visible: true },
      include: {
        submodulos: {
          where: { activo: true },
          include: { rutas: { select: { ruta: true } } }
        }
      },
      orderBy: { orden: 'asc' }
    });

    const profile_groups = PROFILE_GROUPS.map((meta) => ({
      key: meta.key,
      fk_id_cat_tipo_usuario: meta.fk_id_cat_tipo_usuario,
      prefijo: meta.prefijo,
      etiqueta: meta.etiqueta,
      modules: modulesForPrefixTipo(
        modulos as ModuloRow[],
        meta.prefijo,
        grantedByTipo.get(meta.fk_id_cat_tipo_usuario) || new Set()
      )
    }));

    res.status(200).json({
      success: true,
      plan: serializePlan(plan),
      profile_groups
    });
  } catch (err) {
    next(err);
  }
};

export const putPlanSubmodulos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const planId = parseInt(req.params.planId, 10);
    if (Number.isNaN(planId)) {
      res.status(400).json({ success: false, message: 'planId inválido' });
      return;
    }

    const plan = await prisma.cat_planes_suscripcion.findUnique({
      where: { id_cat_plan_suscripcion: planId }
    });
    if (!plan) {
      res.status(404).json({ success: false, message: 'Plan no encontrado' });
      return;
    }

    const rowsToInsert: Array<{
      fk_id_cat_plan_suscripcion: number;
      fk_id_submodulo: number;
      fk_id_cat_tipo_usuario: number;
      vigente: boolean;
    }> = [];

    const body = req.body || {};

    if (
      body.id_submodulos_por_tipo != null
      && typeof body.id_submodulos_por_tipo === 'object'
      && !Array.isArray(body.id_submodulos_por_tipo)
    ) {
      const porTipo = body.id_submodulos_por_tipo as Record<string, unknown>;
      for (const [k, arr] of Object.entries(porTipo)) {
        const tipo = parseInt(String(k), 10);
        if (!TIPOS_VALIDOS.has(tipo as 5 | 6)) {
          res.status(400).json({ success: false, message: `Tipo de usuario no válido en la clave "${k}"` });
          return;
        }
        if (!Array.isArray(arr)) {
          res.status(400).json({ success: false, message: `Se espera un array para el tipo ${tipo}` });
          return;
        }
        const ids = [...new Set(arr.map((x) => parseInt(String(x), 10)).filter(Number.isFinite))];
        if (ids.length === 0) continue;

        const valid = await prisma.submodulos.findMany({
          where: { id_submodulo: { in: ids }, activo: true },
          select: { id_submodulo: true }
        });
        const validSet = new Set(valid.map((r) => r.id_submodulo));
        const filtered = ids.filter((id) => validSet.has(id));
        if (filtered.length !== ids.length) {
          res.status(400).json({ success: false, message: 'Algún id_submodulo no existe o está inactivo' });
          return;
        }

        const meta = PROFILE_GROUPS.find((g) => g.fk_id_cat_tipo_usuario === tipo);
        const pref = meta ? meta.prefijo : '';
        const subsConRuta = await prisma.submodulos.findMany({
          where: { id_submodulo: { in: filtered }, activo: true },
          include: { rutas: { select: { ruta: true } } }
        });
        for (const s of subsConRuta) {
          const ruta = s.rutas?.ruta ? String(s.rutas.ruta).trim() : '';
          if (!ruta.startsWith(pref)) {
            res.status(400).json({
              success: false,
              message: `El submódulo ${s.id_submodulo} no pertenece al portal del tipo ${tipo}`
            });
            return;
          }
          if (tipo === 5 && SOLO_TIPO_6_RUTAS.has(ruta)) {
            res.status(400).json({
              success: false,
              message: `El submódulo ${s.id_submodulo} solo puede asignarse al tipo 6 (admin global)`
            });
            return;
          }
        }

        for (const fk_id_submodulo of filtered) {
          rowsToInsert.push({
            fk_id_cat_plan_suscripcion: planId,
            fk_id_submodulo,
            fk_id_cat_tipo_usuario: tipo,
            vigente: true
          });
        }
      }
    } else if (Array.isArray(body.id_submodulos)) {
      const requested = [...new Set(
        (body.id_submodulos as unknown[])
          .map((x) => parseInt(String(x), 10))
          .filter((n): n is number => Number.isFinite(n))
      )];
      if (requested.length > 0) {
        const valid = await prisma.submodulos.findMany({
          where: { id_submodulo: { in: requested }, activo: true },
          include: { rutas: { select: { ruta: true } } }
        });
        if (valid.length !== requested.length) {
          res.status(400).json({ success: false, message: 'Algún id_submodulo no existe o está inactivo' });
          return;
        }
        const seenPair = new Set<string>();
        for (const s of valid) {
          const ruta = s.rutas?.ruta ? String(s.rutas.ruta).trim() : '';
          for (const meta of PROFILE_GROUPS) {
            if (!ruta.startsWith(meta.prefijo)) continue;
            if (SOLO_TIPO_6_RUTAS.has(ruta) && meta.fk_id_cat_tipo_usuario !== 6) continue;
            const key = `${meta.fk_id_cat_tipo_usuario}_${s.id_submodulo}`;
            if (seenPair.has(key)) continue;
            seenPair.add(key);
            rowsToInsert.push({
              fk_id_cat_plan_suscripcion: planId,
              fk_id_submodulo: s.id_submodulo,
              fk_id_cat_tipo_usuario: meta.fk_id_cat_tipo_usuario,
              vigente: true
            });
          }
        }
      }
    } else {
      res.status(400).json({
        success: false,
        message: 'Se espera id_submodulos_por_tipo o id_submodulos (legacy)'
      });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.rel_cat_plan_suscripcion_submodulo.deleteMany({
        where: { fk_id_cat_plan_suscripcion: planId }
      });
      if (rowsToInsert.length > 0) {
        await tx.rel_cat_plan_suscripcion_submodulo.createMany({ data: rowsToInsert });
      }
    });

    res.status(200).json({ success: true, guardados: rowsToInsert.length });
  } catch (err) {
    next(err);
  }
};
