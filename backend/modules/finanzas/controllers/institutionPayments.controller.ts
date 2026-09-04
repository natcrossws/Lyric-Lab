import type { Request, Response, NextFunction } from 'express';
import prisma from '../../../core/db/prisma';
import { buildStripePaymentCheckout } from '../../../shared/services/stripeCheckoutPlanService';
import { syncSuscripcionAfterPayment, isPagoYaSincronizado } from '../../../shared/services/subscriptionSyncService';
import { mapSuscripcionConCobro } from '../../../shared/services/subscriptionBillingService';
import { resolveBillingContext } from '../../../shared/services/subscriptionAccessService';
import { getEntitlementsForInstitucion } from '../../../shared/services/entitlementsService';
import { seedRelUsuarioSubmodulosFromPlan } from '../../../shared/services/planUsuarioSeedService';
import {
  stripe,
  isStripeConfigured,
  getStripeMode,
  shouldApplyTestCheckoutOverride,
  buildTestOverrideLineItems,
  getClientBaseUrl,
  createOneTimeCheckoutSession
} from '../../../shared/services/stripeClient';
import { mapPagoRow, resolveStripeDocumentUrls } from '../../../shared/services/pagoSuscripcionStripeService';

const SUSCRIPCION_INCLUDE = {
  cat_estatus_suscripcion: { select: { codigo: true, nombre: true } },
  cat_planes_suscripcion: { select: { id_cat_plan_suscripcion: true, nombre: true, precio_mensual: true } },
  cat_intervalo_facturacion: { select: { codigo: true, nombre: true } },
  pagos_suscripciones: true
} as const;

export async function listMyPagosSuscripcion(req: Request, res: Response, next: NextFunction) {
  try {
    const instId = req.institutionId;
    if (!instId) return res.status(400).json({ success: false, message: 'Institución no determinada' });
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '50'), 10) || 50, 1), 200);
    const suscripciones = await prisma.suscripciones.findMany({
      where: { fk_id_institucion: instId },
      include: SUSCRIPCION_INCLUDE,
      orderBy: { fecha_inicio: 'desc' },
      take: limit
    });
    const data = suscripciones.map((s) => {
      const pagos = (s.pagos_suscripciones || [])
        .sort((a, b) => new Date(b.fecha_pago).getTime() - new Date(a.fecha_pago).getTime())
        .map((p) => mapPagoRow(p, s));
      return mapSuscripcionConCobro(s, pagos);
    });
    return res.status(200).json({
      success: true,
      suscripciones: data,
      stripeMode: getStripeMode(),
      testOverrideActivo: shouldApplyTestCheckoutOverride()
    });
  } catch (e) { next(e); }
}

export async function getMySuscripcionOnboarding(req: Request, res: Response, next: NextFunction) {
  try {
    const instId = req.institutionId;
    if (!instId) return res.status(400).json({ success: false, message: 'Institución no determinada' });
    const ctx = await resolveBillingContext(instId);
    let modulosIncluidos: Array<{ id_modulo: number; titulo: string; submodulos: string[] }> = [];
    try {
      const ent = await getEntitlementsForInstitucion(instId, {});
      if (ent.idSubmodulos.length > 0) {
        const subs = await prisma.submodulos.findMany({
          where: { id_submodulo: { in: ent.idSubmodulos }, activo: true },
          include: { modulos: { select: { id_modulo: true, titulo: true } } },
          orderBy: { titulo: 'asc' }
        });
        const byMod = new Map<number, { id_modulo: number; titulo: string; submodulos: string[] }>();
        for (const s of subs) {
          const mid = s.modulos.id_modulo;
          if (!byMod.has(mid)) byMod.set(mid, { id_modulo: mid, titulo: s.modulos.titulo, submodulos: [] });
          byMod.get(mid)!.submodulos.push(s.titulo);
        }
        modulosIncluidos = [...byMod.values()];
      }
    } catch { /* ignore */ }

    const plan = ctx.institucion?.cat_planes_suscripcion;
    return res.status(200).json({
      success: true,
      data: {
        institucion: ctx.institucion
          ? { id_institucion: ctx.institucion.id_institucion, nombre: ctx.institucion.nombre }
          : null,
        plan: plan
          ? {
              id_cat_plan_suscripcion: plan.id_cat_plan_suscripcion,
              nombre: plan.nombre,
              precio_mensual: plan.precio_mensual != null ? Number(plan.precio_mensual) : null,
              limite_horas_ia: plan.limite_horas_ia,
              limite_storage_gb: plan.limite_storage_gb,
              limite_users: plan.limite_users
            }
          : null,
        requierePago: ctx.requierePrimerPago,
        puedePagar: ctx.puedePagar,
        pagadoAlCorriente: ctx.pagadoAlCorriente,
        modulosIncluidos,
        stripeConfigured: isStripeConfigured(),
        stripeMode: getStripeMode()
      }
    });
  } catch (e) { next(e); }
}

