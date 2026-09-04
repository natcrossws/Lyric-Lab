import path from 'path';
import fs from 'fs';

interface ArchivoRecord {
  ruta?: string | null;
  nombre_servidor?: string | null;
  tipo_mime?: string | null;
}

function bufferToDataUri(buffer: Buffer, tipoMime: string | null | undefined): string {
  const mime = tipoMime || 'application/octet-stream';
  return `data:${mime};base64,${buffer.toString('base64')}`;
}

function looksLikeWindowsAbsPath(s: string): boolean {
  return typeof s === 'string' && /^[a-zA-Z]:\\/.test(s);
}

/**
 * Devuelve data URI desde un registro archivos.
 */
export async function getDataUriFromArchivoRecord(archivo: ArchivoRecord | null): Promise<string | null> {
  if (!archivo) return null;

  const ruta = archivo.ruta != null && String(archivo.ruta).trim() !== ''
    ? String(archivo.ruta).trim()
    : null;

  const isLegacyLocal =
    ruta &&
    (path.isAbsolute(ruta) ||
      looksLikeWindowsAbsPath(ruta) ||
      (ruta.startsWith('/') && fs.existsSync(ruta)));

  if (ruta && !isLegacyLocal) {
    try {
      const s3ClientModule = await import('../services/s3Client');
      const { downloadFileBuffer, isR2Configured } = s3ClientModule;
      if (isR2Configured) {
        const buf = await downloadFileBuffer(ruta);
        return bufferToDataUri(buf, archivo.tipo_mime);
      }
    } catch (e: unknown) {
      console.warn('[getDataUriFromArchivoRecord] R2:', ruta, (e as Error).message);
    }
  }

  return getFileBase64(archivo.nombre_servidor || ruta || null);
}

/**
 * Reads a file from the filesystem and returns it as a Base64 data URI.
 */
export const getFileBase64 = (filePath: string | null | undefined): string | null => {
  try {
    if (!filePath) return null;

    let nombreArchivo = filePath.toString()
      .replace(/^\/+/, '')
      .replace(/^uploads\//, '')
      .replace(/^public\//, '')
      .replace(/^publicevidencias\//, 'evidencias/')
      .replace(/\/+$/, '')
      .replace(/^api\/archivos\//, '');

    if (nombreArchivo.includes('/')) {
      nombreArchivo = nombreArchivo.split('/').pop() || nombreArchivo;
    }

    const primaryPath = path.join(__dirname, '../../uploads', nombreArchivo);
    if (fs.existsSync(primaryPath)) {
      return convertToBase64(primaryPath);
    }

    const alternativePaths = [
      path.join(process.cwd(), 'uploads', nombreArchivo),
      path.join(process.cwd(), 'server', 'uploads', nombreArchivo),
      path.join(__dirname, '../../../uploads', nombreArchivo)
    ];

    for (const altPath of alternativePaths) {
      if (fs.existsSync(altPath)) {
        return convertToBase64(altPath);
      }
    }

    console.warn(`[getFileBase64] File not found: ${nombreArchivo} (Original: ${filePath})`);
    return null;
  } catch (error: unknown) {
    console.error(`[getFileBase64] Error processing ${filePath}:`, (error as Error).message);
    return null;
  }
};

const convertToBase64 = (fullPath: string): string | null => {
  try {
    const fileBuffer = fs.readFileSync(fullPath);
    const base64 = fileBuffer.toString('base64');
    const ext = path.extname(fullPath).toLowerCase();
    let mimeType = 'application/octet-stream';

    switch (ext) {
      case '.jpg':
      case '.jpeg': mimeType = 'image/jpeg'; break;
      case '.png': mimeType = 'image/png'; break;
      case '.gif': mimeType = 'image/gif'; break;
      case '.webp': mimeType = 'image/webp'; break;
      case '.pdf': mimeType = 'application/pdf'; break;
      case '.txt': mimeType = 'text/plain'; break;
    }

    return `data:${mimeType};base64,${base64}`;
  } catch (err: unknown) {
    console.error(`[getFileBase64] Read error for ${fullPath}:`, (err as Error).message);
    return null;
  }
};

export { bufferToDataUri };
