/** Colores sólidos alineados con Chakra (topbar / fondos) para <meta name="theme-color"> */

/** Shell app: crema Margarita (`brand.50`) */
export const THEME_COLOR_APP_SHELL = 'var(--chakra-colors-brand-50)';

/** Shell plano por rol = petróleo (`colors.brand.500`) */
export const THEME_COLOR_ROLE_SHELL_FLAT = 'var(--chakra-colors-brand-500)';

/** Barra del sistema (theme-color): mismo tono que `LoginPageNavbar` (`brand.500`). */
export const THEME_COLOR_LOGIN_NAVBAR = THEME_COLOR_ROLE_SHELL_FLAT;

/** Pantallas auth/marketing con fondo bosque (`brand.700` / primario oscuro) */
export const THEME_COLOR_AUTH_SURFACE = '#0A3323';

/** Rutas oscuras: si cambias esta lista, sincroniza `index.html` (script theme-color inline). */
const DARK_ROUTE_PREFIXES = [
  '/change-password',
  '/planes',
  '/registro-institucion',
  '/succes-subscription',
  '/aceptacion-documentos',
  '/aviso-privacidad',
  '/test-passkeys',
  '/test-audio',
];

/** Rutas con layout de app (topbar + sidebar planos). */
const ROLE_SHELL_PREFIXES = ['/admin', '/profesor', '/padre', '/alumno'];

function pathMatchesPrefix(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Shell plano marca en áreas por rol (topbar + sidebar + theme-color). */
export function isRoleShellFlatPath(pathname: string): boolean {
  const path = pathname || '';
  return ROLE_SHELL_PREFIXES.some((p) => pathMatchesPrefix(path, p));
}

export function getThemeColorForPath(pathname: string): string {
  const path = pathname || '/';
  if (pathMatchesPrefix(path, '/login')) {
    return THEME_COLOR_LOGIN_NAVBAR;
  }
  if (DARK_ROUTE_PREFIXES.some((p) => pathMatchesPrefix(path, p))) {
    return THEME_COLOR_AUTH_SURFACE;
  }
  if (isRoleShellFlatPath(path)) {
    return THEME_COLOR_ROLE_SHELL_FLAT;
  }
  return THEME_COLOR_APP_SHELL;
}
