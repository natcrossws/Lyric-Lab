/**
 * Alineado a `app/backend/shared/utils/edadUtils.js` (plan menores / D1).
 * @param {string|Date} fechaNacimiento
 * @param {Date} [referencia=new Date()]
 * @param {number} [edadMayoria=18]
 * @returns {boolean|null} true si es menor estricto; null si fecha inválida o ausente
 */
export function esMenor(fechaNacimiento: string | Date | null | undefined, referencia: string | Date = new Date(), edadMayoria: number = 18): boolean | null {
  if (fechaNacimiento === null || fechaNacimiento === undefined || fechaNacimiento === '') {
    return null;
  }
  const birth = new Date(fechaNacimiento);
  if (Number.isNaN(birth.getTime())) {
    return null;
  }
  const ref = new Date(referencia);
  if (Number.isNaN(ref.getTime())) {
    return null;
  }
  let age = ref.getFullYear() - birth.getFullYear();
  const m = ref.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age < edadMayoria;
}
