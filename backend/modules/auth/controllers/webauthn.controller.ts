import jwt from 'jsonwebtoken';
import { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';
import { Request, Response, NextFunction } from 'express';
import prisma from '../../../core/db/prisma';

const signToken = (id: number, role: string, name: string): string => {
  return jwt.sign({ id, role, name }, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  } as jwt.SignOptions);
};

const rpName = 'Template';
const rpID = process.env.WEBAUTHN_RP_ID
  || (process.env.SERVER_URL?.replace(/https?:\/\//, '').split(':')[0])
  || 'localhost';
const origin = process.env.WEBAUTHN_ORIGIN || process.env.SERVER_URL || 'http://localhost:3000';

interface ChallengeEntry {
  userId: number;
  timestamp: number;
  type: 'registration' | 'authentication';
}

const challengeStore = new Map<string, ChallengeEntry>();

setInterval(() => {
  const now = Date.now();
  const expiryTime = 5 * 60 * 1000;
  for (const [challenge, data] of challengeStore.entries()) {
    if (now - data.timestamp > expiryTime) {
      challengeStore.delete(challenge);
    }
  }
}, 5 * 60 * 1000);

export const generateRegistrationOptionsHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.id_usuario;
    const user = await prisma.usuarios.findUnique({ where: { id_usuario: userId } });

    if (!user) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    const existingCredentials = await prisma.webauthn_credentials.findMany({
      where: { fk_id_usuario: userId, activo: true }
    });

    const excludeCredentials = existingCredentials.map((cred) => ({
      id: cred.credential_id,
      type: 'public-key' as const
    }));

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: Buffer.from(String(userId)),
      userName: user.email || user.nombre,
      userDisplayName: user.nombre,
      timeout: 60000,
      attestationType: 'none',
      excludeCredentials: excludeCredentials.length > 0 ? excludeCredentials : undefined,
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'required',
        requireResidentKey: true
      },
      supportedAlgorithmIDs: [-7, -257]
    });

    challengeStore.set(options.challenge, { userId, timestamp: Date.now(), type: 'registration' });

    res.json({ success: true, options });
  } catch (error) {
    console.error('Error generating registration options:', error);
    next(error);
  }
};

export const verifyRegistrationHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.id_usuario;
    const { deviceName } = req.body as { deviceName?: string };
    const verificationResponse = req.body;

    let expectedChallenge = '';
    try {
      const clientDataJSON = Buffer.from(verificationResponse.response.clientDataJSON, 'base64url').toString();
      const clientData = JSON.parse(clientDataJSON) as { challenge: string };
      expectedChallenge = clientData.challenge;
    } catch {
      res.status(400).json({ success: false, message: 'Error al procesar el challenge' });
      return;
    }

    const challengeData = challengeStore.get(expectedChallenge);
    if (!challengeData || challengeData.type !== 'registration' || challengeData.userId !== userId) {
      res.status(400).json({ success: false, message: 'Challenge no encontrado o inválido.' });
      return;
    }

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: verificationResponse,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        requireUserVerification: true
      });
    } catch (error: unknown) {
      res.status(400).json({ success: false, message: 'Error al verificar la credencial: ' + (error as Error).message });
      return;
    }

    const { verified, registrationInfo } = verification;
    if (!verified || !registrationInfo) {
      res.status(400).json({ success: false, message: 'La verificación falló' });
      return;
    }

    const { credential } = registrationInfo;

    await prisma.webauthn_credentials.create({
      data: {
        fk_id_usuario: userId,
        credential_id: Buffer.from(credential.id).toString('base64url'),
        public_key: Buffer.from(credential.publicKey).toString('base64'),
        counter: credential.counter || 0,
        device_name: deviceName || 'Dispositivo desconocido',
        last_used: new Date(),
        activo: true,
        f_reg: new Date(),
        f_mod: new Date()
      }
    });

    challengeStore.delete(expectedChallenge);

    res.json({ success: true, message: 'Passkey registrada exitosamente' });
  } catch (error) {
    console.error('Error verificando registro:', error);
    next(error);
  }
};

export const generateAuthenticationOptionsHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body as { email?: string };

    if (!email) {
      res.status(400).json({ success: false, message: 'Email es requerido' });
      return;
    }

    const user = await prisma.usuarios.findFirst({
      where: { email: email.toLowerCase() },
      orderBy: { activo: 'desc' }
    });

    if (!user) {
      res.status(200).json({ success: false, message: 'Credenciales inválidas' });
      return;
    }

    if (!user.activo) {
      res.status(403).json({ success: false, message: 'Esta cuenta ha sido desactivada. Contacte al administrador.' });
      return;
    }

    const credentials = await prisma.webauthn_credentials.findMany({
      where: { fk_id_usuario: user.id_usuario, activo: true }
    });

    if (credentials.length === 0) {
      res.status(400).json({ success: false, message: 'No hay Passkeys registradas para este usuario' });
      return;
    }

    const allowCredentials = credentials.map((cred) => {
      return {
        id: cred.credential_id,
        type: 'public-key' as const,
        transports: ['internal'] as any[]
      };
    });

    const options = await generateAuthenticationOptions({
      rpID,
      timeout: 60000,
      allowCredentials,
      userVerification: 'required'
    });

    challengeStore.set(options.challenge, { userId: user.id_usuario, timestamp: Date.now(), type: 'authentication' });

    res.json({ success: true, options });
  } catch (error) {
    console.error('Error generating authentication options:', error);
    next(error);
  }
};

