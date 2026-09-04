import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { syncThemeColorMeta } from '@/core/theme/syncThemeColorMeta';

/**
 * Sincroniza theme-color (y color-scheme en <html>) con la ruta actual.
 * useEffect (no useLayoutEffect): evita carreras con Chakra/global styles sobre document.body.
 */
export default function DocumentThemeColor() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (typeof document !== 'undefined' && document.body) {
      syncThemeColorMeta(pathname);
    }
  }, [pathname]);

  return null;
}
