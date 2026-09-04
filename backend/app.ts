import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import * as dotenv from 'dotenv';
import errorHandler from './shared/middlewares/errorHandler';
import requestId from './shared/observability/requestId';
import { httpObservability } from './shared/observability/httpLogger';
import healthRoutes from './shared/observability/health.routes';

dotenv.config({ path: path.join(__dirname, '../.env') });

const app: express.Application = express();

const APP_MODE = process.env.APP_MODE || 'development';
const isProduction = ['production', 'prod'].includes(String(APP_MODE).toLowerCase());

function normalizeOrigin(origin: string): string {
  return String(origin || '').trim().replace(/\/$/, '');
}

const corsOrigin = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
  if (!origin) return callback(null, true);

  const normalized = normalizeOrigin(origin);

  const extraOrigins = (process.env.EXTRA_CLIENT_URLS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const allowList = [
    'https://localhost:5173',
    'http://localhost:5173',
    'https://localhost:3001',
    'http://localhost:3001',
    'https://localhost:3000',
    'http://localhost:3000',
    'https://127.0.0.1:3001',
    'http://127.0.0.1:3001',
    process.env.CLIENT_URL || 'http://localhost:5173',
    ...extraOrigins,
  ].map(normalizeOrigin);

  if (allowList.includes(normalized)) return callback(null, true);

  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalized)) {
    return callback(null, true);
  }

  if (!isProduction) {
    return callback(null, true);
  }

  return callback(new Error(`CORS: origin '${origin}' no permitido`));
};

app.use(helmet());
app.use(cors({ origin: corsOrigin, credentials: true }));

app.use(requestId);
app.use(httpObservability);
app.use('/health', healthRoutes);

import * as subscriptionPublic from './modules/finanzas/controllers/subscriptionPublic.controller';
import * as legalDocsController from './modules/general/controllers/legalDocs.controller';
import * as tenantLegalController from './modules/gestion/controllers/tenantLegal.controller';
import documentoRoutes from './routes/documentoRoutes';
import subscriptionPublicRoutes from './routes/subscriptionPublic.routes';

// Stripe webhook needs raw body (before express.json)
app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  subscriptionPublic.handleWebhook
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Template API',
    status: 'running',
    timestamp: new Date()
  });
});

import authRoutes from './routes/authRoutes';
import apiRoutes from './routes/apiRoutes';
import * as institucionController from './modules/gestion/controllers/institucion.controller';
import { resolvePublicTenant } from './shared/middlewares/publicTenantMiddleware';

let webauthnRoutes;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  webauthnRoutes = require('./routes/webauthnRoutes').default;
  app.use('/api/webauthn', webauthnRoutes);
  console.log('✅ WebAuthn/Passkeys habilitado');
} catch {
  console.warn('⚠️  WebAuthn/Passkeys no disponible. Ejecuta: npm install @simplewebauthn/server');
  console.warn('   El servidor continuará funcionando sin soporte para Passkeys.');
}

// Rutas Públicas (antes del middleware de auth en apiRoutes)
app.get('/api/general/tema', institucionController.getPublicTheme);
app.get('/api/general/legal-docs/:tipo/pdf', legalDocsController.serveDocumentPdf);
app.use('/api/public', resolvePublicTenant);
app.get('/api/public/legal', tenantLegalController.listPublicLegal);
app.get('/api/public/legal/:codigo', tenantLegalController.getPublicLegalByCodigo);
app.use('/api/documentos', documentoRoutes);
app.use('/api/subscriptions', subscriptionPublicRoutes);

app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

app.use(errorHandler);

export default app;