export const verifyAuthenticationHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const verificationResponse = req.body;

    let expectedChallenge = '';
    let challengeData: ChallengeEntry | undefined;

    try {
      const clientDataJSON = Buffer.from(verificationResponse.response.clientDataJSON, 'base64url').toString();
      const clientData = JSON.parse(clientDataJSON) as { challenge: string };
      expectedChallenge = clientData.challenge;
      challengeData = challengeStore.get(expectedChallenge);
    } catch {
      res.status(400).json({ success: false, message: 'Error al procesar el challenge' });
      return;
    }

    if (!challengeData || challengeData.type !== 'authentication') {
      res.status(400).json({ success: false, message: 'Challenge no encontrado o inválido.' });
      return;
    }

    const userId = challengeData.userId;

    let credentialId = verificationResponse.id as string;
    if (Buffer.isBuffer(credentialId)) {
      credentialId = (credentialId as unknown as Buffer).toString('base64url');
    } else if (typeof credentialId === 'string') {
      credentialId = credentialId.replace(/=/g, '');
    }

    const credentialWithUser = await prisma.webauthn_credentials.findFirst({
      where: { credential_id: credentialId, fk_id_usuario: userId, activo: true },
      include: { usuarios: true }
    });

    if (!credentialWithUser) {
      res.status(400).json({ success: false, message: 'Credencial no encontrada' });
      return;
    }

    const user = credentialWithUser.usuarios;
    if (!user.activo) {
      res.status(403).json({ success: false, message: 'Esta cuenta ha sido desactivada' });
      return;
    }

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: verificationResponse,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential: {
          id: credentialWithUser.credential_id,
          publicKey: Buffer.from(credentialWithUser.public_key, 'base64'),
          counter: Number(credentialWithUser.counter),
          transports: ['internal'] as any[]
        },
        requireUserVerification: true
      });
    } catch (error: unknown) {
      res.status(400).json({ success: false, message: 'Error al verificar: ' + (error as Error).message });
      return;
    }

    const { verified, authenticationInfo } = verification;
    if (!verified) {
      res.status(400).json({ success: false, message: 'La verificación falló' });
      return;
    }

    await prisma.webauthn_credentials.update({
      where: { id_credential: credentialWithUser.id_credential },
      data: { counter: authenticationInfo.newCounter, last_used: new Date(), f_mod: new Date() }
    });

    await prisma.usuarios.update({
      where: { id_usuario: user.id_usuario },
      data: { ultimo_login: new Date() }
    });

    let role = 'GUEST';
    switch (user.fk_id_cat_tipo_usuario) {
      case 1: role = 'ADMIN'; break;
      case 2: role = 'PROFESOR'; break;
      case 3: role = 'PADRE'; break;
      case 4: role = 'ALUMNO'; break;
      case 5: role = 'INSTITUTION_ADMIN'; break;
      case 6: role = 'GLOBAL_ADMIN'; break;
    }

    const token = signToken(user.id_usuario, role, user.nombre);
    challengeStore.delete(expectedChallenge);

    res.json({
      success: true,
      token,
      user: { id: user.id_usuario, nombre: user.nombre, email: user.email, role, id_rol: user.fk_id_cat_tipo_usuario }
    });
  } catch (error) {
    console.error('Error verificando autenticación:', error);
    next(error);
  }
};

export const getUserCredentials = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.id_usuario;
    const credentials = await prisma.webauthn_credentials.findMany({
      where: { fk_id_usuario: userId, activo: true },
      select: { id_credential: true, device_name: true, last_used: true, f_reg: true },
      orderBy: { last_used: 'desc' }
    });
    res.json({ success: true, credentials });
  } catch (error) {
    console.error('Error obteniendo credenciales:', error);
    next(error);
  }
};

export const deleteCredential = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user.id_usuario;
    const { credentialId } = req.params;

    const credential = await prisma.webauthn_credentials.findFirst({
      where: { id_credential: parseInt(credentialId, 10), fk_id_usuario: userId }
    });

    if (!credential) {
      res.status(404).json({ success: false, message: 'Credencial no encontrada' });
      return;
    }

    await prisma.webauthn_credentials.update({
      where: { id_credential: credential.id_credential },
      data: { activo: false }
    });

    res.json({ success: true, message: 'Passkey eliminada exitosamente' });
  } catch (error) {
    console.error('Error eliminando credencial:', error);
    next(error);
  }
};
