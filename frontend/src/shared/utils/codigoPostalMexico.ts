/** Solo dígitos, máximo 5 (CP México SEPOMEX). Preserva ceros a la izquierda como texto. */
export function sanitizeCpMexicoDigits(raw: string | number | null | undefined): string {
  return String(raw ?? '').replace(/\D/g, '').slice(0, 5);
}

export function isCpMexicoCompleto(cp: string | number | null | undefined): boolean {
  return /^\d{5}$/.test(String(cp ?? '').trim());
}
