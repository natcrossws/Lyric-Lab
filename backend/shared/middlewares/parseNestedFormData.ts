/**
 * Middleware para parsear campos anidados de FormData
 * Convierte campos como "direccion[estado]" en req.body.direccion.estado
 */
import { Request, Response, NextFunction } from 'express';

const parseNestedFormData = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === 'object') {
    const parsed: Record<string, Record<string, unknown> | unknown> = {};

    for (const key in req.body) {
      if (key.includes('[') && key.includes(']')) {
        const match = key.match(/^([^\[]+)\[([^\]]+)\]$/);
        if (match) {
          const [, parent, child] = match;
          if (!parsed[parent]) {
            parsed[parent] = {};
          }
          (parsed[parent] as Record<string, unknown>)[child] = req.body[key];
        } else {
          parsed[key] = req.body[key];
        }
      } else {
        parsed[key] = req.body[key];
      }
    }

    for (const key in parsed) {
      if (typeof parsed[key] === 'object' && !Array.isArray(parsed[key])) {
        req.body[key] = { ...req.body[key], ...(parsed[key] as Record<string, unknown>) };
      } else {
        req.body[key] = parsed[key];
      }
    }
  }

  next();
};

export default parseNestedFormData;
