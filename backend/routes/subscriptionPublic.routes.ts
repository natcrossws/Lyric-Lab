import { Router } from 'express';
import * as subscriptionPublic from '../modules/finanzas/controllers/subscriptionPublic.controller';

const router: Router = Router();

router.get('/plans', subscriptionPublic.getPlans);
router.post('/register', subscriptionPublic.registerInstitution);

export default router;
