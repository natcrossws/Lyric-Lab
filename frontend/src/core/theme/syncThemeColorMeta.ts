import {
  getThemeColorForPath,
  THEME_COLOR_APP_SHELL,
  THEME_COLOR_AUTH_SURFACE,
  THEME_COLOR_ROLE_SHELL_FLAT,
} from './documentThemeColor';

const META_ID = 'ke-theme-color';
const META_ID_LIGHT = 'ke-theme-color-light';
const META_ID_DARK = 'ke-theme-color-dark';
const MEDIA_LIGHT = '(prefers-color-scheme: light)';
const MEDIA_DARK = '(prefers-color-scheme: dark)';
const COLOR_SCHEME_META_ID = 'ke-color-scheme';

function isLoginPath(pathname) {
  const path = pathname || '';
  return path === '/login' || path.startsWith('/login/');
}

function setThemeColorMetaContent(meta, content) {
  if (meta && meta.getAttribute('content') !== content) {
    meta.setAttribute('content', content);
  }
}

function ensureThemeColorMetaById(id, content, media) {
  let meta = document.getElementById(id);
  if (!meta) {
    meta = document.createElement('meta');
    meta.id = id;
    meta.setAttribute('name', 'theme-color');
    if (media) meta.setAttribute('media', media);
    meta.setAttribute('content', content);
    document.head.appendChild(meta);
    return;
  }
  if (media && meta.getAttribute('media') !== media) {
    meta.setAttribute('media', media);
  }
  setThemeColorMetaContent(meta, content);
}

/**
 * WebKit (Safari 15–18+ y sobre todo Safari 26+) suele muestrear el color de `html`/`body` y de
 * barras `position:fixed` junto al borde. Sin esto, el meta theme-color a veces se ignora en macOS.
 */
function syncDocumentSurfaceForChromeTint(content) {
  document.documentElement.style.backgroundColor = content;
  if (document.body) {
    document.body.style.backgroundColor = content;
  }
}

/**
 * Sincroniza <meta name="theme-color"> (y variante dark) con la ruta actual.
 * Sin el meta con media (prefers-color-scheme: dark), Safari en modo oscuro suele ignorar el color.
 */
export function syncThemeColorMeta(pathname: string) {
  if (typeof document === 'undefined' || !document.documentElement) {
    return;
  }

  const content = getThemeColorForPath(pathname);

  // 1. theme-color (fallback + navegadores que no usan media)
  let meta = document.getElementById(META_ID);
  if (!meta) {
    meta = document.querySelector('meta[name="theme-color"]:not([media])');
  }
  if (!meta) {
    meta = document.querySelector('meta[name="theme-color"]');
  }
  if (meta) {
    setThemeColorMetaContent(meta, content);
  } else {
    const newMeta = document.createElement('meta');
    newMeta.id = META_ID;
    newMeta.setAttribute('name', 'theme-color');
    newMeta.setAttribute('content', content);
    document.head.appendChild(newMeta);
  }

  ensureThemeColorMetaById(META_ID_LIGHT, content, MEDIA_LIGHT);
  ensureThemeColorMetaById(META_ID_DARK, content, MEDIA_DARK);

  syncDocumentSurfaceForChromeTint(content);

  // 2. color-scheme: login = barra marca (petróleo) → alinear con prefers dark (Safari tint)
  const colorSchemeMeta = document.getElementById(COLOR_SCHEME_META_ID);
  if (colorSchemeMeta) {
    const scheme = isLoginPath(pathname) ? 'dark' : 'light dark';
    if (colorSchemeMeta.getAttribute('content') !== scheme) {
      colorSchemeMeta.setAttribute('content', scheme);
    }
  }

  // 3. Sincronizar <html> style
  if (content === THEME_COLOR_ROLE_SHELL_FLAT) {
    document.documentElement.style.colorScheme = 'dark';
  } else if (content === THEME_COLOR_AUTH_SURFACE) {
    document.documentElement.style.colorScheme = 'dark';
  } else if (content === THEME_COLOR_APP_SHELL) {
    document.documentElement.style.colorScheme = 'light';
  } else {
    document.documentElement.style.removeProperty('color-scheme');
  }
}
