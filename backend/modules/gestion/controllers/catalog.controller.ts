import { Request, Response, NextFunction } from 'express';
import prisma from '../../../core/db/prisma';

export const getCPInfo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { cp } = req.params;

    const results = await prisma.$queryRaw<Array<{
      cp: string;
      municipio: string;
      cve_mun: string;
      estado: string;
      cve_edo: string;
      abbrev: string;
    }>>`
      SELECT c.cp,
             m.municipio, m.cve_mun,
             e.estado, e.cve_edo, e.abbrev
      FROM cat_cp c
      LEFT JOIN cat_municipios m ON c.fk_id_cat_municipio = m.id_cat_municipio AND c.fk_id_cat_estado = m.fk_id_cat_estado
      LEFT JOIN cat_estados e ON c.fk_id_cat_estado = e.id_cat_estado
      WHERE c.cp = ${cp} OR c.cp = ${parseInt(cp, 10).toString()}
    `;

    if (!results || results.length === 0) {
      res.status(404).json({ message: 'Código postal no encontrado' });
      return;
    }

    const first = results[0];
    res.json({
      success: true,
      cp: first.cp,
      estado: first.estado,
      municipio: first.municipio,
      colonias: []
    });
  } catch {
    // En plantilla no requerimos la bd de códigos postales gigante.
    res.status(404).json({ message: 'Base de datos de CP no instalada en la plantilla.' });
  }
};

export const getPaises = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const paises = await prisma.cat_paises.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' }
    });
    res.json(paises);
  } catch (error) {
    next(error);
  }
};
