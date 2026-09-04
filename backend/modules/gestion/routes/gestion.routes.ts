import { Router } from 'express';
import { uploadMemory } from '../../../shared/middlewares/uploadConfig';
import parseNestedFormData from '../../../shared/middlewares/parseNestedFormData';
import { restrictTo } from '../../../shared/middlewares/authMiddleware';

import * as catalogController from '../controllers/catalog.controller';
import * as usuarioController from '../controllers/usuario.controller';
import * as usuarioPermisosController from '../controllers/usuarioPermisos.controller';
import * as institucionController from '../controllers/institucion.controller';
import * as institutionPaymentsController from '../../finanzas/controllers/institutionPayments.controller';

const router: Router = Router();

router.get('/catalogos/cp/:cp', restrictTo('ADMIN', 'INSTITUTION_ADMIN'), catalogController.getCPInfo);
router.get('/catalog/cp/:cp', restrictTo('ADMIN', 'INSTITUTION_ADMIN'), catalogController.getCPInfo);
router.get('/catalogos/paises', restrictTo('ADMIN', 'INSTITUTION_ADMIN'), catalogController.getPaises);
router.get('/catalog/paises', restrictTo('ADMIN', 'INSTITUTION_ADMIN'), catalogController.getPaises);

router.get('/usuarios', restrictTo('ADMIN', 'INSTITUTION_ADMIN'), usuarioController.getAll);
router.get('/usuarios/:id', restrictTo('ADMIN', 'INSTITUTION_ADMIN'), usuarioController.getById);

router.get(
  '/usuarios/:id/permisos-submodulos',
  restrictTo('ADMIN', 'INSTITUTION_ADMIN', 'GLOBAL_ADMIN'),
  usuarioPermisosController.getPermisosSubmodulosCatalog
);
router.put(
  '/usuarios/:id/permisos-submodulos',
  restrictTo('ADMIN', 'INSTITUTION_ADMIN', 'GLOBAL_ADMIN'),
  usuarioPermisosController.updatePermisosSubmodulos
);

router.post(
  '/usuarios',
  restrictTo('ADMIN', 'INSTITUTION_ADMIN'),
  uploadMemory.single('foto'),
  parseNestedFormData,
  usuarioController.create
);

router.put(
  '/usuarios/:id',
  restrictTo('ADMIN', 'INSTITUTION_ADMIN'),
  uploadMemory.single('foto'),
  parseNestedFormData,
  usuarioController.update
);

router.delete('/usuarios/:id', restrictTo('ADMIN', 'INSTITUTION_ADMIN'), usuarioController.delete);

router.post(
  '/usuarios/:id/resend-password',
  restrictTo('ADMIN', 'INSTITUTION_ADMIN'),
  usuarioController.resendPassword
);

router.get(
  '/institucion/mi-plan',
  restrictTo('ADMIN', 'INSTITUTION_ADMIN'),
  institucionController.getMyPlanSummary
);

router.get(
  '/institucion/pagos-suscripcion/onboarding',
  restrictTo('ADMIN', 'INSTITUTION_ADMIN', 'GLOBAL_ADMIN'),
  institutionPaymentsController.getMySuscripcionOnboarding
);
router.get(
  '/institucion/pagos-suscripcion/estado',
  restrictTo('ADMIN', 'INSTITUTION_ADMIN', 'GLOBAL_ADMIN'),
  institutionPaymentsController.getMySuscripcionEstado
);
router.get(
  '/institucion/pagos-suscripcion',
  restrictTo('ADMIN', 'INSTITUTION_ADMIN', 'GLOBAL_ADMIN'),
  institutionPaymentsController.listMyPagosSuscripcion
);
router.post(
  '/institucion/pagos-suscripcion/checkout',
  restrictTo('ADMIN', 'INSTITUTION_ADMIN', 'GLOBAL_ADMIN'),
  institutionPaymentsController.createCheckout
);
router.post(
  '/institucion/pagos-suscripcion/confirmar-sesion',
  restrictTo('ADMIN', 'INSTITUTION_ADMIN', 'GLOBAL_ADMIN'),
  institutionPaymentsController.confirmarSesion
);
router.get(
  '/institucion/pagos-suscripcion/:pagoId/documentos/:tipo',
  restrictTo('ADMIN', 'INSTITUTION_ADMIN', 'GLOBAL_ADMIN'),
  institutionPaymentsController.getDocumentoPago
);

export default router;
