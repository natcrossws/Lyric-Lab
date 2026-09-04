/**
 * Logger estructurado (pino) — Sprint 5.1.
 *
 * Salida JSON por defecto (apta para agregadores tipo Datadog / Loki / ELK).
 * En desarrollo formatea con colores via pino-pretty si está instalado.
 *
 * Variables:
 *   - LOG_LEVEL       (default 'info')
 *   - LOG_PRETTY      ('true' fuerza pretty; sin esto usa pretty sólo si NODE_ENV !== 'production')
 *
 * Uso:
 *   import logger from '../shared/observability/logger';
 *   logger.info({ tenantId: 1 }, 'site-config cargado');
 *   logger.error({ err }, 'fallo al enviar email');
 */

import pino from 'pino';

const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'test' ? 'silent' : 'info');
const isProd = process.env.NODE_ENV === 'production';
const wantPretty = process.env.LOG_PRETTY === 'true' || (!isProd && process.env.LOG_PRETTY !== 'false');

let transport: pino.TransportSingleOptions | undefined;
if (wantPretty) {
  try {
    require.resolve('pino-pretty');
    transport = {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'SYS:HH:MM:ss.l', ignore: 'pid,hostname' }
    };
  } catch { /* pino-pretty no instalado, usar JSON */ }
}

const logger = pino({
  level,
  base: { service: 'keplayas-backend' },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.passwordConfirmation',
      '*.password',
      '*.token'
    ],
    censor: '[REDACTED]'
  },
  transport
});

export default logger;
