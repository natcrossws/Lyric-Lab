import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import { Request, Response, NextFunction } from 'express';
import prisma from '../../core/db/prisma';

interface JwtPayload {
  id: number;
  role: string;
  name: string;
  institutionId: number;
}

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      const error = Object.assign(new Error('No has iniciado sesión. Por favor loguéate para obtener acceso.'), { statusCode: 401 });
      throw error;
    }

    const verifyAsync = promisify<string, string, JwtPayload>(jwt.verify as (token: string, secret: string, callback: (err: Error | null, decoded: JwtPayload) => void) => void);
    const decoded = await verifyAsync(token, process.env.JWT_SECRET as string);

    const currentUser = await prisma.usuarios.findUnique({
      where: { id_usuario: decoded.id }
    });

    if (!currentUser) {
      const error = Object.assign(new Error('El usuario perteneciente a este token ya no existe.'), { statusCode: 401 });
      throw error;
    }

    req.user = {
      ...currentUser,
      role: decoded.role
    };
    next();
  } catch (error: unknown) {
    const err = error as Error & { statusCode?: number; name?: string };
    if (err.name === 'JsonWebTokenError') {
      err.message = 'Token inválido. Loguéate de nuevo.';
      (err as { statusCode?: number }).statusCode = 401;
    }
    if (err.name === 'TokenExpiredError') {
      err.message = 'Tu sesión ha expirado. Loguéate de nuevo.';
      (err as { statusCode?: number }).statusCode = 401;
    }
    next(err);
  }
};

export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = req.user.role;
    // Admin global: mismo alcance que ADMIN / INSTITUTION_ADMIN
    if (userRole === 'GLOBAL_ADMIN') {
      const adminScope = roles.includes('ADMIN') || roles.includes('INSTITUTION_ADMIN');
      if (adminScope) return next();
    }
    if (!roles.includes(userRole as string)) {
      const error = Object.assign(new Error('No tienes permisos para realizar esta acción.'), { statusCode: 403 });
      return next(error);
    }
    next();
  };
};
