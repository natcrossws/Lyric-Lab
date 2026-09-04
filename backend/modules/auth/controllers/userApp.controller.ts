import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import prisma from '../../../core/db/prisma';

// Helper: get user with photo
const getUserWithPhoto = async (id: number) => {
  const user = await prisma.usuarios.findUnique({
    where: { id_usuario: id },
    select: {
      id_usuario: true,
      nombre: true,
      email: true,
      telefono: true,
      curp: true,
      fk_id_cat_tipo_usuario: true,
      activo: true,
      ultimo_login: true,
      twofa_enabled: true,
      campass: true,
      fk_id_institucion: true,
      cupo_registro_menores_max: true,
      f_reg: true,
      f_mod: true,
      rel_usuarios_archivos: {
        where: { fk_id_cat_tipo_archivo: 1, activo: true },
        include: { archivos: true },
        take: 1
      }
    }
  });

  if (!user) return null;

  const fotoRel = user.rel_usuarios_archivos[0] || null;
  const foto = fotoRel?.archivos || null;
  const foto_url = foto?.nombre_servidor ? `/api/archivos/${foto.nombre_servidor}` : null;

  const { rel_usuarios_archivos, ...userData } = user;
  return { ...userData, profile_image_url: foto_url };
};

export const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.id_usuario;
    const userProfile = await getUserWithPhoto(userId);

    if (!userProfile) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    res.json(userProfile);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.id_usuario;
    const { telefono, email } = req.body as { telefono?: string; email?: string };

    const user = await prisma.usuarios.findUnique({ where: { id_usuario: userId } });
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    await prisma.usuarios.update({
      where: { id_usuario: userId },
      data: {
        ...(telefono ? { telefono } : {}),
        ...(email ? { email } : {})
      }
    });

    const userProfile = await getUserWithPhoto(userId);
    res.json(userProfile);
  } catch (error) {
    next(error);
  }
};

export const uploadPhoto = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No se subió ningún archivo' });
      return;
    }

    const userId = req.user.id_usuario;
    const usuario = await prisma.usuarios.findUnique({
      where: { id_usuario: userId },
      select: { id_usuario: true, fk_id_institucion: true }
    });

    if (!usuario) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    const tipoArchivoId = 1;
    const { persistMulterFileToR2 } = await import('../../../shared/services/multerR2Persist');

    const meta = await persistMulterFileToR2(
      req.file,
      `perfil/inst_${usuario.fk_id_institucion || 'na'}/u_${userId}`
    );

    // Desactivar fotos anteriores
    await prisma.rel_usuarios_archivos.updateMany({
      where: { fk_id_usuario: userId, fk_id_cat_tipo_archivo: tipoArchivoId },
      data: { activo: false }
    });

    // Crear archivo
    const archivo = await prisma.archivos.create({
      data: {
        fk_id_usuario_subio: userId,
        fk_id_cat_tipo_archivo: tipoArchivoId,
        fk_id_institucion: usuario.fk_id_institucion,
        nombre_original: meta.originalname,
        nombre_servidor: meta.nombre_servidor,
        tipo_mime: meta.mimetype,
        tamano_bytes: meta.size,
        ruta: meta.ruta,
        f_reg: new Date()
      }
    });

    // Crear relación
    await prisma.rel_usuarios_archivos.create({
      data: {
        fk_id_usuario: userId,
        fk_id_archivo: archivo.id_archivo,
        fk_id_cat_tipo_archivo: tipoArchivoId,
        activo: true,
        f_reg: new Date()
      }
    });

    res.json({
      success: true,
      url: `/api/archivos/${meta.nombre_servidor}`,
      message: 'Foto de perfil actualizada'
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.id_usuario;
    const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };

    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: 'Faltan datos' });
      return;
    }

    const user = await prisma.usuarios.findUnique({ where: { id_usuario: userId } });
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    const isMatch = await bcrypt.compare(String(currentPassword), String(user.hash_pass));
    if (!isMatch) {
      res.status(401).json({ message: 'La contraseña actual es incorrecta' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hash_pass = await bcrypt.hash(newPassword, salt);

    await prisma.usuarios.update({
      where: { id_usuario: userId },
      data: { hash_pass }
    });

    res.json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    next(error);
  }
};
