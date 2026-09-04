import { Request, Response, NextFunction } from 'express';
import prisma from '../../../core/db/prisma';

export const getAdminStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const institutionId = req.institutionId;

    const usersCount = await prisma.usuarios.count({
      where: {
        activo: true,
        ...(institutionId ? { fk_id_institucion: institutionId } : {})
      }
    });

    res.json({
      usersCount,
      studentsCount: 0,
      professorsCount: 0,
      classesCount: 0,
      monthlyIncome: 0,
      pendingPaymentsCount: 0,
      classesBySubject: [],
      message: 'Template — panel base'
    });
  } catch (error) {
    next(error);
  }
};
