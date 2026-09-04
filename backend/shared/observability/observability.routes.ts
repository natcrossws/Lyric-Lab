import { Router } from 'express';
import * as auth from '../middlewares/authMiddleware';
import * as ctrl from './observabilityAdmin.controller';

const router: Router = Router();
const ADMIN = ['ADMIN', 'INSTITUTION_ADMIN', 'GLOBAL_ADMIN'] as const;

router.get('/admin/observability/metrics', auth.restrictTo(...ADMIN), ctrl.metricsSnapshot);
router.post('/admin/observability/metrics/reset', auth.restrictTo(...ADMIN), ctrl.resetMetrics);
router.get('/admin/observability/errors', auth.restrictTo(...ADMIN), ctrl.listErrors);
router.get('/admin/observability/errors/:id', auth.restrictTo(...ADMIN), ctrl.detailError);
router.get('/admin/observability/audit', auth.restrictTo(...ADMIN), ctrl.listAudit);

export default router;
