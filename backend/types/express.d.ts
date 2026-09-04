import { Request } from 'express';

declare global {
  // Augment Express Request with our custom properties
  namespace Express {
    interface Request {
      id: string;
      user: {
        id_usuario: number;
        nombre: string;
        email: string | null;
        fk_id_cat_tipo_usuario: number;
        activo: boolean | null;
        ultimo_login: Date | null;
        twofa_enabled: boolean | null;
        campass: boolean | null;
        fk_id_institucion: number | null;
        hash_pass: string | null;
        role?: string;
        [key: string]: unknown;
      };
      institutionId: number | null;
    }
  }

  // Allow PrismaClient singleton on globalThis in development
  // eslint-disable-next-line no-var
  var prisma: import('@prisma/client').PrismaClient | undefined;
}

export {};
