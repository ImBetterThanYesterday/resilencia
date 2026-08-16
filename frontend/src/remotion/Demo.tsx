import '../index.css';
import { AbsoluteFill, Sequence } from 'remotion';
import { Cartel } from './piezas';
import { Escena, EscenaForm } from './Simulacion';

/* ─────────────────────────────────────────────────────────────────────────────
 *  Demo · 1080×1920 · 25 s
 *
 *  Producto simulado, no filmado: ver src/remotion/Simulacion.tsx.
 *
 *  El reparto sigue a lo que cuesta entender, no a lo que dura de bonito: el
 *  chat se lleva más de la mitad porque es donde pasa todo, y el formulario
 *  casi seis segundos porque son cuatro preguntas que hay que alcanzar a leer.
 *  No hay placa de cierre — el último cartel es el final.
 *
 *  Los carteles van al final del JSX para que el blanco quede encima y al
 *  retirarse destape la escena que ya corre debajo. Los ocho cuadros de solape
 *  en cada extremo son los de su entrada y su salida.
 * ────────────────────────────────────────────────────────────────────────── */

export function Demo() {
  return (
    <AbsoluteFill style={{ background: '#F8FAF9' }}>
      <Sequence from={44} durationInFrames={218}>
        <EscenaForm />
      </Sequence>

      <Sequence from={298} durationInFrames={400}>
        <Escena />
      </Sequence>

      <Sequence durationInFrames={52}>
        <Cartel lineas={['Se cayó tu casa.', 'Nadie te explicó nada.']} dur={52} />
      </Sequence>

      <Sequence from={254} durationInFrames={52}>
        <Cartel lineas={['Ocho preguntas.', 'Dos minutos.']} dur={52} />
      </Sequence>

      {/* El último no se retira: no hay nada detrás que destapar. */}
      <Sequence from={690} durationInFrames={60}>
        <Cartel
          lineas={['Sin abogado.', 'Sin plata.', 'Sin fila.']}
          dur={60}
          salidaF={0}
          origen={{ x: 540, y: 1500 }}
          firma
        />
      </Sequence>
    </AbsoluteFill>
  );
}
