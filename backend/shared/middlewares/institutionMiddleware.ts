import { Request, Response, NextFunction } from 'express';
import prisma from '../../core/db/prisma';

export const validateInstitution = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let headerInstId: string | null = (req.headers['x-institution-id'] as string) || null;

    // Validar que sea un número válido
    if (headerInstId && (headerInstId === 'undefined' || headerInstId === 'null' || isNaN(parseInt(headerInstId)))) {
      headerInstId = null;
    }

    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'Usuario no autenticado para validar institución.' });
      return;
    }

    // Admin global (tipo 1 legacy) y Admin global de plataforma (tipo 6)
    if (user.fk_id_cat_tipo_usuario === 1 || user.fk_id_cat_tipo_usuario === 6) {
      if (headerInstId) {
        req.institutionId = parseInt(headerInstId);
      } else {
        req.institutionId = user.fk_id_institucion || 1;
      }
      return next();
    }

    // Usuarios regulares
    if (!headerInstId) {
      req.institutionId = user.fk_id_institucion;
      return next();
    }

    console.log(`[InstitutionMiddleware] Verifying access for User ${user.id_usuario} to Inst ${headerInstId}`);

    const hasAccess = await prisma.rel_usuario_institucion.findFirst({
      where: {
        fk_id_usuario: user.id_usuario,
        fk_id_institucion: parseInt(headerInstId)
      }
    });

    const isPrimary = (user.fk_id_institucion === parseInt(headerInstId));

    console.log(`[InstitutionMiddleware] Access Check: hasAccess=${!!hasAccess}, isPrimary=${isPrimary}`);

    if (hasAccess || isPrimary) {
      req.institutionId = parseInt(headerInstId);
      return next();
    } else {
      console.warn(`[Security] User ${user.email} (ID: ${user.id_usuario}) tried to access Institution ${headerInstId} without permission.`);
      res.status(403).json({ message: 'No tiene acceso a esta institución.' });
      return;
    }
  } catch (error) {
    console.error('Institution Middleware Error:', error);
    res.status(500).json({ message: 'Error validando contexto institucional.' });
  }
};