export async function getMySuscripcionEstado(req: Request, res: Response, next: NextFunction) {
  try {
    const instId = req.institutionId;
    if (!instId) return res.status(400).json({ success: false, message: 'Institución no determinada' });
    const ctx = await resolveBillingContext(instId);
    return res.json({
      success: true,
      data: {
        requierePago: ctx.requierePrimerPago,
        pagadoAlCorriente: ctx.pagadoAlCorriente,
        puedePagar: ctx.puedePagar,
        tienePlan: ctx.tienePlan
      }
    });
  } catch (e) { next(e); }
}

export async function createCheckout(req: Request, res: Response, next: NextFunction) {
  try {
    const instId = req.institutionId;
    if (!instId) return res.status(400).json({ success: false, message: 'Institución no determinada' });
    const ctx = await resolveBillingContext(instId);
    if (!ctx.puedePagar) {
      return res.status(400).json({ success: false, message: 'No hay pago pendiente en este momento' });
    }
    const planId = ctx.institucion?.fk_id_cat_plan_suscripcion;
    if (!planId) return res.status(400).json({ success: false, message: 'La institución no tiene plan asignado' });

    const interval = req.body?.interval === 'year' ? 'year' : 'month';
    const { lineItems, pricingSnapshot } = await buildStripePaymentCheckout({
      planId,
      interval,
      addonModuloIds: req.body?.addonModuloIds,
      addonSubmoduloIds: req.body?.addonSubmoduloIds,
      addonCuotaPaqueteIds: req.body?.addonCuotaPaqueteIds
    });

    const items = shouldApplyTestCheckoutOverride() ? buildTestOverrideLineItems() : lineItems;
    const base = getClientBaseUrl(req);
    const email = (req as any).user?.email;

    if (!isStripeConfigured()) {
      // Dev mock: sync a fake session
      const mockSession = {
        id: `mock_${Date.now()}`,
        amount_total: Math.round(Number(ctx.institucion?.cat_planes_suscripcion?.precio_mensual || 0) * 100),
        currency: 'mxn',
        payment_status: 'paid',
        status: 'complete',
        metadata: { institution_id: String(instId), plan_id: String(planId), interval },
        customer: null,
        invoice: null,
        payment_intent: null,
        subscription: null
      } as any;
      await syncSuscripcionAfterPayment({
        fk_id_institucion: instId,
        fk_id_cat_plan_suscripcion: planId,
        session: mockSession,
        intervalHint: interval
      });
      return res.json({ success: true, url: `${base}/activar-suscripcion?mock=true`, mock: true });
    }

    const session = await createOneTimeCheckoutSession({
      lineItems: items,
      metadata: {
        institution_id: String(instId),
        plan_id: String(planId),
        interval,
        pricing_snapshot: pricingSnapshot
      },
      successUrl: `${base}/activar-suscripcion?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${base}/activar-suscripcion?canceled=true`,
      customerEmail: email || undefined
    });
    return res.json({ success: true, url: session.url });
  } catch (e) { next(e); }
}

export async function confirmarSesion(req: Request, res: Response, next: NextFunction) {
  try {
    const instId = req.institutionId;
    const sessionId = String(req.body?.session_id || '').trim();
    if (!instId || !sessionId) {
      return res.status(400).json({ success: false, message: 'session_id e institución requeridos' });
    }
    if (await isPagoYaSincronizado(sessionId)) {
      return res.json({ success: true, alreadySynced: true });
    }
    if (!stripe) return res.status(503).json({ success: false, message: 'Stripe no configurado' });
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const planId = session.metadata?.plan_id || String(req.body?.plan_id || '');
    if (!planId) return res.status(400).json({ success: false, message: 'plan_id no encontrado en sesión' });
    await syncSuscripcionAfterPayment({
      fk_id_institucion: instId,
      fk_id_cat_plan_suscripcion: planId,
      session,
      intervalHint: session.metadata?.interval
    });
    const admins = await prisma.usuarios.findMany({
      where: { fk_id_institucion: instId, fk_id_cat_tipo_usuario: { in: [1, 5] }, activo: true },
      select: { id_usuario: true, fk_id_cat_tipo_usuario: true }
    });
    for (const admin of admins) {
      await seedRelUsuarioSubmodulosFromPlan({
        userId: admin.id_usuario,
        fk_id_institucion: instId,
        fk_id_cat_tipo_usuario: admin.fk_id_cat_tipo_usuario
      });
    }
    return res.json({ success: true });
  } catch (e) { next(e); }
}

export async function getDocumentoPago(req: Request, res: Response, next: NextFunction) {
  try {
    const instId = req.institutionId;
    const pagoId = parseInt(req.params.pagoId, 10);
    const tipo = req.params.tipo; // factura | comprobante
    if (!instId || Number.isNaN(pagoId)) {
      return res.status(400).json({ success: false, message: 'Parámetros inválidos' });
    }
    const pago = await prisma.pagos_suscripciones.findFirst({
      where: { id_pago_suscripcion: pagoId, fk_id_institucion: instId }
    });
    if (!pago) return res.status(404).json({ success: false, message: 'Pago no encontrado' });
    const urls = await resolveStripeDocumentUrls(pago);
    const url = tipo === 'factura' ? urls.invoicePdfUrl : urls.receiptUrl;
    if (!url) return res.status(404).json({ success: false, message: 'Documento no disponible' });
    return res.redirect(url);
  } catch (e) { next(e); }
}
