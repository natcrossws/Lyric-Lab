import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import prisma from '../../../core/db/prisma';
import { getDataUriFromArchivoRecord } from '../../../shared/utils/fileUtils';
import { seedRelUsuarioSubmodulosFromPlan } from '../../../shared/services/planUsuarioSeedService';

type RoleMap = Record<string, number>;
const ROLE_MAP: RoleMap = {
  ADMIN: 1, PROFESOR: 2, PADRE: 3, ALUMNO: 4, INSTITUTION_ADMIN: 5, GLOBAL_ADMIN: 6
};

function getRoleName(tipo: number): string {
  const names: Record<number, string> = {
    1: 'Admin', 2: 'Profesor', 3: 'Padre', 5: 'Administrador institucional', 6: 'Administrador global'
  };
  return names[tipo] || 'Usuario';
}

export const getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { rol } = req.query as Record<string, string | undefined>;
    const rolNormalized = rol !== undefined && rol !== null && String(rol).trim() !== ''
      ? String(rol).trim()
      : null;

    const institutionId = req.institutionId ?? req.user.fk_id_institucion;
    const where: Record<string, unknown> = {
      activo: true,
      ...(institutionId ? { fk_id_institucion: institutionId } : {})
    };

    if (rolNormalized) {
      const key = String(rolNormalized).toUpperCase();
      if (ROLE_MAP[key] !== undefined) {
        where.fk_id_cat_tipo_usuario = ROLE_MAP[key];
      }
    }

    // Restricción para admin institucional (5): solo ve admins de su instit.
    if (!rolNormalized) {
      const viewerTipo = Number(req.user?.fk_id_cat_tipo_usuario);
      if (viewerTipo === 5) {
        where.fk_id_cat_tipo_usuario = 5;
      } else if (viewerTipo === 6 && !where.fk_id_cat_tipo_usuario) {
        where.fk_id_cat_tipo_usuario = { in: [5, 6] };
      }
    }

    const usuarios = await prisma.usuarios.findMany({
      where,
      select: {
        id_usuario: true, nombre: true, email: true, telefono: true, curp: true,
        fk_id_cat_tipo_usuario: true, activo: true, ultimo_login: true,
        twofa_enabled: true, campass: true, fk_id_institucion: true,
        cupo_registro_menores_max: true, f_reg: true, f_mod: true,
        direcciones: {
          include: {
            cat_estados: true,
            cat_municipios: true
          },
          take: 1
        },
        rel_usuarios_archivos: {
          where: { activo: true },
          include: { archivos: true }
        }
      }
    });

    const usuariosMapped = await Promise.all(
      usuarios.map(async (u) => {
        const fotoRel = u.rel_usuarios_archivos.find(r => r.fk_id_cat_tipo_archivo === 1);
        const foto = fotoRel?.archivos || null;
        let foto_base64 = null;
        if (foto && (foto.nombre_servidor || foto.ruta)) {
          const b64 = await getDataUriFromArchivoRecord({ ruta: foto.ruta, nombre_servidor: foto.nombre_servidor, tipo_mime: foto.tipo_mime });
          if (b64 && b64.startsWith('data:')) foto_base64 = b64;
        }
        const tieneReglamento = u.rel_usuarios_archivos.some(r => r.fk_id_cat_tipo_archivo === 11);
        return {
          ...u,
          rel_usuarios_archivos: undefined,
          foto_base64,
          tiene_reglamento: tieneReglamento
        };
      })
    );

    res.json(usuariosMapped);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      res.status(400).json({ message: 'ID inválido' });
      return;
    }

    const usuario = await prisma.usuarios.findUnique({
      where: { id_usuario: id },
      select: {
        id_usuario: true, nombre: true, email: true, telefono: true, curp: true,
        fk_id_cat_tipo_usuario: true, activo: true, ultimo_login: true,
        twofa_enabled: true, campass: true, fk_id_institucion: true,
        cupo_registro_menores_max: true, f_reg: true, f_mod: true,
        direcciones: {
          include: { cat_estados: true, cat_municipios: true },
          take: 1
        },
        rel_usuarios_archivos: {
          where: { activo: true },
          include: { archivos: true }
        }
      }
    });

    if (!usuario) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    const actorTipo = Number(req.user.fk_id_cat_tipo_usuario);
    const esSuperInst = actorTipo === 1 || actorTipo === 6;
    if (!esSuperInst && usuario.fk_id_institucion !== req.user.fk_id_institucion) {
      res.status(403).json({ message: 'Sin permiso para ver este usuario.' });
      return;
    }

    const fotoRel = usuario.rel_usuarios_archivos.find(r => r.fk_id_cat_tipo_archivo === 1);
    const foto = fotoRel?.archivos || null;
    let foto_base64 = null;
    if (foto && (foto.nombre_servidor || foto.ruta)) {
      const b64 = await getDataUriFromArchivoRecord({ ruta: foto.ruta, nombre_servidor: foto.nombre_servidor, tipo_mime: foto.tipo_mime });
      if (b64 && b64.startsWith('data:')) foto_base64 = b64;
    }

    res.json({ ...usuario, rel_usuarios_archivos: undefined, foto_base64 });
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { nombre, email, telefono, curp, fk_id_cat_tipo_usuario, password } = req.body as Record<string, string | undefined>;

    const normalizeStringField = (value: unknown): string | null => {
      if (value === null || value === undefined) return null;
      if (Array.isArray(value)) return (value[0] as string) || null;
      if (typeof value === 'object') return null;
      if (typeof value === 'string') return value.trim() || null;
      return String(value) || null;
    };

    const finalTelefono = normalizeStringField(telefono);
    const finalCurp = normalizeStringField(curp);

    if (!nombre || !email || !fk_id_cat_tipo_usuario) {
      res.status(400).json({ message: 'Faltan campos requeridos: nombre, email y tipo de usuario son obligatorios' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ message: 'El formato del email no es válido' });
      return;
    }

    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!nameRegex.test(nombre)) {
      res.status(400).json({ message: 'El nombre solo debe contener letras y espacios.' });
      return;
    }

    if (finalCurp && (finalCurp.length < 18 || finalCurp.length > 20)) {
      res.status(400).json({ message: 'El CURP debe tener entre 18 y 20 caracteres.' });
      return;
    }

    const tipoCrear = parseInt(fk_id_cat_tipo_usuario, 10);
    if (tipoCrear === 4) {
      res.status(400).json({ message: 'El alta de alumnos no está habilitada en esta versión base.' });
      return;
    }

    const existing = await prisma.usuarios.findFirst({ where: { email, activo: true } });
    if (existing) {
      res.status(400).json({ message: 'El email ya está registrado.' });
      return;
    }

    const { generateSecurePassword } = await import('../../../shared/utils/passwordGenerator');
    const finalPassword = password && String(password).trim() !== '' ? String(password).trim() : generateSecurePassword(8);
    const hash_pass = await bcrypt.hash(finalPassword, 8);

    const fk_id_institucion = req.user.fk_id_cat_tipo_usuario === 1
      ? parseInt(req.body.fk_id_institucion || '1', 10)
      : (req.user.fk_id_institucion ?? 1);

    const newUser = await prisma.usuarios.create({
      data: {
        nombre,
        email,
        telefono: finalTelefono,
        curp: finalCurp,
        fk_id_cat_tipo_usuario: tipoCrear,
        hash_pass,
        activo: true,
        campass: false,
        fk_id_institucion,
        f_reg: new Date(),
        f_mod: new Date()
      }
    });

    // Crear dirección si viene
    if ([1, 2, 3, 5, 6].includes(tipoCrear) && req.body.direccion) {
      await crearDireccionUsuario(newUser.id_usuario, req.body.direccion);
    }

    // Foto de perfil
    if (req.file) {
      const { persistMulterFileToR2 } = await import('../../../shared/services/multerR2Persist');
      const meta = await persistMulterFileToR2(
        req.file,
        `perfil/inst_${newUser.fk_id_institucion || 'na'}/u_${newUser.id_usuario}`
      );
      const archivo = await prisma.archivos.create({
        data: {
          fk_id_usuario_subio: newUser.id_usuario,
          fk_id_cat_tipo_archivo: 1,
          fk_id_institucion: newUser.fk_id_institucion,
          nombre_original: meta.originalname,
          nombre_servidor: meta.nombre_servidor,
          tipo_mime: meta.mimetype,
          tamano_bytes: meta.size,
          ruta: meta.ruta,
          f_reg: new Date()
        }
      });
      await prisma.rel_usuarios_archivos.create({
        data: {
          fk_id_usuario: newUser.id_usuario,
          fk_id_archivo: archivo.id_archivo,
          fk_id_cat_tipo_archivo: 1,
          activo: true,
          f_reg: new Date()
        }
      });
    }

    await seedRelUsuarioSubmodulosFromPlan({
      userId: newUser.id_usuario,
      fk_id_institucion: newUser.fk_id_institucion,
      fk_id_cat_tipo_usuario: tipoCrear
    });

    const { hash_pass: _, ...usuarioResponse } = newUser;

    const roleName = getRoleName(tipoCrear);
    try {
      const { sendCredentialsEmail } = await import('../../../shared/utils/emailService');
      sendCredentialsEmail({ nombre: usuarioResponse.nombre, email: usuarioResponse.email as string }, finalPassword, roleName).catch((err: Error) =>
        console.error('Fallo envío email async:', err)
      );
    } catch { /* email no configurado */ }

    res.status(201).json({ success: true, data: usuarioResponse });
  } catch (error) {
    next(error);
  }
};

