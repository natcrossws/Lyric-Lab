import prisma from '../../core/db/prisma';
import type { CheckoutLineItem } from './stripeClient';

function normalizeIdList(arr: unknown): number[] {
  if (!Array.isArray(arr)) return [];
  const out: number[] = [];
  const seen = new Set<number>();
  for (const x of arr) {
    const n = parseInt(String(x), 10);
    if (!Number.isInteger(n) || n <= 0 || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

function planBaseStripeCents(precioMensual: unknown, intervalIsYear: boolean): number {
  const m = Number(precioMensual);
  if (!Number.isFinite(m) || m < 0) return 0;
  if (intervalIsYear) return Math.round(m * 12 * 0.8 * 100);
  return Math.round(m * 100);
}

function addonStripeCentsFromMonthly(monthlyMxn: unknown, intervalIsYear: boolean): number | null {
  const m = Number(monthlyMxn);
  if (!Number.isFinite(m) || m <= 0) return null;
  if (intervalIsYear) return Math.round(m * 12 * 0.8 * 100);
  return Math.round(m * 100);
}

export async function buildStripeSubscriptionCheckout({
  planId,
  interval,
  addonModuloIds = [],
  addonSubmoduloIds = [],
  addonCuotaPaqueteIds = []
}: {
  planId: number;
  interval?: string;
  addonModuloIds?: unknown;
  addonSubmoduloIds?: unknown;
  addonCuotaPaqueteIds?: unknown;
}) {
  const plan = await prisma.cat_planes_suscripcion.findUnique({
    where: { id_cat_plan_suscripcion: planId }
  });
  if (!plan) throw new Error('Plan no encontrado');

  const isYear = interval === 'year';
  const stripeInterval = isYear ? 'year' : 'month';
  const modIds = normalizeIdList(addonModuloIds);
  const subIds = normalizeIdList(addonSubmoduloIds);
  const cuotaIds = normalizeIdList(addonCuotaPaqueteIds);

  const baseCents = planBaseStripeCents(plan.precio_mensual, isYear);
  const lineItems: CheckoutLineItem[] = [{
    price_data: {
      currency: 'mxn',
      product_data: {
        name: `Plan ${plan.nombre}`,
        description: `${plan.limite_horas_ia || 0} h IA · ${plan.limite_storage_gb || 0} GB`
      },
      unit_amount: baseCents
    },
    quantity: 1
  }];

  const snapshot: { v: number; int: string; pb: number; lines: Array<{ k: string; id: number; x: number }>; cq: Array<{ i: number; x: number }> } = {
    v: 1,
    int: isYear ? 'y' : 'm',
    pb: Math.round((baseCents / 100) * 100) / 100,
    lines: [],
    cq: []
  };

  if (modIds.length > 0) {
    const mods = await prisma.modulos.findMany({
      where: { id_modulo: { in: modIds }, activo: true }
    });
    for (const m of mods) {
      const cents = addonStripeCentsFromMonthly(m.precio_addon_mensual, isYear);
      if (cents == null) continue;
      lineItems.push({
        price_data: {
          currency: 'mxn',
          product_data: { name: `Módulo: ${m.titulo}` },
          unit_amount: cents
        },
        quantity: 1
      });
      snapshot.lines.push({ k: 'm', id: m.id_modulo, x: cents / 100 });
    }
  }

  if (subIds.length > 0) {
    const subs = await prisma.submodulos.findMany({
      where: { id_submodulo: { in: subIds }, activo: true }
    });
    for (const s of subs) {
      const cents = addonStripeCentsFromMonthly(s.precio_addon_mensual, isYear);
      if (cents == null) continue;
      lineItems.push({
        price_data: {
          currency: 'mxn',
          product_data: { name: `Submódulo: ${s.titulo}` },
          unit_amount: cents
        },
        quantity: 1
      });
      snapshot.lines.push({ k: 's', id: s.id_submodulo, x: cents / 100 });
    }
  }

  if (cuotaIds.length > 0) {
    const pkgs = await prisma.cat_paquetes_cuota.findMany({
      where: { id_cat_paquete_cuota: { in: cuotaIds }, activo: true }
    });
    for (const p of pkgs) {
      const cents = addonStripeCentsFromMonthly(p.precio_mensual_mxn, isYear);
      if (cents == null) continue;
      lineItems.push({
        price_data: {
          currency: 'mxn',
          product_data: { name: `Cuota: ${p.nombre}` },
          unit_amount: cents
        },
        quantity: 1
      });
      snapshot.cq.push({ i: p.id_cat_paquete_cuota, x: cents / 100 });
    }
  }

  // One-time payment mode: strip recurring (handled by createOneTimeCheckoutSession)
  return {
    lineItems,
    pricingSnapshot: JSON.stringify(snapshot),
    stripeInterval
  };
}

/** Alias for payment-mode checkout used by institution payments. */
export async function buildStripePaymentCheckout(args: Parameters<typeof buildStripeSubscriptionCheckout>[0]) {
  return buildStripeSubscriptionCheckout(args);
}
