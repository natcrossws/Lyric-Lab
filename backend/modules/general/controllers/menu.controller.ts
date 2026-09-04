import { Request, Response, NextFunction } from 'express';
import prisma from '../../../core/db/prisma';
import { getEntitlementsForInstitucion } from '../../../shared/services/entitlementsService';
import { tiposParaRelPlanSuscripcion } from '../../../shared/services/planUsuarioSeedService';

function pathPrefixForJwtRole(role: string): string | null {
  const map: Record<string, string> = {
    ADMIN: '/admin',
    GLOBAL_ADMIN: '/admin',
    INSTITUTION_ADMIN: '/admin',
    PROFESOR: '/profesor',
    PADRE: '/padre',
    ALUMNO: '/alumno'
  };
  return map[role] || null;
}

/**
 * Menú lateral: solo submódulos explícitos en rel_usuario_submodulo (activo),
 * intersectados con lo que el plan de la institución permite y filtrados por prefijo de rol.
 */
export const getSidebarMenu = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.id_usuario;
    const fkIdInstitucion = req.institutionId;
    const jwtRole = req.user.role as string;
    const prefix = pathPrefixForJwtRole(jwtRole);

    const relRows = await prisma.rel_usuario_submodulo.findMany({
      where: { fk_id_usuario: userId, activo: true },
      select: { fk_id_submodulo: true }
    });
    const userSubmoduleIds = relRows.map((r) => r.fk_id_submodulo);

    let planSubmoduleIds: Set<number> | null = null;
    if (fkIdInstitucion) {
      const tipoUsuario = req.user && req.user.fk_id_cat_tipo_usuario;
      const entOpts: { fkIdsCatTipoUsuarioForPlanRel?: number[] } = {};
      if (tipoUsuario != null && Number.isFinite(Number(tipoUsuario))) {
        entOpts.fkIdsCatTipoUsuarioForPlanRel = tiposParaRelPlanSuscripcion(Number(tipoUsuario));
      }
      const ent = await getEntitlementsForInstitucion(fkIdInstitucion, entOpts);
      planSubmoduleIds = new Set(ent.idSubmodulos || []);
    }

    let candidateIds: number[];
    let fuente: string;
    let note: string | undefined;

    if (userSubmoduleIds.length === 0) {
      fuente = 'sin_rel_usuario_submodulo';
      note = 'Sin permisos en rel_usuario_submodulo: el menú queda vacío hasta asignar submódulos al usuario.';
      candidateIds = [];
    } else {
      fuente = 'rel_usuario_submodulo';
      if (planSubmoduleIds && planSubmoduleIds.size > 0) {
        candidateIds = userSubmoduleIds.filter((id) => planSubmoduleIds!.has(id));
        if (candidateIds.length === 0) {
          note = 'Los submódulos del usuario no están incluidos en el plan vigente de la institución.';
        }
      } else {
        candidateIds = userSubmoduleIds;
      }
    }

    if (candidateIds.length === 0) {
      res.status(200).json({ success: true, modules: [], fuente, note });
      return;
    }

    const subs = await prisma.submodulos.findMany({
      where: {
        id_submodulo: { in: candidateIds },
        activo: true
      },
      include: {
        modulos: true,
        rutas: true
      },
      orderBy: [
        { modulos: { orden: 'asc' } },
        { orden: 'asc' }
      ]
    });

    const filtered = subs.filter((s) => {
      if (!s.rutas || !s.rutas.activo) return false;
      const ruta = (s.rutas.ruta || '').trim();
      if (!prefix) return true;
      return ruta.startsWith(prefix);
    });

    const moduleMap = new Map<number, {
      id_modulo: number;
      titulo: string;
      orden: number | null;
      icono: string | null;
      items: Array<{ id_submodulo: number; nombre: string; path: string; icono: string | null; orden: number | null }>;
    }>();

    for (const s of filtered) {
      const m = s.modulos;
      if (!moduleMap.has(m.id_modulo)) {
        moduleMap.set(m.id_modulo, {
          id_modulo: m.id_modulo,
          titulo: m.titulo,
          orden: m.orden,
          icono: m.icono,
          items: []
        });
      }
      moduleMap.get(m.id_modulo)!.items.push({
        id_submodulo: s.id_submodulo,
        nombre: s.titulo,
        path: s.rutas!.ruta,
        icono: s.icono,
        orden: s.orden
      });
    }

    const modules = [...moduleMap.values()].sort((a, b) => (a.orden || 0) - (b.orden || 0));
    for (const mod of modules) {
      mod.items.sort((a, b) => (a.orden || 0) - (b.orden || 0));
    }

    res.status(200).json({ success: true, modules, fuente });
  } catch (err) {
    next(err);
  }
};
