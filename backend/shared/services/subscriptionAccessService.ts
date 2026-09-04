import prisma from '../../core/db/prisma';
import { evaluarEstadoCobro, type EstadoCobro } from './subscriptionBillingService';

const ROLES_REQUIRE_PAYMENT = new Set(['ADMIN', 'INSTITUTION_ADMIN']);

export function isSubscriptionGateEnabled(): boolean {
  const env = process.env.SUBSCRIPTION_GATE_ENABLED;
  if (env === 'true') return true;
  if (env === 'false') return false;
  const nodeEnv = String(process.env.NODE_ENV || '').toLowerCase();
  if (nodeEnv === 'production') return true;
  const appMode = String(process.env.APP_MODE || '').toLowerCase();
  return appMode === 'production' || appMode === 'prod';
}

export async function findSuscripcionVigente(instId: number) {
  const vigenteCat = await prisma.cat_estatus_suscripcion.findFirst({
    where: { codigo: 'vigente' },
    select: { id_cat_estatus_suscripcion: true }
  });
  if (!vigenteCat) return null;
  return prisma.suscripciones.findFirst({
    where: {
      fk_id_institucion: instId,
      fk_id_cat_estatus_suscripcion: vigenteCat.id_cat_estatus_suscripcion
    },
    orderBy: { created_at: 'desc' }
  });
}

export async function findSuscripcionPendientePago(instId: number) {
  const pendCat = await prisma.cat_estatus_suscripcion.findFirst({
    where: { codigo: 'pendiente_pago' },
    select: { id_cat_estatus_suscripcion: true }
  });
  if (!pendCat) return null;
  return prisma.suscripciones.findFirst({
    where: {
      fk_id_institucion: instId,
      fk_id_cat_estatus_suscripcion: pendCat.id_cat_estatus_suscripcion
    },
    orderBy: { created_at: 'desc' }
  });
}

export async function resolveBillingContext(instId: number) {
  const inst = await prisma.instituciones.findUnique({
    where: { id_institucion: instId },
    select: {
      id_institucion: true,
      nombre: true,
      fk_id_cat_plan_suscripcion: true,
      cat_planes_suscripcion: {
        select: {
          id_cat_plan_suscripcion: true,
          nombre: true,
          precio_mensual: true,
          limite_horas_ia: true,
          limite_storage_gb: true,
          limite_users: true
        }
      }
    }
  });

  const vigente = await findSuscripcionVigente(instId);
  const pendiente = await findSuscripcionPendientePago(instId);
  const cobroVigente = evaluarEstadoCobro(vigente);
  const cobroPendiente = evaluarEstadoCobro(pendiente);
  const tienePlan = Boolean(inst?.fk_id_cat_plan_suscripcion);

  if (pendiente) {
    return {
      institucion: inst,
      vigente,
      pendiente,
      cobroVigente,
      cobroPendiente,
      tienePlan,
      pagadoAlCorriente: false,
      requierePrimerPago: true,
      puedePagar: true,
      suscripcionReferencia: pendiente
    };
  }

  const accesoPorVigente = vigente && (cobroVigente.pagadoAlCorriente || cobroVigente.enPeriodoGracia);
  const requierePrimerPago = tienePlan && !accesoPorVigente;

  return {
    institucion: inst,
    vigente,
    pendiente,
    cobroVigente,
    cobroPendiente,
    tienePlan,
    pagadoAlCorriente: !requierePrimerPago,
    requierePrimerPago,
    puedePagar: requierePrimerPago,
    suscripcionReferencia: vigente || pendiente
  };
}

export function roleRequiresSubscriptionPayment(role: string | undefined | null): boolean {
  return ROLES_REQUIRE_PAYMENT.has(String(role || '').toUpperCase());
}

export async function getSubscriptionAccessForUser(
  role: string | undefined | null,
  institutionId: number | null | undefined
) {
  if (!isSubscriptionGateEnabled()) {
    return { requiresSubscriptionPayment: false, pagadoAlCorriente: true, puedePagar: false };
  }
  if (!roleRequiresSubscriptionPayment(role) || !institutionId) {
    return { requiresSubscriptionPayment: false, pagadoAlCorriente: true, puedePagar: false };
  }
  const ctx = await resolveBillingContext(institutionId);
  return {
    requiresSubscriptionPayment: ctx.requierePrimerPago,
    pagadoAlCorriente: ctx.pagadoAlCorriente,
    puedePagar: ctx.puedePagar,
    tienePlan: ctx.tienePlan
  };
}
