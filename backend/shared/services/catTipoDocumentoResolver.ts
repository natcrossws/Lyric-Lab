import prisma from '../../core/db/prisma';

const idByCodigo = new Map<string, number>();

export async function getIdByCodigo(codigo: string): Promise<number> {
  const key = String(codigo || '').trim();
  if (!key) throw new Error('cat_tipos_documento: codigo vacío');
  if (idByCodigo.has(key)) return idByCodigo.get(key)!;
  const row = await prisma.cat_tipos_documento.findFirst({
    where: { codigo: key, activo: true },
    select: { id_cat_tipo_documento: true }
  });
  if (!row) throw new Error(`cat_tipos_documento: código no encontrado o inactivo: ${key}`);
  idByCodigo.set(key, row.id_cat_tipo_documento);
  return row.id_cat_tipo_documento;
}
