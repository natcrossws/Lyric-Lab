/**
 * Health endpoints — Sprint 5.1.
 *
 *   GET /health         → liveness
 *   GET /health/ready   → readiness (BD check via Prisma)
 */
import { Router, Request, Response } from 'express';
import prisma from '../../core/db/prisma';

const router: Router = Router();
const STARTED_AT = Date.now();

router.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'ok',
    uptimeMs: Date.now() - STARTED_AT,
    timestamp: new Date().toISOString()
  });
});

router.get('/ready', async (_req: Request, res: Response) => {
  const out: {
    success: boolean;
    status: string;
    checks: Record<string, string>;
  } = {
    success: true,
    status: 'ready',
    checks: {}
  };
  try {
    await prisma.$queryRaw`SELECT 1`;
    out.checks.db = 'ok';
  } catch (err: unknown) {
    out.success = false;
    out.status = 'degraded';
    out.checks.db = `error: ${(err as Error).message}`;
  }
  return res.status(out.success ? 200 : 503).json(out);
});

export default router;
