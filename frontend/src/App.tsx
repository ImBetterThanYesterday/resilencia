import { useEffect, useState } from 'react';
import { LandingPage } from './features/landing/LandingPage';
import { ChatPage, borrarHilo } from './features/chat/ChatPage';
import { Registro, datosGuardados } from './features/registro/Registro';
import { useRuta } from './lib/rutas';
import type { DatosPersona } from './types';

const CLAVE_PRESEL = 'resiliencia.preseleccion';

export default function App() {
  const [ruta, ir] = useRuta();
  const [datos, setDatos] = useState<DatosPersona | undefined>(
    () => datosGuardados() ?? undefined,
  );

  // Lo que marcó en la landing sobrevive a un F5: entra preseleccionado en la
  // primera pantalla del registro.
  const [preseleccion, setPreseleccion] = useState<string[]>(() => {
    try {
      return JSON.parse(sessionStorage.getItem(CLAVE_PRESEL) ?? '[]') as string[];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(CLAVE_PRESEL, JSON.stringify(preseleccion));
    } catch {
      /* almacenamiento bloqueado */
    }
  }, [preseleccion]);

  // Entrar a /chat sin haberse registrado manda al registro, no a una pantalla
  // rota. Y entrar a /registro ya registrado no obliga a repetirlo.
  useEffect(() => {
    if (ruta === '/chat' && !datos) ir('/registro');
    if (ruta === '/registro' && datos) ir('/chat');
  }, [ruta, datos, ir]);

  if (ruta === '/registro') {
    return (
      <Registro
        preseleccion={preseleccion}
        onListo={(d) => {
          // Datos nuevos, respuesta nueva: si quedara el hilo anterior, la
          // persona vería el caso de antes con las respuestas de ahora.
          borrarHilo();
          setDatos(d);
          ir('/chat');
        }}
      />
    );
  }

  if (ruta === '/chat' && datos) {
    return <ChatPage datos={datos} />;
  }

  return (
    <LandingPage
      onEntrar={(ids) => {
        setPreseleccion(ids ?? []);
        ir(datos ? '/chat' : '/registro');
      }}
    />
  );
}
