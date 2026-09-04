import type { Request, Response } from 'express';
import prisma from '../../../core/db/prisma';
import { getIdByCodigo } from '../../../shared/services/catTipoDocumentoResolver';
import { readLegalConfig, getCurrentVersions, type LegalDocTipo } from '../../../shared/utils/legalDocsConfig';

const PDF_URL_BASE = '/api/general/legal-docs';

interface AuthUser {
  id_usuario?: number;
  id?: number;
  fk_id_cat_tipo_usuario?: number;
  id_rol?: number;
}

type AuthedRequest = Request & { user: AuthUser };

function requiredDocsForUser(user: AuthUser): LegalDocTipo[] {
  const docs: LegalDocTipo[] = ['AVISO_PRIVACIDAD'];
  const tipo = user.fk_id_cat_tipo_usuario ?? user.id_rol;
  if (tipo === 1 || tipo === 5 || tipo === 6) docs.push('TERMINOS_CONDICIONES');
  return docs;
}

export async function hasPendingLegalDocs(userId: number, tipoUsuario: number): Promise<boolean> {
  const CURRENT_VERSIONS = getCurrentVersions();
  const requiredDocs = requiredDocsForUser({ fk_id_cat_tipo_usuario: tipoUsuario });
  const acceptedDocs = await prisma.aceptacion_documentos.findMany({
    where: { fk_id_usuario: userId },
    include: { cat_tipos_documento: { select: { codigo: true } } }
  });
  for (const docType of requiredDocs) {
    const accepted = acceptedDocs.find(
      (d) => d.cat_tipos_documento.codigo === docType && d.version === CURRENT_VERSIONS[docType]
    );
    if (!accepted) return true;
  }
  return false;
}

export async function checkStatus(req: AuthedRequest, res: Response) {
  try {
    const userId = req.user.id_usuario ?? req.user.id;
    if (!userId) return res.status(401).json({ status: 'error', message: 'No autenticado' });
    const CURRENT_VERSIONS = getCurrentVersions();
    const legalCfg = readLegalConfig();
    const requiredDocs = requiredDocsForUser(req.user);

    const acceptedDocs = await prisma.aceptacion_documentos.findMany({
      where: { fk_id_usuario: userId },
      include: { cat_tipos_documento: { select: { codigo: true } } }
    });

    const pending = [];
    for (const docType of requiredDocs) {
      const accepted = acceptedDocs.find(
        (d) => d.cat_tipos_documento.codigo === docType && d.version === CURRENT_VERSIONS[docType]
      );
      if (!accepted) {
        pending.push({
          type: docType,
          version: CURRENT_VERSIONS[docType],
          pdf_url: `${PDF_URL_BASE}/${docType}/pdf`,
          has_pdf: !!(legalCfg[docType]?.r2_key)
        });
      }
    }
    res.json({ status: 'success', pendingDocs: pending });
  } catch (error) {
    console.error('Check Status Error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
}

export async function acceptDocument(req: AuthedRequest, res: Response) {
  try {
    const userId = req.user.id_usuario ?? req.user.id;
    if (!userId) return res.status(401).json({ status: 'fail', message: 'No autenticado' });
    const { type, version } = req.body as { type?: string; version?: string };
    if (!type || !['AVISO_PRIVACIDAD', 'TERMINOS_CONDICIONES'].includes(type)) {
      return res.status(400).json({ status: 'fail', message: 'Invalid document type' });
    }
    if (!version) return res.status(400).json({ status: 'fail', message: 'version required' });

    const fkTipoDoc = await getIdByCodigo(type);
    const existing = await prisma.aceptacion_documentos.findFirst({
      where: { fk_id_usuario: userId, fk_id_cat_tipo_documento: fkTipoDoc, version }
    });
    if (existing) return res.json({ status: 'success', message: 'Document already accepted' });

    await prisma.aceptacion_documentos.create({
      data: {
        fk_id_usuario: userId,
        fk_id_cat_tipo_documento: fkTipoDoc,
        version,
        ip_address: req.ip
      }
    });
    res.json({ status: 'success', message: 'Document accepted' });
  } catch (error) {
    console.error('Accept Document Error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
}

export function getPublicPrivacyNotice(_req: Request, res: Response) {
  const cfg = readLegalConfig();
  res.json({
    type: 'AVISO_PRIVACIDAD',
    version: cfg.AVISO_PRIVACIDAD?.version || '1.0',
    pdf_url: `${PDF_URL_BASE}/AVISO_PRIVACIDAD/pdf`,
    has_pdf: !!(cfg.AVISO_PRIVACIDAD?.r2_key)
  });
}
