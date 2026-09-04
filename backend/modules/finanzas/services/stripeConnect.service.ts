import Stripe from 'stripe';
import prisma from '../../../core/db/prisma';

const stripeKey = process.env.STRIPE_CONNECT_SECRET_KEY || process.env.STRIPE_RESERVAS_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
const stripe: InstanceType<typeof Stripe> | null = stripeKey ? new Stripe(stripeKey) : null;

class ServiceError extends Error {
  statusCode: number;
  code: string;
  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function ensureStripe(): InstanceType<typeof Stripe> {
  if (!stripe) {
    throw new ServiceError('Stripe no configurado. Defina STRIPE_SECRET_KEY.', 503, 'STRIPE_NO_CONFIGURADO');
  }
  return stripe;
}

function getClientBaseUrl(): string {
  return (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
}

function isConnectAccountAccessError(err: unknown): boolean {
  const msg = err && typeof err === 'object' && 'message' in err ? String((err as Error).message) : '';
  return /does not have access to account/i.test(msg) || /that account does not exist/i.test(msg);
}

function rethrowStripeConnectError(err: unknown): never {
  const msg = err && typeof err === 'object' && 'message' in err ? String((err as Error).message) : '';
  if (/signed up for Connect/i.test(msg)) {
    throw new ServiceError(
      'La cuenta Stripe de la plataforma aún no tiene activado Stripe Connect.',
      503,
      'STRIPE_CONNECT_PLATFORM_NOT_ENABLED'
    );
  }
  if (isConnectAccountAccessError(err)) {
    throw new ServiceError(
      'La cuenta conectada guardada no pertenece a la plataforma Stripe actual.',
      409,
      'STRIPE_CONNECT_ACCOUNT_STALE'
    );
  }
  throw err;
}

export async function loadInstitution(institutionId: number) {
  const inst = await prisma.instituciones.findUnique({
    where: { id_institucion: institutionId },
    select: { id_institucion: true, nombre: true, slug: true, stripe_account_id: true }
  });
  if (!inst) throw new ServiceError('Institución no encontrada.', 404, 'INSTITUCION_NO_ENCONTRADA');
  return inst;
}

export async function ensureConnectAccount(institutionId: number) {
  const stripeApi = ensureStripe();
  const inst = await loadInstitution(institutionId);
  if (inst.stripe_account_id) return inst;

  let account: any;
  try {
    account = await stripeApi.accounts.create({
      type: 'standard',
      country: (process.env.STRIPE_CONNECT_COUNTRY || 'MX').toUpperCase(),
      metadata: {
        keservicios_institucion_id: String(institutionId),
        keservicios_slug: inst.slug || ''
      }
    });
  } catch (err) {
    rethrowStripeConnectError(err);
  }

  return prisma.instituciones.update({
    where: { id_institucion: institutionId },
    data: { stripe_account_id: account.id },
    select: { id_institucion: true, nombre: true, slug: true, stripe_account_id: true }
  });
}

async function ensureValidConnectAccount(institutionId: number) {
  const stripeApi = ensureStripe();
  const inst = await loadInstitution(institutionId);
  if (!inst.stripe_account_id) return ensureConnectAccount(institutionId);
  try {
    await stripeApi.accounts.retrieve(inst.stripe_account_id);
    return inst;
  } catch (err) {
    if (!isConnectAccountAccessError(err)) rethrowStripeConnectError(err);
    await prisma.instituciones.update({
      where: { id_institucion: institutionId },
      data: { stripe_account_id: null }
    });
    return ensureConnectAccount(institutionId);
  }
}

export async function createOnboardingLink(institutionId: number) {
  const stripeApi = ensureStripe();
  const inst = await ensureValidConnectAccount(institutionId);
  const base = getClientBaseUrl();
  let link: any;
  try {
    link = await stripeApi.accountLinks.create({
      account: inst.stripe_account_id!,
      refresh_url: `${base}/admin/configuracion/pagos/reauth`,
      return_url: `${base}/admin/configuracion/pagos/exito`,
      type: 'account_onboarding'
    });
  } catch (err) {
    rethrowStripeConnectError(err);
  }
  return { url: link.url, stripeAccountId: inst.stripe_account_id };
}

export async function getConnectStatus(institutionId: number, { sync = true }: { sync?: boolean } = {}) {
  const inst = await loadInstitution(institutionId);
  if (!inst.stripe_account_id) {
    return { connected: false, stripeAccountId: null, chargesEnabled: false, detailsSubmitted: false, payoutsEnabled: false };
  }
  if (!sync) {
    return { connected: true, stripeAccountId: inst.stripe_account_id, chargesEnabled: null, detailsSubmitted: null, payoutsEnabled: null };
  }
  const stripeApi = ensureStripe();
  let account: any;
  try {
    account = await stripeApi.accounts.retrieve(inst.stripe_account_id);
  } catch (err) {
    if (isConnectAccountAccessError(err)) {
      await prisma.instituciones.update({
        where: { id_institucion: institutionId },
        data: { stripe_account_id: null }
      });
      return { connected: false, stripeAccountId: null, chargesEnabled: false, detailsSubmitted: false, payoutsEnabled: false };
    }
    rethrowStripeConnectError(err);
  }
  return {
    connected: !!(account.charges_enabled && account.details_submitted),
    stripeAccountId: inst.stripe_account_id,
    chargesEnabled: !!account.charges_enabled,
    detailsSubmitted: !!account.details_submitted,
    payoutsEnabled: !!account.payouts_enabled
  };
}

export function isEnabled(): boolean {
  return !!stripe;
}
