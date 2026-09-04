import type { Request, Response, NextFunction } from 'express';
import * as stripeConnect from '../services/stripeConnect.service';

function handleServiceError(err: any, res: Response, next: NextFunction) {
  if (err?.statusCode) {
    return res.status(err.statusCode).json({ success: false, message: err.message, code: err.code });
  }
  return next(err);
}

export async function onboarding(req: Request, res: Response, next: NextFunction) {
  try {
    const instId = req.institutionId;
    if (!instId) return res.status(400).json({ success: false, message: 'Institución no determinada' });
    const result = await stripeConnect.createOnboardingLink(instId);
    return res.json({ success: true, ...result });
  } catch (e) { handleServiceError(e, res, next); }
}

export async function status(req: Request, res: Response, next: NextFunction) {
  try {
    const instId = req.institutionId;
    if (!instId) return res.status(400).json({ success: false, message: 'Institución no determinada' });
    const result = await stripeConnect.getConnectStatus(instId, { sync: true });
    return res.json({ success: true, ...result });
  } catch (e) { handleServiceError(e, res, next); }
}

export async function sync(req: Request, res: Response, next: NextFunction) {
  try {
    const instId = req.institutionId;
    if (!instId) return res.status(400).json({ success: false, message: 'Institución no determinada' });
    const result = await stripeConnect.getConnectStatus(instId, { sync: true });
    return res.json({ success: true, ...result });
  } catch (e) { handleServiceError(e, res, next); }
}
