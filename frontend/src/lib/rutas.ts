import { useCallback, useEffect, useState } from 'react';

/**
 * Enrutado mínimo sobre la History API.
 *
 * Son tres vistas. React Router traería un contexto, un árbol de rutas y 20 KB
 * para resolver lo que acá son quince líneas. Lo que sí hacía falta y no había
 * era esto: que cada vista tenga su URL, que recargar no te devuelva al inicio
 * y que el botón de atrás del navegador funcione.
 */

export type Ruta = '/' | '/registro' | '/chat';

const VALIDAS: Ruta[] = ['/', '/registro', '/chat'];

function normalizar(p: string): Ruta {
  return (VALIDAS as string[]).includes(p) ? (p as Ruta) : '/';
}

export function useRuta(): [Ruta, (r: Ruta) => void] {
  const [ruta, setRuta] = useState<Ruta>(() => normalizar(window.location.pathname));

  useEffect(() => {
    const alVolver = () => setRuta(normalizar(window.location.pathname));
    window.addEventListener('popstate', alVolver);
    return () => window.removeEventListener('popstate', alVolver);
  }, []);

  const ir = useCallback((r: Ruta) => {
    if (r !== window.location.pathname) {
      window.history.pushState({}, '', r);
    }
    setRuta(r);
    window.scrollTo(0, 0);
  }, []);

  return [ruta, ir];
}
