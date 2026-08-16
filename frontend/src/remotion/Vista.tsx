import '../index.css';
import { AbsoluteFill } from 'remotion';
import { ChatPage } from '../features/chat/ChatPage';
import { DATOS_DEMO, M_CASO, sembrarHilo } from './semilla';

/**
 * Vista de revisión.
 *
 * No entra en ningún video: es para poder mirar la respuesta completa a tamaño
 * de teléfono, de una sola imagen, sin depender del navegador.
 */
const ANCHO = 404;
const ALTO = 3400;
const ESCALA = 620 / ANCHO;

export function Vista() {
  sembrarHilo(M_CASO);

  return (
    <AbsoluteFill style={{ background: '#F8FAF9' }}>
      <div
        style={{
          width: ANCHO,
          height: ALTO,
          transform: `scale(${ESCALA})`,
          transformOrigin: '0 0',
        }}
      >
        <style>{`.rd-app *{animation:none!important;transition:none!important}
                 .rd-app{height:100%!important}
                 .rd-scroll{overflow:visible!important}`}</style>
        <ChatPage key="v" datos={DATOS_DEMO} />
      </div>
    </AbsoluteFill>
  );
}
