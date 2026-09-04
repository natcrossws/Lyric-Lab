import { getEntitlementsForInstitucion } from './entitlementsService';
import prisma from '../../core/db/prisma';

/** Rutas reservadas solo para Admin global (tipo 6). */
export const SOLO_TIPO_6_RUTAS = new Set([
  '/admin/configuracion-planes-submodulos',
  '/admin/instituciones-plataforma',
  '/admin/documentos-legales'
]);

/** Administrador legacy (1), profesor, padre/tutor, alumno, admin institucional, admin global */
const TIPOS_SEMBRAR_POR_INSTITUCION = new Set([1, 2, 3, 4, 5, 6]);

/**
 * Filas en rel_cat_plan_suscripcion_submodulo usan fk_id_cat_tipo_usuario por portal.
 * Admin global (6) tiene filas propias + las compartidas con admin institucional (5).
 */
export function tiposParaRelPlanSuscripcion(tipo: number): number[] {
  const t = parseInt(String(tipo), 10);
  if (t === 1) return [1, 5];
  if (t === 5) return [5];
  if (t === 6) return [5, 6];
  return [t];
}

interface SeedOptions {
  userId: number;
  fk_id_institucion?: number | null;
  fk_id_cat_tipo_usuario: number;
}

/**
 * Siembra rel_usuario_submodulo con submódulos del plan vigente.
 */
export async function seedRelUsuarioSubmodulosFromPlan(
  { userId, fk_id_institucion, fk_id_cat_tipo_usuario }: SeedOptions
): Promise<{ seeded: number }> {
  const tipo = parseInt(String(fk_id_cat_tipo_usuario), 10);
  const uid = parseInt(String(userId), 10);
  const instId = fk_id_institucion != null ? parseInt(String(fk_id_institucion), 10) : null;

  if (!Number.isFinite(uid) || !Number.isFinite(tipo) || !TIPOS_SEMBRAR_POR_INSTITUCION.has(tipo)) {
    return { seeded: 0 };
  }
  if (!instId || Number.isNaN(instId)) {
    return { seeded: 0 };
  }

  const tiposRel = tiposParaRelPlanSuscripcion(tipo);
  const ent = await getEntitlementsForInstitucion(instId, {
    fkIdsCatTipoUsuarioForPlanRel: tiposRel,
    omitFallbackAllSubmodules: true,
    skipDependencyExpansion: true
  });

  const allowed = new Set(ent.idSubmodulos || []);
  if (allowed.size === 0) {
    return { seeded: 0 };
  }

  const planId = ent.fkIdCatPlanSuscripcion;
  if (!planId) {
    return { seeded: 0 };
  }

  const relRows = await prisma.rel_cat_plan_suscripcion_submodulo.findMany({
    where: {
      fk_id_cat_plan_suscripcion: planId,
      fk_id_cat_tipo_usuario: { in: tiposRel },
      vigente: true
    },
    select: { fk_id_submodulo: true }
  });

  const ids = [...new Set(relRows.map((r) => r.fk_id_submodulo))].filter((id) => allowed.has(id));
  if (ids.length === 0) {
    return { seeded: 0 };
  }

  await prisma.$transaction(async (tx) => {
    await tx.rel_usuario_submodulo.deleteMany({ where: { fk_id_usuario: uid } });
    await tx.rel_usuario_submodulo.createMany({
      data: ids.map((fk_id_submodulo) => ({
        fk_id_usuario: uid,
        fk_id_submodulo,
        activo: true
      }))
    });
  });

  return { seeded: ids.length };
}
