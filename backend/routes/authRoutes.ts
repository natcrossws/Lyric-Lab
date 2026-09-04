import { Router } from 'express';
import { protect } from '../shared/middlewares/authMiddleware';
import * as authController from '../modules/auth/controllers/auth.controller';
import * as verificationController from '../modules/auth/controllers/verification.controller';
import * as userAppController from '../modules/auth/controllers/userApp.controller';

const router: Router = Router();

router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/change-password', protect, authController.changePassword);

// Verification & Recovery (Public)
router.post('/verification/generate-code', verificationController.generateCode);
router.post('/verification/verify-code', verificationController.verifyCode);
router.post('/verification/reset-password', verificationController.resetPassword);

// User profile edits
router.get('/profile', protect, userAppController.getProfile);
router.put('/profile', protect, userAppController.updateProfile);
// Note: photo upload is usually multipart, but added to complete routes
// router.post('/profile/photo', protect, upload.single('foto'), userAppController.uploadPhoto);

export default router;
