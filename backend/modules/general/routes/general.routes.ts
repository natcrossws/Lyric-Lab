import { Router } from 'express';
import { restrictTo } from '../../../shared/middlewares/authMiddleware';
import * as dashboardController from '../controllers/dashboard.controller';
import * as entitlementsController from '../controllers/entitlements.controller';
import * as menuController from '../controllers/menu.controller';
import * as institucionController from '../../gestion/controllers/institucion.controller';
import * as monitorController from '../controllers/monitor.controller';
import * as planSubmodulosCatalogController from '../controllers/planSubmodulosCatalog.controller';
import * as legalDocsController from '../controllers/legalDocs.controller';
import * as stripeConnectController from '../../finanzas/controllers/stripeConnect.controller';
import * as tenantLegalController from '../../gestion/controllers/tenantLegal.controller';
import { uploadMemory } from '../../../shared/middlewares/uploadConfig';

const router: Router = Router();

// Generic upload route for FilePond
router.post(
  '/upload',
  restrictTo('ADMIN', 'GLOBAL_ADMIN', 'INSTITUTION_ADMIN'),
  uploadMemory.single('file'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).send('No file uploaded');
    }
    const base64Str = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    res.status(200).send(base64Str);
  }
);

router.get('/dashboard/admin', restrictTo('ADMIN', 'INSTITUTION_ADMIN'), dashboardController.getAdminStats);

// Rutas de Instituciones (Global Admin / Admin)
router.get(
  '/general/instituciones',
  restrictTo('GLOBAL_ADMIN', 'ADMIN'),
  institucionController.listInstitucionesGlobalAdmin
);

router.post(
  '/general/instituciones',
  restrictTo('GLOBAL_ADMIN', 'ADMIN'),
  institucionController.createInstitucionGlobalAdmin
);

router.put(
  '/general/instituciones/:institutionId/datos',
  restrictTo('GLOBAL_ADMIN', 'ADMIN'),
  institucionController.putInstitucionDatosGlobal
);

router.get(
  '/general/entitlements',
  restrictTo('ADMIN', 'GLOBAL_ADMIN', 'INSTITUTION_ADMIN', 'PROFESOR', 'PADRE', 'ALUMNO'),
  entitlementsController.getMenuEntitlements
);

router.get(
  '/general/menu',
  restrictTo('ADMIN', 'GLOBAL_ADMIN', 'INSTITUTION_ADMIN', 'PROFESOR', 'PADRE', 'ALUMNO'),
  menuController.getSidebarMenu
);

// Ruta Pública de Tema
router.get('/general/tema', institucionController.getPublicTheme);

// Ruta de actualización de apariencia
router.put(
  '/general/institucion/apariencia',
  restrictTo('ADMIN', 'GLOBAL_ADMIN', 'INSTITUTION_ADMIN'),
  institucionController.updateApariencia
);

router.get('/monitor/stats', restrictTo('ADMIN', 'GLOBAL_ADMIN', 'INSTITUTION_ADMIN'), monitorController.getStats);
router.get('/monitor/risky-students', restrictTo('ADMIN', 'GLOBAL_ADMIN', 'INSTITUTION_ADMIN'), monitorController.getRiskyStudents);

// Planes de suscripción (admin global)
router.get('/general/cat-planes', restrictTo('GLOBAL_ADMIN', 'ADMIN'), planSubmodulosCatalogController.listCatPlanes);
router.post('/general/cat-planes', restrictTo('GLOBAL_ADMIN', 'ADMIN'), planSubmodulosCatalogController.postCatPlan);
router.get(
  '/general/cat-planes/:planId/submodulos-editor',
  restrictTo('GLOBAL_ADMIN', 'ADMIN'),
  planSubmodulosCatalogController.getPlanSubmodulosEditor
);
router.put(
  '/general/cat-planes/:planId/submodulos',
  restrictTo('GLOBAL_ADMIN', 'ADMIN'),
  planSubmodulosCatalogController.putPlanSubmodulos
);
router.put('/general/cat-planes/:planId', restrictTo('GLOBAL_ADMIN', 'ADMIN'), planSubmodulosCatalogController.putCatPlan);

// Instituciones admin (alias + plan/pagos)
router.get(
  '/general/instituciones-admin',
  restrictTo('GLOBAL_ADMIN', 'ADMIN'),
  institucionController.listInstitucionesGlobalAdmin
);
router.post(
  '/general/instituciones-admin',
  restrictTo('GLOBAL_ADMIN', 'ADMIN'),
  institucionController.createInstitucionGlobalAdmin
);
router.get(
  '/general/instituciones-admin/:institutionId/plan-resumen',
  restrictTo('GLOBAL_ADMIN', 'ADMIN'),
  institucionController.getInstitucionPlanResumenGlobal
);
router.put(
  '/general/instituciones-admin/:institutionId/plan-catalogo',
  restrictTo('GLOBAL_ADMIN', 'ADMIN'),
  institucionController.putInstitucionPlanCatalogoGlobal
);
router.put(
  '/general/instituciones-admin/:institutionId/datos',
  restrictTo('GLOBAL_ADMIN', 'ADMIN'),
  institucionController.putInstitucionDatosGlobal
);
router.get(
  '/general/instituciones-admin/:institutionId/pagos-suscripcion',
  restrictTo('GLOBAL_ADMIN', 'ADMIN'),
  institucionController.getInstitucionPagosSuscripcionGlobal
);

// Documentos legales plataforma
router.get('/general/legal-docs', restrictTo('GLOBAL_ADMIN', 'ADMIN'), legalDocsController.getLegalDocsStatus);
router.post(
  '/general/legal-docs/:tipo/upload',
  restrictTo('GLOBAL_ADMIN', 'ADMIN'),
  uploadMemory.single('pdf'),
  legalDocsController.uploadLegalDoc
);

// Legal por tenant (admin)
router.get(
  '/institucion/legal/:codigo',
  restrictTo('ADMIN', 'INSTITUTION_ADMIN', 'GLOBAL_ADMIN'),
  tenantLegalController.getAdminLegal
);
router.put(
  '/institucion/legal/:codigo',
  restrictTo('ADMIN', 'INSTITUTION_ADMIN', 'GLOBAL_ADMIN'),
  tenantLegalController.putAdminLegal
);
router.post(
  '/institucion/legal/:codigo/publish',
  restrictTo('ADMIN', 'INSTITUTION_ADMIN', 'GLOBAL_ADMIN'),
  tenantLegalController.publishAdminLegal
);

// Stripe Connect
router.get(
  '/finanzas/stripe/onboarding',
  restrictTo('ADMIN', 'INSTITUTION_ADMIN', 'GLOBAL_ADMIN'),
  stripeConnectController.onboarding
);
router.get(
  '/finanzas/stripe/status',
  restrictTo('ADMIN', 'INSTITUTION_ADMIN', 'GLOBAL_ADMIN'),
  stripeConnectController.status
);
router.post(
  '/finanzas/stripe/sync',
  restrictTo('ADMIN', 'INSTITUTION_ADMIN', 'GLOBAL_ADMIN'),
  stripeConnectController.sync
);

export default router;
