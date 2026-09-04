/**
 * requestId middleware — Sprint 5.1.
 */
import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';

function shortId(): string {
  return randomUUID().replace(/-/g, '').slice(0, 22);
}

export default function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = (req.headers['x-request-id'] || '').toString().trim();
  const safe = incoming && /^[A-Za-z0-9._\-:]{4,80}$/.test(incoming) ? incoming : shortId();
  req.id = safe;
  res.setHeader('X-Request-Id', safe);
  next();
}
