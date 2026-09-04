import { Router } from 'express';
import { protect } from '../shared/middlewares/authMiddleware';
import * as documentoController from '../modules/general/controllers/documento.controller';

const router: Router = Router();

router.get('/publico/aviso-privacidad', documentoController.getPublicPrivacyNotice);
router.get('/status', protect, documentoController.checkStatus);
router.post('/aceptar', protect, documentoController.acceptDocument);

export default router;
