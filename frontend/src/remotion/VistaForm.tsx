import '../index.css';
import '../features/registro/css/registro.css';
import { useLayoutEffect } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Registro } from '../features/registro/Registro';
import { Soportes } from '../features/registro/components/Soportes';

/**
 * Vistas de revisión del formulario. No entran en ningún video.
 *
 * El wizard no expone en qué paso arranca —y no tiene por qué hacerlo solo
 * para que yo pueda mirarlo—, así que acá se avanza tocando los mismos botones
 * que tocaría una persona.
 */
export function VistaForm() {
  const f = useCurrentFrame();

  useLayoutEffect(() => {
    for (let i = 0; i < f; i++) {
      const eleccion = document.querySelector<HTMLButtonElement>('.rg-eleccion');
      const seguir = document.querySelector<HTMLButtonElement>('.rg-btn--principal');
      (eleccion ?? seguir)?.click();
    }
  });

  return (
    <AbsoluteFill style={{ background: '#f8faf9' }}>
      <style>{`*{animation:none!important;transition:none!important}`}</style>
      <Registro key={f} onListo={() => {}} preseleccion={['vivienda', 'alojamiento', 'documentos']} />
    </AbsoluteFill>
  );
}

/** La pantalla de soportes, con y sin archivos puestos. */
export function VistaSoportes() {
  return (
    <AbsoluteFill style={{ background: '#f8faf9', padding: 40 }}>
      <style>{`*{animation:none!important;transition:none!important}`}</style>
      <div className="rg">
        <div className="rg-caja">
        <div className="rg-cuerpo">
          <h1 className="rg-pregunta">Sube lo que tengas</h1>
          <p className="rg-ayuda">
            Con soportes el reclamo pesa. Lo que falte lo puedes subir después: no frena
            nada.
          </p>
          <Soportes
            situaciones={['vivienda', 'alojamiento', 'documentos']}
            subidos={{
              'foto-dano': {
                nombre: 'Fotos del daño',
                archivo: 'IMG_2841.jpg',
                url: '',
                esImagen: false,
              },
            }}
            onAdjuntar={() => {}}
            onQuitar={() => {}}
          />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