async function crearDireccionUsuario(usuarioId: number, direccion: Record<string, string | undefined>): Promise<void> {
  if (!direccion) return;

  let idCatEstado: number | null = null;
  let idCatMunicipio: number | null = null;
  const idPais = direccion.pais != null && String(direccion.pais).trim() !== ''
    ? parseInt(direccion.pais, 10)
    : 1;

  if (idPais === 1) {
    if (direccion.estado) {
      const edo = await prisma.cat_estados.findFirst({ where: { estado: direccion.estado } });
      if (edo) idCatEstado = edo.id_cat_estado;
    }
    if (direccion.municipio && idCatEstado) {
      const mun = await prisma.cat_municipios.findFirst({
        where: { municipio: direccion.municipio, fk_id_cat_estado: idCatEstado }
      });
      if (mun) idCatMunicipio = mun.id_cat_municipio;
    }
  }

  const sanitizeStr = (val: unknown): string | null =>
    val != null && String(val).trim() !== '' ? String(val).trim() : null;

  await prisma.direcciones.create({
    data: {
      fk_id_usuario: usuarioId,
      calle: sanitizeStr(direccion.calle),
      numero_exterior: sanitizeStr(direccion.numero),
      colonia: sanitizeStr(direccion.colonia) || (idPais !== 1 ? sanitizeStr(direccion.municipio) : null),
      cp: direccion.cp ? parseInt(direccion.cp, 10) : null,
      fk_id_cat_estado: idCatEstado || null,
      fk_id_cat_municipio: idCatMunicipio || null,
      fk_id_cat_pais: idPais || null,
      estado_texto: idPais !== 1 ? sanitizeStr(direccion.estado) : null,
      municipio_texto: idPais !== 1 ? sanitizeStr(direccion.municipio) : null,
      f_reg: new Date(),
      f_mod: new Date()
    }
  });
}

