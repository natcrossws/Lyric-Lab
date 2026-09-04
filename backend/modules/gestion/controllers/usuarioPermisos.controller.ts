import { Request, Response, NextFunction } from 'express';
import prisma from '../../../core/db/prisma';
import { getEntitlementsForInstitucion } from '../../../shared/services/entitlementsService';
import { tiposParaRelPlanSuscripcion } from '../../../shared/services/planUsuarioSeedService';

const PREFIX_BY_TIPO: Record<number, string> = {
  1: '/admin', 5: '/admin', 6: '/admin',
  2: '/profesor', 3: '/padre', 4: '/alumno'
};

const PROFILE_GROUPS_META = [
  { key: 'admin', prefijo: '/admin', etiqueta: 'Administración' },
  { key: 'profesor', prefijo: '/profesor', etiqueta: 'Profesor' },
  { key: 'padre', prefijo: '/padre', etiqueta: 'Padre / tutor' },
  { key: 'alumno', prefijo: '/alumno', etiqueta: 'Alumno' }
];

async function resolvePlanSubmoduleSetForUsuario(_instId: number, _fkTipoUsuario: number): Promise<Set<number>> {
  // Template mode: billing removed, return empty set (all submodules allowed)
  return new Set<number>();
}

function isAdminMenuManager(req: Request): boolean {
  const role = req.user?.role;
  return role === 'GLOBAL_ADMIN' || role === 'ADMIN' || role === 'INSTITUTION_ADMIN';
}

interface SubmoduleWithRuta {
  id_submodulo: number;
  titulo: string;
  descripcion: string | null;
  orden: number | null;
  rutas: { ruta: string } | null;
}

interface ModuloWithSubs {
  id_modulo: number;
  titulo: string;
  submodulos: SubmoduleWithRuta[];
}

function buildModulesOutForPrefix(
  modulosRows: ModuloWithSubs[],
  grantedSet: Set<number>,
  prefix: string,
  planSubmoduleSet: Set<number> | null,
  options: { treatAllAsInPlan?: boolean } = {}
) {
  const { treatAllAsInPlan = false } = options;
  const modulesOut = [];
  for (const m of modulosRows) {
    const subs = (m.submodulos || [])
      .filter((s) => {
        const r = s.rutas && s.rutas.ruta ? String(s.rutas.ruta).trim() : '';
        return r && r.startsWith(prefix);
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
        ruta: s.rutas && s.rutas.ruta ? s.rutas.ruta : '',
        asignado: grantedSet.has(s.id_submodulo),
        en_plan: treatAllAsInPlan || planSubmoduleSet === null || planSubmoduleSet.has(s.id_submodulo)
      }))
    });
  }
  return modulesOut;
}

