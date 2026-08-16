import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { MarcaR } from '../components/Marca';

const salida = (t: number) => 1 - Math.pow(1 - t, 3);
const rampa = (f: number, a: number, b: number) =>
  Math.max(0, Math.min(1, (f - a) / Math.max(1, b - a)));

/**
 * Cartel: texto negro sobre blanco, a pantalla completa.
 *
 * Es lo único que se le suma al producto. Los globos y las etiquetas flotando
 * encima de la interfaz se quitaron: tapaban justo lo que había que mirar y
 * dejaban en evidencia que era un montaje, no un uso.
 *
 * Entra con el blanco creciendo desde un punto y sale subiendo, que destapa la
 * escena que ya está corriendo debajo — sin fundido, corte limpio.
 */
export function Cartel({
  lineas,
  dur,
  origen = { x: 540, y: 960 },
  entrada = 8,
  salidaF = 8,
  firma = false,
}: {
  lineas: string[];
  dur: number;
  origen?: { x: number; y: number };
  entrada?: number;
  salidaF?: number;
  /** Marca discreta bajo el texto, para el cartel que cierra el video. */
  firma?: boolean;
}) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  const radio = 40 + salida(rampa(f, 0, entrada)) * 2500;
  const sube = salida(rampa(f, dur - salidaF, dur));

  return (
    <AbsoluteFill
      style={{
        clipPath: `circle(${radio}px at ${origen.x}px ${origen.y}px)`,
        transform: `translateY(${-sube * 1920}px)`,
      }}
    >
      <AbsoluteFill
        style={{
          background: '#ffffff',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '0 86px',
        }}
      >
        <div>
          {lineas.map((l, i) => {
            // El cuerpo se ajusta a la línea más larga: con tamaño fijo una
            // frase de contexto se sale del cuadro por los dos lados.
            const largo = Math.max(...lineas.map((x) => x.length));
            const cuerpo = Math.min(104, Math.round(900 / (largo * 0.52)));
            const t = spring({
              frame: f - 2 - i * 3,
              fps,
              config: { damping: 200, mass: 0.65 },
            });
            return (
              <div key={i} style={{ overflow: 'hidden', padding: '0 0 4px' }}>
                <div
                  style={{
                    fontFamily: 'Sora, system-ui, sans-serif',
                    fontSize: cuerpo,
                    fontWeight: 700,
                    lineHeight: 1.06,
                    letterSpacing: '-0.058em',
                    color: i === lineas.length - 1 ? '#1E3A5F' : '#0d1620',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    transform: `translateY(${(1 - t) * (cuerpo + 24)}px)`,
                    opacity: t,
                  }}
                >
                  {l}
                </div>
              </div>
            );
          })}

          {firma && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                marginTop: 64,
                opacity: interpolate(f, [dur - 34, dur - 18], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                }),
              }}
            >
              <MarcaR size={44} />
              <span
                style={{
                  fontFamily: 'Sora, system-ui, sans-serif',
                  fontSize: 42,
                  fontWeight: 600,
                  letterSpacing: '-0.04em',
                  color: '#1E3A5F',
                }}
              >
                Resilencia
              </span>
            </div>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

/** Entrada de un mensaje: la misma curva del keyframe rd-entra, cuadro a cuadro. */
export function entrada(f: number, desde: number, dur = 13) {
  const t = salida(rampa(f, desde, desde + dur));
  return { opacity: t, transform: `translateY(${(1 - t) * 8}px)` };
}

/** Arranca y frena suave, pero sin arrastrarse en el medio. Para recorridos
 *  largos: con ease-out puro el final se vuelve un crawl y se ve pegado. */
export const parejo = (t: number) => t * t * (3 - 2 * t);

export { salida, rampa };
export { interpolate };
