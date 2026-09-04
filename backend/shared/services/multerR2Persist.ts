import { promises as fsp } from 'fs';
import fs from 'fs';
import path from 'path';
import { uploadFile, isR2Configured } from './s3Client';

export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
  buffer?: Buffer;
}

export interface UploadResult {
  originalname: string;
  nombre_servidor: string;
  mimetype: string;
  size: number;
  ruta: string;
}

async function readMulterFileBuffer(file: MulterFile): Promise<Buffer> {
  if (file.buffer && Buffer.isBuffer(file.buffer) && file.buffer.length > 0) {
    return file.buffer;
  }
  if (!file?.path) {
    const err: any = new Error('Archivo temporal inválido.');
    err.statusCode = 400;
    throw err;
  }
  const maxAttempts = 12;
  const delayMs = 40;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fsp.readFile(file.path);
    } catch (e: any) {
      if (e.code === 'ENOENT' && attempt < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }
      throw e;
    }
  }
  throw new Error('No se pudo leer el archivo de Multer');
}

export async function persistMulterFileToR2(file: MulterFile, keyPrefix: string): Promise<UploadResult> {
  if (!isR2Configured) {
    const err: any = new Error(
      'Almacenamiento en la nube (Cloudflare R2) no está configurado. Defina R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY y R2_BUCKET_NAME.'
    );
    err.statusCode = 503;
    throw err;
  }

  let buf: Buffer;
  try {
    buf = await readMulterFileBuffer(file);
  } catch (e: any) {
    const err: any = new Error(
      e.code === 'ENOENT'
        ? 'No se pudo leer el archivo subido (temporal no encontrado). Vuelva a intentar o use una imagen más pequeña.'
        : `No se pudo leer el archivo subido: ${e.message}`
    );
    err.statusCode = 500;
    err.cause = e;
    throw err;
  }

  const nameSource =
    file.filename && String(file.filename).trim()
      ? file.filename
      : file.originalname || 'upload.bin';
  const safeBase = path.basename(nameSource);
  const prefix = String(keyPrefix || 'uploads').replace(/\/+$/, '');
  const key = `${prefix}/${Date.now()}_${safeBase}`;

  const uploadedKey = await uploadFile(buf, key, file.mimetype);
  if (!uploadedKey) {
    if (file.path) {
      try {
        fs.unlinkSync(file.path);
      } catch {
        /* ignore */
      }
    }
    const err: any = new Error('No se pudo subir el archivo al almacenamiento en la nube.');
    err.statusCode = 502;
    throw err;
  }

  if (file.path) {
    try {
      fs.unlinkSync(file.path);
    } catch (e: any) {
      console.warn('[persistMulterFileToR2] unlink temp:', e.message);
    }
  }

  return {
    originalname: file.originalname,
    nombre_servidor: path.basename(uploadedKey),
    mimetype: file.mimetype,
    size: typeof file.size === 'number' && file.size >= 0 ? file.size : buf.length,
    ruta: uploadedKey
  };
}