export const resendPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const usuario = await prisma.usuarios.findUnique({ where: { id_usuario: parseInt(id, 10) } });

    if (!usuario) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    const { generateSecurePassword } = await import('../../../shared/utils/passwordGenerator');
    const newPassword = generateSecurePassword(8);
    const hash_pass = await bcrypt.hash(newPassword, 8);

    await prisma.usuarios.update({
      where: { id_usuario: usuario.id_usuario },
      data: { hash_pass, campass: false }
    });

    const roleName = getRoleName(usuario.fk_id_cat_tipo_usuario);
    try {
      const { sendCredentialsEmail } = await import('../../../shared/utils/emailService');
      await sendCredentialsEmail({ nombre: usuario.nombre, email: usuario.email as string }, newPassword, roleName);
    } catch { /* email no configurado */ }

    res.json({ success: true, message: 'Nueva contraseña enviada por correo.' });
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10);
    const { nombre, telefono, curp, email } = req.body as Record<string, string | undefined>;

    const usuario = await prisma.usuarios.findUnique({ where: { id_usuario: userId } });
    if (!usuario) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    const actorTipo = Number(req.user.fk_id_cat_tipo_usuario);
    const esSuperInst = actorTipo === 1 || actorTipo === 6;
    if (!esSuperInst && usuario.fk_id_institucion !== req.user.fk_id_institucion) {
      res.status(403).json({ message: 'No tienes permiso para editar usuarios de otra institución.' });
      return;
    }

    const updateData: Record<string, unknown> = {};

    if (nombre !== undefined && nombre !== null && String(nombre).trim() !== '') {
      const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
      if (!nameRegex.test(String(nombre).trim())) {
        res.status(400).json({ message: 'El nombre solo debe contener letras y espacios.' });
        return;
      }
      updateData.nombre = String(nombre).trim();
    }

    if (telefono !== undefined) updateData.telefono = telefono && telefono.trim() !== '' ? telefono.trim() : null;
    if (curp !== undefined) updateData.curp = curp && curp.trim() !== '' ? curp.trim() : null;

    if (email !== undefined) {
      const normEmail = email && String(email).trim() !== '' ? String(email).trim() : null;
      if (normEmail && normEmail !== usuario.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normEmail)) {
          res.status(400).json({ message: 'El formato del email no es válido' });
          return;
        }
        const existingEmail = await prisma.usuarios.findFirst({
          where: { email: normEmail, activo: true, NOT: { id_usuario: userId } }
        });
        if (existingEmail) {
          res.status(400).json({ message: 'El email ya está en uso' });
          return;
        }
        updateData.email = normEmail;
      }
    }

    updateData.f_mod = new Date();

    await prisma.usuarios.update({ where: { id_usuario: userId }, data: updateData });

    if (req.body.direccion) {
      await prisma.direcciones.deleteMany({ where: { fk_id_usuario: userId } });
      await crearDireccionUsuario(userId, req.body.direccion);
    }

    const usuarioActualizado = await prisma.usuarios.findUnique({
      where: { id_usuario: userId },
      include: {
        direcciones: { include: { cat_estados: true, cat_municipios: true } }
      }
    });

    res.json({ success: true, data: usuarioActualizado });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const usuario = await prisma.usuarios.findUnique({ where: { id_usuario: parseInt(id, 10) } });

    if (!usuario) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    if (req.user.fk_id_cat_tipo_usuario !== 1 && usuario.fk_id_institucion !== req.user.fk_id_institucion) {
      res.status(403).json({ message: 'No tienes permiso para eliminar usuarios de otra institución.' });
      return;
    }

    await prisma.usuarios.update({
      where: { id_usuario: parseInt(id, 10) },
      data: { activo: false }
    });

    res.json({ success: true, message: 'Usuario desactivado correctamente' });
  } catch (error) {
    next(error);
  }
};

// Alias for delete (since 'delete' is a reserved word, expose it differently in routes)
export { deleteUser as delete };
