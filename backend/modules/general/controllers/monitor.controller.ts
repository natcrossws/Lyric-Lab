import { Request, Response, NextFunction } from 'express';
import prisma from '../../../core/db/prisma';

export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const role = req.user?.role;
    const tipo = req.user?.fk_id_cat_tipo_usuario;
    const canPickInstitution = role === 'GLOBAL_ADMIN' || tipo === 6 || tipo === 1;

    let targetInstitutionId = req.institutionId;
    if (canPickInstitution && req.query.institutionId != null && String(req.query.institutionId).trim() !== '') {
      const q = parseInt(String(req.query.institutionId), 10);
      if (!Number.isNaN(q) && q > 0) {
        targetInstitutionId = q;
      }
    }

    const { startDate, endDate } = req.query as Record<string, string | undefined>;

    // Storage stats via Prisma raw query
    type StorageRow = { total_bytes: string | null };
    let storageResult: StorageRow[];

    if (startDate && endDate) {
      storageResult = await prisma.$queryRaw<StorageRow[]>`
        SELECT SUM(a.tamano_bytes)::text as total_bytes
        FROM archivos a
        WHERE a.fk_id_institucion = ${targetInstitutionId}
          AND a.f_reg BETWEEN ${new Date(startDate)} AND ${new Date(endDate)}
      `;
    } else {
      storageResult = await prisma.$queryRaw<StorageRow[]>`
        SELECT SUM(a.tamano_bytes)::text as total_bytes
        FROM archivos a
        WHERE a.fk_id_institucion = ${targetInstitutionId}
      `;
    }

    const storageStats = storageResult[0] ? parseInt(storageResult[0].total_bytes || '0', 10) || 0 : 0;
    let storageUsedGB = storageStats / (1024 * 1024 * 1024);
    if (storageStats > 0 && storageUsedGB < 0.01) storageUsedGB = 0.01;

    // Audio stats via raw query (transmisiones_audio table may not exist in base template)
    const aiHoursUsed = 0;
    const aiSeconds = 0;

    const quotas = { storageGB: 200, aiHours: 150, smartQuizDocs: 100 };

    res.json({
      success: true,
      data: {
        storage: {
          usedBytes: storageStats,
          usedGB: parseFloat(storageUsedGB.toFixed(2)),
          limitGB: quotas.storageGB,
          percentage: Math.min((storageUsedGB / quotas.storageGB) * 100, 100).toFixed(1)
        },
        ai: {
          usedSeconds: aiSeconds,
          usedHours: parseFloat(aiHoursUsed.toFixed(2)),
          limitHours: quotas.aiHours,
          percentage: Math.min((aiHoursUsed / quotas.aiHours) * 100, 100).toFixed(1)
        },
        smartQuiz: { usedDocs: 0, limitDocs: quotas.smartQuizDocs, percentage: 0 }
      }
    });
  } catch (error) {
    console.error('Error en monitorController.getStats:', error);
    res.status(500).json({ success: false, error: 'Error al obtener métricas del monitor' });
  }
};

export const getRiskyStudents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { calculateRisk } = await import('../../../shared/services/riskService');
    const riskyStudents = await calculateRisk(req.institutionId);
    res.json({ success: true, data: riskyStudents });
  } catch (error) {
    console.error('Error in getRiskyStudents:', error);
    res.status(500).json({ success: false, error: 'Error al calcular riesgo.' });
  }
};
