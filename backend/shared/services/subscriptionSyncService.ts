import { Prisma } from '@prisma/client';
import prisma from '../../core/db/prisma';
import { computeProximoCobro, startOfDay } from './subscriptionBillingService';

type Tx = Prisma.TransactionClient;

async function resolveCatalogIds(tx: Tx, intervalStripe: string) {
  const [vigente, vencida, pendiente, completado, stripeProv, mensual, anual, planBase] = await Promise.all([
    tx.cat_estatus_suscripcion.findFirst({ where: { codigo: 'vigente' } }),
    tx.cat_estatus_suscripcion.findFirst({ where: { codigo: 'vencida' } }),
    tx.cat_estatus_suscripcion.findFirst({ where: { codigo: 'pendiente_pago' } }),
    tx.cat_estatus_pago_suscripcion.findFirst({ where: { codigo: 'completado' } }),
    tx.cat_proveedor_pago.findFirst({ where: { codigo: 'stripe' } }),
    tx.cat_intervalo_facturacion.findFirst({ where: { codigo: 'mensual' } }),
    tx.cat_intervalo_facturacion.findFirst({ where: { codigo: 'anual' } }),
    tx.cat_tipo_linea_suscripcion.findFirst({ where: { codigo: 'plan_base' } })
  ]);
  let intervaloId = mensual?.id_cat_intervalo_facturacion ?? null;
  if (intervalStripe === 'year' && anual) intervaloId = anual.id_cat_intervalo_facturacion;
  return { vigente, vencida, pendiente, completado, stripeProv, intervaloId, planBase };
}

export async function isPagoYaSincronizado(sessionId: string | null | undefined): Promise<boolean> {
  if (!sessionId) return false;
  const row = await prisma.pagos_suscripciones.findFirst({
    where: { stripe_session_id: sessionId, fk_id_suscripcion: { not: null } },
    select: { id_pago_suscripcion: true }
  });
  return Boolean(row);
}

