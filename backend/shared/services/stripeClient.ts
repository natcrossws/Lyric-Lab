import Stripe from 'stripe';
import type { Request } from 'express';

const stripeKey = process.env.STRIPE_SECRET_KEY;
export const stripe: InstanceType<typeof Stripe> | null = stripeKey
  ? new Stripe(stripeKey)
  : null;

export const STRIPE_MXN_MIN_CENTS =
  parseInt(process.env.STRIPE_MXN_MIN_AMOUNT_CENTS || '', 10) || 1000;

export type StripeMode = 'live' | 'test' | 'unknown' | 'disabled';

export function getStripeMode(): StripeMode {
  const key = process.env.STRIPE_SECRET_KEY || '';
  if (key.startsWith('sk_live_')) return 'live';
  if (key.startsWith('sk_test_')) return 'test';
  return stripe ? 'unknown' : 'disabled';
}

export function isStripeConfigured(): boolean {
  return Boolean(stripe);
}

export function shouldApplyTestCheckoutOverride(): boolean {
  if (getStripeMode() !== 'test') return false;
  const cents = parseInt(process.env.STRIPE_TEST_CHECKOUT_AMOUNT_CENTS || '', 10);
  if (!Number.isFinite(cents) || cents <= 0) return false;
  const appMode = process.env.APP_MODE || 'development';
  if (appMode === 'production' && process.env.STRIPE_TEST_OVERRIDE_FORCE !== 'true') return false;
  return true;
}

export function getTestCheckoutAmountCents(): number {
  const raw = parseInt(process.env.STRIPE_TEST_CHECKOUT_AMOUNT_CENTS || '', 10) || 0;
  return Math.max(raw, STRIPE_MXN_MIN_CENTS);
}

export type CheckoutLineItem = {
  price_data?: {
    currency: string;
    product_data?: { name: string; description?: string };
    unit_amount?: number;
  };
  quantity?: number;
};

export function buildTestOverrideLineItems(): CheckoutLineItem[] {
  const cents = getTestCheckoutAmountCents();
  return [{
    price_data: {
      currency: 'mxn',
      product_data: {
        name: 'Pago mensual (prueba)',
        description: 'Cargo único de prueba. Configurable con STRIPE_TEST_CHECKOUT_AMOUNT_CENTS.'
      },
      unit_amount: cents
    },
    quantity: 1
  }];
}

export function getLineItemsTotalCents(lineItems: CheckoutLineItem[] | undefined): number {
  return (lineItems || []).reduce((sum, item) => {
    const unit = item?.price_data?.unit_amount ?? 0;
    const qty = item?.quantity ?? 1;
    return sum + unit * qty;
  }, 0);
}

export class HttpError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function assertMinimumMxnCheckout(lineItems: CheckoutLineItem[]): number {
  const total = getLineItemsTotalCents(lineItems);
  if (total < STRIPE_MXN_MIN_CENTS) {
    const minMxn = STRIPE_MXN_MIN_CENTS / 100;
    throw new HttpError(
      `El monto mínimo de cobro en Stripe es $${minMxn.toFixed(2)} MXN. Total: $${(total / 100).toFixed(2)} MXN.`,
      400
    );
  }
  return total;
}

export async function createOneTimeCheckoutSession({
  lineItems,
  metadata,
  successUrl,
  cancelUrl,
  customerEmail
}: {
  lineItems: CheckoutLineItem[];
  metadata?: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
}): Promise<any> {
  if (!stripe) throw new Error('Stripe Key Missing');
  assertMinimumMxnCheckout(lineItems);
  const params: any = {
    mode: 'payment',
    line_items: lineItems,
    metadata: { ...metadata, checkout_mode: 'payment' },
    success_url: successUrl,
    cancel_url: cancelUrl
  };
  if (customerEmail) params.customer_email = customerEmail;
  return stripe.checkout.sessions.create(params);
}

export function getClientBaseUrl(req?: Request): string {
  return (req?.headers?.origin as string | undefined) || process.env.CLIENT_URL || 'http://localhost:5173';
}
