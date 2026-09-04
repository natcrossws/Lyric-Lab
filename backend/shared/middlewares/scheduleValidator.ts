/**
 * scheduleValidator — Validador de conflictos de horario.
 * 
 * Nota: Este validador depende de los modelos Clase y ClaseRecalendarizacion
 * que son parte de módulos de negocio específicos, no del core de la plantilla.
 * Cuando se implementen esos módulos, actualizar con queries Prisma.
 */

interface Recursos {
  id_salon?: number;
  id_profesor?: number;
  id_alumno?: number;
}

export const checkUnavailable = async (
  _recursos: Recursos,
  _id_cat_dia: number,
  _hora_inicio: string,
  _hora_fin: string,
  _excludeClaseId: number | null = null,
  _specificDate: string | null = null
): Promise<string | null> => {
  // Stub: implementar con Prisma cuando se agreguen los modelos de Clases
  // Ejemplo de cómo sería con Prisma:
  // const conflictos = await prisma.clases.findMany({
  //   where: {
  //     fk_id_cat_dia: id_cat_dia,
  //     activo: true,
  //     hora_inicio: { lt: hora_fin },
  //     hora_fin: { gt: hora_inicio },
  //     OR: [
  //       recursos.id_salon ? { fk_id_salon: recursos.id_salon } : undefined,
  //       ...
  //     ].filter(Boolean)
  //   }
  // });
  return null;
};
