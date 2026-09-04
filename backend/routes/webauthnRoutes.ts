import { Router } from 'express';
import * as webauthnController from '../modules/auth/controllers/webauthn.controller';
import { protect } from '../shared/middlewares/authMiddleware';

const router: Router = Router();

// Rutas públicas (no requieren autenticación)
router.post('/auth/options', webauthnController.generateAuthenticationOptionsHandler);
router.post('/auth/verify', webauthnController.verifyAuthenticationHandler);

// Rutas protegidas (requieren autenticación)
router.post('/register/options', protect, webauthnController.generateRegistrationOptionsHandler);
router.post('/register/verify', protect, webauthnController.verifyRegistrationHandler);
router.get('/credentials', protect, webauthnController.getUserCredentials);
router.delete('/credentials/:credentialId', protect, webauthnController.deleteCredential);

export default router;
