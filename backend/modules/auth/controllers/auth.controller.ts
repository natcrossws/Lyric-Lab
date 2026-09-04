import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import prisma from '../../../core/db/prisma';
import { getDataUriFromArchivoRecord } from '../../../shared/utils/fileUtils';
import { hasPendingLegalDocs } from '../../general/controllers/documento.controller';
import { getSubscriptionAccessForUser } from '../../../shared/services/subscriptionAccessService';

const signToken = (id: number, role: string, name: string, institutionId: number): string => {
  return jwt.sign({ id, role, name, institutionId }, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  } as jwt.SignOptions);
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const user = await prisma.usuarios.findFirst({
      where: { email },
      orderBy: { activo: 'desc' },
      include: {
        instituciones: {
          select: { nombre: true, id_institucion: true, configuracion_json: true }
        },
        rel_usuario_institucion: {
          where: { activo: true },
          include: {
            instituciones: {
              select: { id_institucion: true, nombre: true, configuracion_json: true }
            }
          }
        },
        rel_usuarios_archivos: {
          where: { fk_id_cat_tipo_archivo: 1, activo: true },
          include: { archivos: true }
        }
      }
    });

    let isMatch = false;
    if (user && user.hash_pass) {
      try {
        isMatch = await bcrypt.compare(String(password), String(user.hash_pass));
      } catch (bcryptError) {
        console.error('Error comparing password:', bcryptError);
        isMatch = false;
      }
    }

    if (!user || !isMatch) {
      const error = Object.assign(new Error('Email o contraseña incorrectos'), { statusCode: 401 });
      throw error;
    }

    if (!user.activo) {
      const error = Object.assign(new Error('Esta cuenta ha sido desactivada. Contacte al administrador.'), { statusCode: 403 });
      throw error;
    }

    // Mapeo de roles
    let role = 'GUEST';
    switch (user.fk_id_cat_tipo_usuario) {
      case 1: role = 'ADMIN'; break;
      case 2: role = 'PROFESOR'; break;
      case 3: role = 'PADRE'; break;
      case 4: role = 'ALUMNO'; break;
      case 5: role = 'INSTITUTION_ADMIN'; break;
      case 6: role = 'GLOBAL_ADMIN'; break;
    }

    const pendingLegalDocs = await hasPendingLegalDocs(user.id_usuario, user.fk_id_cat_tipo_usuario);

    // Prepara lista de instituciones desde rel_usuario_institucion
    let myInstitutions: Array<{ id: number; nombre: string; logo: string | null; theme: unknown }> = [];

    if (user.rel_usuario_institucion && user.rel_usuario_institucion.length > 0) {
      myInstitutions = user.rel_usuario_institucion.map((rel) => {
        const inst = rel.instituciones;
        const cfg = inst.configuracion_json as Record<string, unknown> | null;
        return {
          id: inst.id_institucion,
          nombre: inst.nombre,
          logo: cfg?.logo as string | null ?? null,
          theme: cfg?.theme ?? null
        };
      });
    } else if (user.instituciones) {
      const cfg = user.instituciones.configuracion_json as Record<string, unknown> | null;
      myInstitutions.push({
        id: user.instituciones.id_institucion,
        nombre: user.instituciones.nombre,
        logo: cfg?.logo as string | null ?? null,
        theme: cfg?.theme ?? null
      });
    }

    const activeInstitutionId = myInstitutions.length > 0
      ? myInstitutions[0].id
      : (user.fk_id_institucion || 1);

    const subscriptionAccess = await getSubscriptionAccessForUser(role, activeInstitutionId);

    const token = signToken(user.id_usuario, role, user.nombre, activeInstitutionId);

    // Actualizar ultimo_login
    await prisma.usuarios.update({
      where: { id_usuario: user.id_usuario },
      data: { ultimo_login: new Date() }
    });

    // Foto de perfil
    const fotoRel = user.rel_usuarios_archivos && user.rel_usuarios_archivos.length > 0
      ? user.rel_usuarios_archivos[0]
      : null;
    const foto = fotoRel?.archivos || null;
    let foto_base64: string | null = null;
    if (foto && (foto.nombre_servidor || foto.ruta)) {
      foto_base64 = await getDataUriFromArchivoRecord({
        ruta: foto.ruta,
        nombre_servidor: foto.nombre_servidor,
        tipo_mime: foto.tipo_mime
      });
    }

    const instNombre = user.instituciones?.nombre
      || (myInstitutions[0]?.nombre)
      || null;

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id_usuario,
        nombre: user.nombre,
        email: user.email,
        role,
        id_rol: user.fk_id_cat_tipo_usuario,
        institucion: instNombre,
        fk_id_institucion: activeInstitutionId,
        myInstitutions,
        foto_base64: foto_base64 && foto_base64.startsWith('data:') ? foto_base64 : null,
        foto_url: foto_base64 && foto_base64.startsWith('data:') ? foto_base64 : null,
        campass: user.campass,
        fk_id_padre: null,
        hasTutores: false,
        pendingLegalDocs,
        requiresSubscriptionPayment: subscriptionAccess.requiresSubscriptionPayment,
        pagadoAlCorriente: subscriptionAccess.pagadoAlCorriente
      }
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.id_usuario;
    const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres' });
      return;
    }

    const user = await prisma.usuarios.findUnique({ where: { id_usuario: userId } });
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    const isPasswordChanged = user.campass === true;

    if (isPasswordChanged) {
      if (!currentPassword) {
        res.status(400).json({ message: 'Se requiere la contraseña actual' });
        return;
      }
      const isMatch = await bcrypt.compare(String(currentPassword), String(user.hash_pass));
      if (!isMatch) {
        res.status(401).json({ message: 'La contraseña actual es incorrecta' });
        return;
      }
    }

    const hash_pass = await bcrypt.hash(newPassword, 8);

    await prisma.usuarios.update({
      where: { id_usuario: userId },
      data: { hash_pass, campass: true }
    });

    res.json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    next(error);
  }
};
