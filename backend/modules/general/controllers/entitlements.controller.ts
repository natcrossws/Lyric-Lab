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

export const getMenuEntitlements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const fkIdInstitucion = req.institutionId;
    const jwtRole = req.user && req.user.role;

    if (!fkIdInstitucion) {
      res.status(200).json({
        success: true,
        paths: null,
        idSubmodulos: [],
        planId: null,
        note: 'sin_institucion'
      });
      return;
    }

    const tipoUsuario = req.user && req.user.fk_id_cat_tipo_usuario;
    const entOpts: { fkIdsCatTipoUsuarioForPlanRel?: number[] } = {};
    if (tipoUsuario != null && Number.isFinite(Number(tipoUsuario))) {
      entOpts.fkIdsCatTipoUsuarioForPlanRel = tiposParaRelPlanSuscripcion(Number(tipoUsuario));
    }

    const ent = await getEntitlementsForInstitucion(fkIdInstitucion, entOpts);

    if (!ent.idSubmodulos.length) {
      res.status(200).json({
        success: true,
        paths: [],
        idSubmodulos: [],
        planId: ent.fkIdCatPlanSuscripcion,
        fuente: ent.fuente
      });
      return;
    }

    const rows = await prisma.submodulos.findMany({
      where: { id_submodulo: { in: ent.idSubmodulos }, activo: true },
      select: {
        id_submodulo: true,
        fk_id_ruta: true,
        rutas: { select: { id_ruta: true, ruta: true } }
      }
    });

    const prefix = pathPrefixForJwtRole(jwtRole as string);
    const rowsForRole = prefix
      ? rows.filter((s) => {
        const ruta = s.rutas && s.rutas.ruta ? s.rutas.ruta.trim() : '';
        return ruta.startsWith(prefix);
      })
      : rows;

    const paths = [...new Set(
      rowsForRole
        .map((s) => (s.rutas && s.rutas.ruta ? s.rutas.ruta.trim() : null))
        .filter((r): r is string => r !== null)
    )];

    const idSubmodulosFiltrados = rowsForRole.map((s) => s.id_submodulo);

    res.status(200).json({
      success: true,
      paths,
      idSubmodulos: idSubmodulosFiltrados,
      planId: ent.fkIdCatPlanSuscripcion,
      fuente: ent.fuente,
      rolePrefix: prefix
    });
  } catch (err) {
    next(err);
  }
};
