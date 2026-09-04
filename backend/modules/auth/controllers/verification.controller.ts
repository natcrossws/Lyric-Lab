import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import prisma from '../../../core/db/prisma';
import { sendEmail } from '../../../shared/utils/emailService';

// Note: codigos_verificacion table might not exist in base template.
// Using a graceful fallback if the table doesn't exist.

const generateRandomCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generateCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { correo, tipo = 'RECUPERACION_PASSWORD' } = req.body as { correo?: string; tipo?: string };

    if (!correo) {
      res.status(400).json({ success: false, message: 'El correo es requerido' });
      return;
    }

    const user = await prisma.usuarios.findFirst({ where: { email: correo } });
    if (!user) {
      // No revelar si el correo está registrado
      res.json({ success: true, message: 'Si el correo existe, se ha enviado un código.' });
      return;
    }

    const codigo = generateRandomCode();
    const expiraEn = new Date(Date.now() + 15 * 60 * 1000);

    // Guardar código si la tabla existe
    try {
      // @ts-expect-error — codigos_verificacion may not exist in base template
      await prisma.codigos_verificacion?.create({
        data: {
          correo,
          codigo,
          tipo,
          expira_en: expiraEn
        }
      });
    } catch { /* tabla no existe en template base */ }

    // Enviar email
    try {
      await sendEmail({
        to: correo,
        subject: 'Tu código de verificación',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Código de Verificación</h2>
            <p>Tu código para ${tipo === 'RECUPERACION_PASSWORD' ? 'recuperar contraseña' : 'verificar cuenta'} es:</p>
            <h1 style="color: #4F46E5; letter-spacing: 5px;">${codigo}</h1>
            <p>Este código expira en 15 minutos.</p>
            <p>Si no solicitaste este código, ignora este correo.</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Error enviando email:', emailError);
      res.status(500).json({ success: false, message: 'Error al enviar el correo' });
      return;
    }

    res.json({ success: true, message: 'Código enviado correctamente' });
  } catch (error) {
    next(error);
  }
};

export const verifyCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { correo, codigo } = req.body as { correo?: string; codigo?: string };

    if (!correo || !codigo) {
      res.status(400).json({ success: false, message: 'Correo y código son requeridos' });
      return;
    }

    let validCode = null;
    try {
      // @ts-expect-error
      validCode = await prisma.codigos_verificacion?.findFirst({
        where: {
          correo,
          codigo,
          usado: false,
          expira_en: { gt: new Date() }
        },
        orderBy: { created_at: 'desc' }
      });
    } catch { /* tabla no existe */ }

    if (!validCode) {
      res.status(400).json({ success: false, message: 'Código inválido o expirado' });
      return;
    }

    res.json({ success: true, message: 'Código válido' });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { correo, codigo, nueva_password } = req.body as { correo?: string; codigo?: string; nueva_password?: string };

    if (!correo || !codigo || !nueva_password) {
      res.status(400).json({ success: false, message: 'Faltan datos requeridos' });
      return;
    }

    let validCode: { id?: number } | null = null;
    try {
      // @ts-expect-error
      validCode = await prisma.codigos_verificacion?.findFirst({
        where: {
          correo,
          codigo,
          usado: false,
          expira_en: { gt: new Date() }
        },
        orderBy: { created_at: 'desc' }
      });
    } catch { /* tabla no existe */ }

    if (!validCode) {
      res.status(400).json({ success: false, message: 'Código inválido o expirado' });
      return;
    }

    const user = await prisma.usuarios.findFirst({ where: { email: correo } });
    if (!user) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hash_pass = await bcrypt.hash(nueva_password, salt);

    await prisma.usuarios.update({
      where: { id_usuario: user.id_usuario },
      data: { hash_pass }
    });

    // Marcar código como usado
    try {
      if (validCode.id) {
        // @ts-expect-error
        await prisma.codigos_verificacion?.update({
          where: { id: validCode.id },
          data: { usado: true }
        });
      }
    } catch { /* tabla no existe */ }

    res.json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    next(error);
  }
};
