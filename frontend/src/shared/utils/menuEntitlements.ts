/** Rutas con pantalla en frontend pero aún sin fila en `rutas` / `submodulos` (por rol). */
const STATIC_EXTRAS_BY_ROLE: Record<string, string[]> = {
  ADMIN: ['/admin/monitor', '/admin/quizzes', '/admin/configuracion', '/admin/tutores'],
  GLOBAL_ADMIN: ['/admin/monitor', '/admin/quizzes', '/admin/configuracion', '/admin/tutores'],
  INSTITUTION_ADMIN: ['/admin/monitor', '/admin/quizzes', '/admin/configuracion', '/admin/tutores'],
  PROFESOR: ['/profesor/biblioteca', '/profesor/quiz-gen', '/profesor/quizzes', '/profesor/boletas-ia', '/profesor/configuracion'],
  PADRE: ['/padre/configuracion', '/padre/reportes', '/padre/registrar-hijo', '/padre/mis-hijos'],
  ALUMNO: ['/alumno/clases', '/alumno/pagos', '/alumno/configuracion']
};

export function getStaticExtrasForRole(role: string): string[] {
  if (!role) return [];
  return [...(STATIC_EXTRAS_BY_ROLE[role] || [])];
}

/**
 * Cruza enlaces del sidebar con rutas permitidas por suscripción/plan (`rutas.ruta`).
 * @param {{ path: string }} link
 * @param {string[]} paths - rutas exactas desde BD (ej. `/admin/usuarios`)
 * @param {string[]} [staticExtras] - rutas no (aún) ligadas a `submodulos`
 */
export function isLinkAllowedByPlanPaths(link: { path?: string }, paths: string[], staticExtras: string[] = []): boolean {
  if (!paths || paths.length === 0) return true;

  const p = (link.path || '').replace(/\/$/, '') || '/';
  const set = new Set(paths.map((x) => (x || '').replace(/\/$/, '')));

  if (staticExtras.some((e) => {
    const x = (e || '').replace(/\/$/, '');
    return p === x || p.startsWith(`${x}/`);
  })) {
    return true;
  }

  if (set.has(p)) return true;

  const indexPairs = [
    ['/admin', '/admin/dashboard'],
    ['/profesor', '/profesor/dashboard'],
    ['/padre', '/padre/dashboard'],
    ['/alumno', '/alumno/dashboard']
  ];
  for (const [indexPath, dashPath] of indexPairs) {
    if (p === indexPath && set.has(dashPath)) return true;
  }

  for (const allowed of set) {
    if (!allowed) continue;
    if (p.startsWith(`${allowed}/`)) return true;
  }

  return false;
}