export async function syncSuscripcionAfterPayment({
  fk_id_institucion,
  fk_id_cat_plan_suscripcion,
  session,
  intervalHint
}: {
  fk_id_institucion: number;
  fk_id_cat_plan_suscripcion: number | string;
  session: any;
  intervalHint?: string;
}) {
  const planId = parseInt(String(fk_id_cat_plan_suscripcion), 10);
  if (!planId || Number.isNaN(planId)) return null;

  if (session?.id) {
    const linked = await prisma.pagos_suscripciones.findFirst({
      where: { stripe_session_id: session.id, fk_id_suscripcion: { not: null } }
    });
    if (linked?.fk_id_suscripcion) {
      return prisma.suscripciones.findUnique({ where: { id_suscripcion: linked.fk_id_suscripcion } });
    }
  }

  const meta = (session?.metadata || {}) as Record<string, string>;
  const intervalStripe = intervalHint || meta.interval || 'month';

  return prisma.$transaction(async (tx) => {
    const ids = await resolveCatalogIds(tx, intervalStripe === 'year' ? 'year' : 'month');
    if (!ids.vigente || !ids.planBase) {
      throw new Error('Catálogos de suscripción incompletos (ejecutar seed).');
    }

    const fechaPago = startOfDay(new Date());
    const fechaProximoCobro = computeProximoCobro(fechaPago, intervalStripe);
    const amount = session?.amount_total != null ? Number(session.amount_total) / 100 : null;
    const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id || null;

    const vigenteActual = await tx.suscripciones.findFirst({
      where: {
        fk_id_institucion,
        fk_id_cat_estatus_suscripcion: ids.vigente.id_cat_estatus_suscripcion
      }
    });

    let pendienteActual = null;
    if (ids.pendiente) {
      pendienteActual = await tx.suscripciones.findFirst({
        where: {
          fk_id_institucion,
          fk_id_cat_estatus_suscripcion: ids.pendiente.id_cat_estatus_suscripcion,
          fk_id_cat_plan_suscripcion: planId
        },
        orderBy: { created_at: 'desc' }
      });
    }

    let susId: number;
    const mismoPlan = vigenteActual && Number(vigenteActual.fk_id_cat_plan_suscripcion) === planId;

    if (pendienteActual && !mismoPlan) {
      if (ids.vencida && vigenteActual) {
        await tx.suscripciones.update({
          where: { id_suscripcion: vigenteActual.id_suscripcion },
          data: { fk_id_cat_estatus_suscripcion: ids.vencida.id_cat_estatus_suscripcion, fecha_fin: fechaPago }
        });
      }
      const updated = await tx.suscripciones.update({
        where: { id_suscripcion: pendienteActual.id_suscripcion },
        data: {
          fk_id_cat_estatus_suscripcion: ids.vigente.id_cat_estatus_suscripcion,
          fk_id_cat_intervalo_facturacion: ids.intervaloId,
          fk_id_cat_proveedor_pago: ids.stripeProv?.id_cat_proveedor_pago ?? null,
          fecha_inicio: fechaPago,
          fecha_proximo_cobro: fechaProximoCobro,
          precio_total_mensual_snapshot: amount ?? pendienteActual.precio_total_mensual_snapshot,
          stripe_customer_id: customerId || pendienteActual.stripe_customer_id
        }
      });
      susId = updated.id_suscripcion;
    } else if (mismoPlan && vigenteActual) {
      const updated = await tx.suscripciones.update({
        where: { id_suscripcion: vigenteActual.id_suscripcion },
        data: {
          fecha_inicio: fechaPago,
          fecha_proximo_cobro: fechaProximoCobro,
          precio_total_mensual_snapshot: amount,
          stripe_customer_id: customerId || vigenteActual.stripe_customer_id
        }
      });
      susId = updated.id_suscripcion;
    } else {
      if (ids.vencida && vigenteActual) {
        await tx.suscripciones.update({
          where: { id_suscripcion: vigenteActual.id_suscripcion },
          data: { fk_id_cat_estatus_suscripcion: ids.vencida.id_cat_estatus_suscripcion, fecha_fin: fechaPago }
        });
      }
      const created = await tx.suscripciones.create({
        data: {
          fk_id_institucion,
          fk_id_cat_plan_suscripcion: planId,
          fk_id_cat_estatus_suscripcion: ids.vigente.id_cat_estatus_suscripcion,
          fk_id_cat_intervalo_facturacion: ids.intervaloId,
          fk_id_cat_proveedor_pago: ids.stripeProv?.id_cat_proveedor_pago ?? null,
          fecha_inicio: fechaPago,
          fecha_proximo_cobro: fechaProximoCobro,
          stripe_customer_id: customerId,
          precio_total_mensual_snapshot: amount
        }
      });
      susId = created.id_suscripcion;
      await tx.suscripciones_detalle.create({
        data: {
          fk_id_suscripcion: susId,
          fk_id_cat_tipo_linea_suscripcion: ids.planBase.id_cat_tipo_linea_suscripcion,
          precio_linea_mensual: amount
        }
      });
    }

    await tx.instituciones.update({
      where: { id_institucion: fk_id_institucion },
      data: { fk_id_cat_plan_suscripcion: planId, activo: true }
    });

    if (session?.id) {
      const existing = await tx.pagos_suscripciones.findFirst({
        where: { stripe_session_id: session.id }
      });
      const patch = {
        fk_id_institucion,
        fk_id_suscripcion: susId,
        monto: amount ?? 0,
        moneda: session.currency || 'mxn',
        status: session.payment_status === 'paid' ? 'succeeded' : session.status || 'pending',
        metodo_pago: 'stripe',
        stripe_session_id: session.id,
        intervalo: intervalStripe === 'year' ? 'year' : 'month',
        fecha_pago: fechaPago,
        fk_id_cat_estatus_pago_suscripcion: ids.completado?.id_cat_estatus_pago_suscripcion ?? null
      };
      if (existing) {
        await tx.pagos_suscripciones.update({
          where: { id_pago_suscripcion: existing.id_pago_suscripcion },
          data: patch
        });
      } else {
        await tx.pagos_suscripciones.create({ data: patch });
      }
    }

    return tx.suscripciones.findUnique({ where: { id_suscripcion: susId } });
  });
}
