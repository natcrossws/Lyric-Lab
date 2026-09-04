import { stripe } from './stripeClient';

const SUCCESS_STATUSES = new Set(['succeeded', 'complete', 'paid']);

export function isPagoExitoso(status: unknown): boolean {
  return SUCCESS_STATUSES.has(String(status || '').toLowerCase());
}

export function mapPagoRow(p: Record<string, any>, suscripcion: Record<string, any> | null = null) {
  const fechaReferencia = suscripcion?.fecha_inicio || p.fecha_pago || p.created_at;
  return {
    id_pago_suscripcion: p.id_pago_suscripcion,
    fk_id_suscripcion: p.fk_id_suscripcion,
    monto: p.monto != null ? Number(p.monto) : null,
    moneda: p.moneda,
    status: p.status,
    fecha_pago: fechaReferencia,
    metodo_pago: p.metodo_pago,
    intervalo: p.intervalo,
    stripe_session_id: p.stripe_session_id,
    created_at: p.created_at,
    tiene_factura: false,
    tiene_comprobante: Boolean(p.stripe_session_id)
  };
}

export async function resolveStripeDocumentUrls(pago: { stripe_session_id?: string | null }) {
  if (!stripe || !pago?.stripe_session_id) {
    return { receiptUrl: null, invoicePdfUrl: null };
  }
  try {
    const session = await stripe.checkout.sessions.retrieve(pago.stripe_session_id, {
      expand: ['payment_intent.latest_charge', 'invoice']
    });
    let receiptUrl: string | null = null;
    const pi = session.payment_intent;
    if (pi && typeof pi === 'object') {
      const charge = (pi as any).latest_charge;
      if (charge && typeof charge === 'object') receiptUrl = charge.receipt_url || null;
    }
    let invoicePdfUrl: string | null = null;
    const inv = session.invoice;
    if (inv && typeof inv === 'object') invoicePdfUrl = (inv as any).invoice_pdf || null;
    return { receiptUrl, invoicePdfUrl };
  } catch (e) {
    console.warn('resolveStripeDocumentUrls:', (e as Error).message);
    return { receiptUrl: null, invoicePdfUrl: null };
  }
}
