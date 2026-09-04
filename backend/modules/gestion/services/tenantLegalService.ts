import prisma from '../../../core/db/prisma';
import { getIdByCodigo } from '../../../shared/services/catTipoDocumentoResolver';

const PUBLIC_SLUG_TO_CODIGO: Record<string, string> = {
  'aviso-privacidad': 'AVISO_PRIVACIDAD',
  'terminos-condiciones': 'TERMINOS_CONDICIONES'
};

const CODIGO_TO_PUBLIC_SLUG = Object.fromEntries(
  Object.entries(PUBLIC_SLUG_TO_CODIGO).map(([slug, codigo]) => [codigo, slug])
);

export function codigoFromPublicSlug(slug: string): string {
  const codigo = PUBLIC_SLUG_TO_CODIGO[String(slug || '').trim().toLowerCase()];
  if (!codigo) {
    const err = Object.assign(new Error('Código de documento legal no válido'), { statusCode: 400 });
    throw err;
  }
  return codigo;
}

function defaultTituloForCodigo(codigo: string) {
  const map: Record<string, { es: string; en: string }> = {
    AVISO_PRIVACIDAD: { es: 'Aviso de privacidad', en: 'Privacy notice' },
    TERMINOS_CONDICIONES: { es: 'Términos y condiciones', en: 'Terms and conditions' }
  };
  return map[codigo] || { es: 'Documento legal', en: 'Legal document' };
}

function serializePublicDoc(row: any, codigoCat: string) {
  if (!row) return null;
  return {
    codigo: CODIGO_TO_PUBLIC_SLUG[codigoCat] || null,
    codigo_catalogo: codigoCat,
    version: row.version,
    titulo: row.titulo || defaultTituloForCodigo(codigoCat),
    contenido_html: row.contenido_html || { es: '', en: '' },
    vigente_desde: row.vigente_desde
  };
}

async function getVigenteRow(instId: number, codigoCat: string) {
  const fkTipo = await getIdByCodigo(codigoCat);
  return prisma.tenant_documentos_legales.findFirst({
    where: { fk_id_institucion: instId, fk_id_cat_tipo_documento: fkTipo, activo: true },
    orderBy: { vigente_desde: 'desc' },
    include: { cat_tipos_documento: { select: { codigo: true, nombre: true } } }
  });
}

export async function listVigentesPublic(instId: number) {
  const rows = await prisma.tenant_documentos_legales.findMany({
    where: { fk_id_institucion: instId, activo: true },
    include: { cat_tipos_documento: { select: { codigo: true, nombre: true } } },
    orderBy: [{ fk_id_cat_tipo_documento: 'asc' }, { vigente_desde: 'desc' }]
  });
  const seen = new Set<string>();
  const out = [];
  for (const row of rows) {
    const codigo = row.cat_tipos_documento?.codigo;
    if (!codigo || seen.has(codigo)) continue;
    seen.add(codigo);
    const doc = serializePublicDoc(row, codigo);
    if (doc) out.push(doc);
  }
  return out;
}

export async function getVigenteByPublicSlug(instId: number, publicSlug: string) {
  const codigo = codigoFromPublicSlug(publicSlug);
  const row = await getVigenteRow(instId, codigo);
  return serializePublicDoc(row, codigo);
}

export async function upsertVigente(
  instId: number,
  publicSlug: string,
  { titulo, contenido_html }: { titulo?: unknown; contenido_html?: unknown }
) {
  const codigo = codigoFromPublicSlug(publicSlug);
  const fkTipo = await getIdByCodigo(codigo);

  return prisma.$transaction(async (tx) => {
    let row = await tx.tenant_documentos_legales.findFirst({
      where: { fk_id_institucion: instId, fk_id_cat_tipo_documento: fkTipo, activo: true },
      orderBy: { vigente_desde: 'desc' }
    });

    if (!row) {
      row = await tx.tenant_documentos_legales.create({
        data: {
          fk_id_institucion: instId,
          fk_id_cat_tipo_documento: fkTipo,
          version: '1.0',
          titulo: (titulo as object) || defaultTituloForCodigo(codigo),
          contenido_html: (contenido_html as object) || { es: '', en: '' },
          activo: true,
          vigente_desde: new Date()
        }
      });
    } else {
      row = await tx.tenant_documentos_legales.update({
        where: { id_tenant_documento_legal: row.id_tenant_documento_legal },
        data: {
          titulo: titulo !== undefined ? (titulo as object) : undefined,
          contenido_html: contenido_html !== undefined ? (contenido_html as object) : undefined
        }
      });
    }
    return serializePublicDoc(row, codigo);
  });
}

export async function publishNewVersion(instId: number, publicSlug: string) {
  const codigo = codigoFromPublicSlug(publicSlug);
  const fkTipo = await getIdByCodigo(codigo);
  return prisma.$transaction(async (tx) => {
    const current = await tx.tenant_documentos_legales.findFirst({
      where: { fk_id_institucion: instId, fk_id_cat_tipo_documento: fkTipo, activo: true },
      orderBy: { vigente_desde: 'desc' }
    });
    if (!current) {
      const err = Object.assign(new Error('No hay documento vigente para publicar'), { statusCode: 404 });
      throw err;
    }
    await tx.tenant_documentos_legales.update({
      where: { id_tenant_documento_legal: current.id_tenant_documento_legal },
      data: { activo: false }
    });
    const major = parseInt(String(current.version || '1').split('.')[0], 10) || 1;
    const created = await tx.tenant_documentos_legales.create({
      data: {
        fk_id_institucion: instId,
        fk_id_cat_tipo_documento: fkTipo,
        version: `${major + 1}.0`,
        titulo: current.titulo ?? undefined,
        contenido_html: current.contenido_html ?? undefined,
        activo: true,
        vigente_desde: new Date()
      }
    });
    return serializePublicDoc(created, codigo);
  });
}
