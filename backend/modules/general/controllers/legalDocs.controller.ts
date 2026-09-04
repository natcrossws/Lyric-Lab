import type { Request, Response } from 'express';
import { readLegalConfig, writeLegalConfig, type LegalDocTipo } from '../../../shared/utils/legalDocsConfig';
import { persistMulterFileToR2, type MulterFile } from '../../../shared/services/multerR2Persist';
import { downloadFileBuffer, deleteFile } from '../../../shared/services/s3Client';

const VALID_TIPOS: LegalDocTipo[] = ['AVISO_PRIVACIDAD', 'TERMINOS_CONDICIONES'];

function nextVersion(v: string | undefined): string {
  const major = parseInt(String(v || '1').split('.')[0], 10) || 1;
  return `${major + 1}.0`;
}

type UploadReq = Request & { file?: MulterFile };

export function getLegalDocsStatus(_req: Request, res: Response) {
  try {
    const cfg = readLegalConfig();
    return res.json({ success: true, docs: cfg });
  } catch (e) {
    return res.status(500).json({ success: false, message: (e as Error).message });
  }
}

export async function uploadLegalDoc(req: UploadReq, res: Response) {
  try {
    const tipo = req.params.tipo as LegalDocTipo;
    if (!VALID_TIPOS.includes(tipo)) {
      return res.status(400).json({ success: false, message: 'Tipo de documento inválido' });
    }
    const file = req.file;
    if (!file) return res.status(400).json({ success: false, message: 'No se recibió archivo PDF' });
    if (file.mimetype !== 'application/pdf') {
      return res.status(400).json({ success: false, message: 'El archivo debe ser PDF' });
    }

    const cfg = readLegalConfig();
    const current = cfg[tipo] || { version: '1.0', r2_key: null };

    if (current.r2_key) {
      try { await deleteFile(current.r2_key); } catch { /* ignore */ }
    }

    const meta = await persistMulterFileToR2(file, `documentos_legales/${tipo}`);

    let textoPreview: string | null = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text?: string }>;
      if (file.buffer) {
        const parsed = await pdfParse(file.buffer);
        textoPreview = parsed.text ? parsed.text.slice(0, 3000).trim() : null;
      }
    } catch (e) {
      console.warn('[legalDocs] pdf-parse:', (e as Error).message);
    }

    cfg[tipo] = {
      version: nextVersion(current.version),
      r2_key: meta.ruta,
      mime: 'application/pdf',
      nombre_archivo: file.originalname,
      updated_at: new Date().toISOString(),
      texto_preview: textoPreview
    };
    writeLegalConfig(cfg);
    return res.json({ success: true, doc: cfg[tipo] });
  } catch (e) {
    console.error('[legalDocs] uploadLegalDoc:', e);
    return res.status(500).json({ success: false, message: (e as Error).message });
  }
}

export async function serveDocumentPdf(req: Request, res: Response) {
  try {
    const tipo = req.params.tipo as LegalDocTipo;
    if (!VALID_TIPOS.includes(tipo)) return res.status(400).send('Bad request');
    const cfg = readLegalConfig();
    const doc = cfg[tipo];
    if (!doc?.r2_key) return res.status(404).send('Documento no disponible aún');
    const buf = await downloadFileBuffer(doc.r2_key);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).send(buf);
  } catch (e) {
    console.error('[legalDocs] serveDocumentPdf:', e);
    return res.status(500).send('Error al obtener documento');
  }
}
