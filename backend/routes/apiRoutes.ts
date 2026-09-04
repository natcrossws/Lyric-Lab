import { Router } from 'express';
import { protect } from '../shared/middlewares/authMiddleware';
import { validateInstitution } from '../shared/middlewares/institutionMiddleware';

import generalRoutes from '../modules/general/routes/general.routes';
import gestionRoutes from '../modules/gestion/routes/gestion.routes';
import observabilityRoutes from '../shared/observability/observability.routes';

const router: Router = Router();

router.use(protect);
router.use(validateInstitution);

router.use(generalRoutes);
router.use(gestionRoutes);
router.use(observabilityRoutes);

export default router;