export const getPermisosSubmodulosCatalog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const targetId = parseInt(req.params.id, 10);
    if (Number.isNaN(targetId)) {
      res.status(400).json({ success: false, message: 'ID inválido' });
      return;
    }

    const target = await prisma.usuarios.findUnique({
      where: { id_usuario: targetId },
      select: { id_usuario: true, fk_id_cat_tipo_usuario: true, nombre: true, fk_id_institucion: true }
    });
    if (!target) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    const ctxInst = req.institutionId ?? null;
    if (ctxInst != null && target.fk_id_institucion != null && target.fk_id_institucion !== ctxInst) {
      res.status(403).json({ success: false, message: 'El usuario no pertenece a la institución del contexto actual.' });
      return;
    }

    const prefix = PREFIX_BY_TIPO[target.fk_id_cat_tipo_usuario];
    if (!prefix) {
      res.status(400).json({ success: false, message: 'Tipo de usuario sin menú por rutas' });
      return;
    }

    const rel = await prisma.rel_usuario_submodulo.findMany({
      where: { fk_id_usuario: targetId, activo: true },
      select: { fk_id_submodulo: true }
    });
    const granted = new Set(rel.map((r) => r.fk_id_submodulo));

    const instIdForPlan = target.fk_id_institucion ?? ctxInst;
    let planSubmoduleSet: Set<number> | null = null;
    if (instIdForPlan) {
      planSubmoduleSet = await resolvePlanSubmoduleSetForUsuario(instIdForPlan, target.fk_id_cat_tipo_usuario);
    }

    const modulos = await prisma.modulos.findMany({
      where: { activo: true, visible: true },
      include: {
        submodulos: {
          where: { activo: true },
          include: { rutas: true },
          orderBy: { orden: 'asc' }
        }
      },
      orderBy: { orden: 'asc' }
    });

    const assignAny = isAdminMenuManager(req);
    const treatAllAsInPlan = assignAny;

    const profile_groups = PROFILE_GROUPS_META.map((meta) => ({
      key: meta.key,
      prefijo: meta.prefijo,
      etiqueta: meta.etiqueta,
      editable: meta.prefijo === prefix,
      modules: buildModulesOutForPrefix(
        modulos as ModuloWithSubs[],
        granted,
        meta.prefijo,
        planSubmoduleSet,
        { treatAllAsInPlan }
      )
    }));

    const modulesEditableOnly = profile_groups.find((g) => g.editable)?.modules ?? [];

    res.status(200).json({
      success: true,
      usuario: {
        id_usuario: target.id_usuario,
        nombre: target.nombre,
        fk_id_cat_tipo_usuario: target.fk_id_cat_tipo_usuario,
        fk_id_institucion: target.fk_id_institucion
      },
      prefijo_rutas: prefix,
      institucion_plan_contexto: instIdForPlan ?? null,
      asignacion_libre: treatAllAsInPlan,
      profile_groups,
      modules: modulesEditableOnly
    });
  } catch (err) {
    next(err);
  }
};

export const updatePermisosSubmodulos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const targetId = parseInt(req.params.id, 10);
    if (Number.isNaN(targetId)) {
      res.status(400).json({ success: false, message: 'ID inválido' });
      return;
    }

    const target = await prisma.usuarios.findUnique({
      where: { id_usuario: targetId },
      select: { id_usuario: true, fk_id_institucion: true, fk_id_cat_tipo_usuario: true }
    });
    if (!target) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    const ctxInst = req.institutionId ?? null;
    if (ctxInst != null && target.fk_id_institucion != null && target.fk_id_institucion !== ctxInst) {
      res.status(403).json({ success: false, message: 'El usuario no pertenece a la institución del contexto actual.' });
      return;
    }

    const { id_submodulos } = req.body as { id_submodulos: unknown };
    if (!Array.isArray(id_submodulos)) {
      res.status(400).json({ success: false, message: 'Se espera id_submodulos: number[]' });
      return;
    }

    const prefix = PREFIX_BY_TIPO[target.fk_id_cat_tipo_usuario];
    const assignAny = isAdminMenuManager(req);

    // Obtener submódulos permitidos por prefijo de ruta
    const allSubs = await prisma.submodulos.findMany({
      where: { activo: true },
      include: { rutas: true }
    });

    const allowedSet = new Set(
      allSubs
        .filter((s) => {
          if (!s.rutas) return false;
          const r = s.rutas.ruta.trim();
          return prefix ? r.startsWith(prefix) : true;
        })
        .map((s) => s.id_submodulo)
    );

    const requested = [...new Set((id_submodulos as number[]).map((x) => parseInt(String(x), 10)).filter(Number.isFinite))];
    const filtered = requested.filter((id) => {
      if (!allowedSet.has(id)) return false;
      return true; // Template: no plan filter
    });
    const omitidos = requested.length - filtered.length;

    // Reemplazar en transacción
    await prisma.$transaction([
      prisma.rel_usuario_submodulo.deleteMany({ where: { fk_id_usuario: targetId } }),
      ...(filtered.length > 0
        ? [prisma.rel_usuario_submodulo.createMany({
          data: filtered.map((fk_id_submodulo) => ({
            fk_id_usuario: targetId,
            fk_id_submodulo,
            activo: true
          }))
        })]
        : [])
    ]);

    res.status(200).json({ success: true, guardados: filtered.length, omitidos_por_prefijo: omitidos });
  } catch (err) {
    next(err);
  }
};
