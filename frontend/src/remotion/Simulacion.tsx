import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { MarcaR } from '../components/Marca';

/* ─────────────────────────────────────────────────────────────────────────────
 *  Simulación · 1080×1920 · 20 s
 *
 *  Esto NO monta la app: la dibuja. La versión anterior filmaba los componentes
 *  reales y los empujaba por el DOM —storage sembrado, scrollTop a mano,
 *  animaciones congeladas, remontajes— y en un renderizador que salta de cuadro
 *  en cuadro eso se rompe de maneras que no se ven hasta que ya están en el
 *  video. Acá todo sale de useCurrentFrame(): mismo cuadro, mismo resultado,
 *  siempre. Los colores, la tipografía y el ritmo son los del producto.
 * ────────────────────────────────────────────────────────────────────────── */

const AZUL = '#1E3A5F';
const VERDE = '#2E8B72';
const LIENZO = '#F8FAF9';
const TINTA = '#1E3A5F';
const TINTA2 = '#55677A';
const TINTA3 = '#8D9DAA';
const LINEA = '#DDE6E2';

const SORA = 'Sora, system-ui, sans-serif';
const MONO = '"IBM Plex Mono", ui-monospace, monospace';
const SERIF = '"Source Serif 4", Georgia, serif';

/** Teléfono real: la maqueta usa el mismo ancho en el que se va a usar. */
const ANCHO = 404;
const ALTO = 718;
const ESCALA = 1080 / ANCHO;
const PIE = 124;

const suave = (t: number) => 1 - Math.pow(1 - t, 3);
/** Arranca y frena suave. Para el alto de un bloque: con ease-out el empujón
 *  sale de golpe y la columna se ve dando tirones. */
const fluido = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const rampa = (f: number, a: number, b: number) =>
  Math.max(0, Math.min(1, (f - a) / Math.max(1, b - a)));

/* ── Piezas del hilo ───────────────────────────────────────────────────────*/

const Parrafo = ({ children, color = TINTA2 }: { children: React.ReactNode; color?: string }) => (
  <p style={{ margin: 0, fontFamily: SORA, fontSize: 14.5, lineHeight: 1.6, color }}>{children}</p>
);

function Ayuda({ nombre, valor }: { nombre: string; valor: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 14,
        padding: '9px 0',
        borderBottom: `1px solid #EBF0ED`,
      }}
    >
      <span style={{ fontFamily: SORA, fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em', color: TINTA }}>
        {nombre}
      </span>
      <span style={{ fontFamily: MONO, fontSize: 10.5, color: TINTA3, whiteSpace: 'nowrap' }}>
        {valor}
      </span>
    </div>
  );
}

/**
 * Indicador de archivo.
 *
 * El primer documento no necesita mostrarse entero: lo que tiene que quedar
 * claro en dos segundos es que existe, que es un derecho de petición y que se
 * puede descargar. La tarjeta completa se guarda para la tutela, que es el
 * remate.
 */
function Archivo({ titulo, nombre, t }: { titulo: string; nombre: string; t: number }) {
  return (
    <div
      style={{
        background: '#fff',
        border: `1px solid ${LINEA}`,
        borderRadius: 12,
        padding: 15,
        opacity: t,
        transform: `translateY(${(1 - t) * 10}px)`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
        <span
          style={{
            width: 42,
            height: 50,
            flex: '0 0 auto',
            borderRadius: 5,
            background: AZUL,
            color: '#fff',
            fontFamily: MONO,
            fontSize: 11,
            letterSpacing: '0.06em',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          PDF
        </span>
        <span style={{ minWidth: 0 }}>
          <span
            style={{
              display: 'block',
              fontFamily: SORA,
              fontSize: 19,
              fontWeight: 600,
              letterSpacing: '-0.03em',
              color: TINTA,
              lineHeight: 1.2,
            }}
          >
            {titulo}
          </span>
          <span
            style={{
              display: 'block',
              fontFamily: MONO,
              fontSize: 10,
              color: TINTA3,
              marginTop: 4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {nombre}
          </span>
        </span>
      </div>

      <div
        style={{
          marginTop: 13,
          background: AZUL,
          color: '#fff',
          fontFamily: SORA,
          fontSize: 13,
          fontWeight: 600,
          textAlign: 'center',
          padding: '11px 0',
          borderRadius: 8,
        }}
      >
        Descargar PDF
      </div>
    </div>
  );
}

/** El papel. El cuerpo se escribe solo: es el momento que hay que ver. */
function Papel({
  etiqueta,
  titulo,
  para,
  cuerpo,
  normas,
  escrito,
  acento = AZUL,
}: {
  etiqueta: string;
  titulo: string;
  para: string;
  cuerpo: string;
  normas: string[];
  escrito: number;
  acento?: string;
}) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${LINEA}`, borderRadius: 2 }}>
      <div style={{ background: acento, padding: '13px 16px' }}>
        <div style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: '0.14em', color: '#8FD3BE' }}>
          {etiqueta}
        </div>
        <div
          style={{
            fontFamily: SORA,
            fontSize: 14,
            fontWeight: 600,
            lineHeight: 1.3,
            color: '#fff',
            margin: '5px 0 7px',
          }}
        >
          {titulo}
        </div>
        <div style={{ fontFamily: MONO, fontSize: 9.5, color: 'rgba(255,255,255,0.62)' }}>
          {para}
        </div>
      </div>

      <div style={{ padding: '14px 16px 10px' }}>
        <p
          style={{
            margin: 0,
            fontFamily: SERIF,
            fontSize: 14,
            lineHeight: 1.62,
            color: '#22333F',
            minHeight: 70,
          }}
        >
          {cuerpo.slice(0, Math.round(escrito * cuerpo.length))}
          <span style={{ opacity: escrito < 1 ? 1 : 0, color: VERDE }}>▍</span>
        </p>
      </div>

      <div style={{ padding: '0 16px 14px', borderTop: `1px dashed ${LINEA}`, paddingTop: 10 }}>
        {normas.map((n) => (
          <div key={n} style={{ fontFamily: MONO, fontSize: 9, color: TINTA3, lineHeight: 1.7 }}>
            {n}
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <div
            style={{
              background: AZUL,
              color: '#fff',
              fontFamily: SORA,
              fontSize: 11.5,
              fontWeight: 600,
              padding: '9px 14px',
              borderRadius: 2,
            }}
          >
            Descargar PDF
          </div>
          <div
            style={{
              border: `1px solid ${LINEA}`,
              color: TINTA,
              fontFamily: SORA,
              fontSize: 11.5,
              fontWeight: 600,
              padding: '9px 14px',
              borderRadius: 2,
            }}
          >
            Revisar y editar
          </div>
        </div>
      </div>
    </div>
  );
}

const Burbuja = ({ texto }: { texto: string }) => (
  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
    <div
      style={{
        background: AZUL,
        color: '#fff',
        fontFamily: SORA,
        fontSize: 14,
        padding: '10px 15px',
        borderRadius: 16,
        maxWidth: '78%',
      }}
    >
      {texto}
    </div>
  </div>
);

function Puntos({ f }: { f: number }) {
  const ciclo = 34.5;
  return (
    <div style={{ display: 'flex', gap: 5, padding: '9px 0' }}>
      {[0, 1, 2].map((i) => {
        const t = ((((f - i * 4.2) % ciclo) + ciclo) % ciclo) / ciclo;
        const k = t < 0.31 ? t / 0.31 : t < 0.62 ? 1 - (t - 0.31) / 0.31 : 0;
        return (
          <span
            key={i}
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: VERDE,
              opacity: 0.22 + k * 0.78,
              transform: `translateY(${-3 * k}px)`,
            }}
          />
        );
      })}
    </div>
  );
}

/* ── El guion, cuadro a cuadro ─────────────────────────────────────────────*/

interface Bloque {
  id: string;
  /** Alto relativo por cuadro, si el bloque crece de otra manera. */
  crece?: (f: number) => number;
  /** Cuadro en el que aparece. */
  desde: number;
  /** Cuánto tarda en entrar. Cuanto más largo, más suave el empujón. */
  dur: number;
  /** Cuadro en el que se va, si se va. */
  hasta?: number;
  /** Alto reservado. Explícito a propósito: el apilado es aritmética, no
   *  medición del DOM — que es lo que se rompía al saltar de cuadro. */
  alto: number;
  /** `t` es el progreso de entrada, para escalonar lo de adentro. */
  nodo: (f: number, t: number) => React.ReactNode;
}

/* Cortos a propósito. Un párrafo de lenguaje jurídico no se lee en dos
 * segundos y tampoco hace falta: lo que tiene que quedar claro es que el
 * documento existe, dice quién es la persona y qué está pidiendo. */
const TUTELA =
  'Transcurridos 15 días hábiles, la entidad no ha dado respuesta alguna.';

const ALTO_FILA = 44;

const AYUDAS: [string, string][] = [
  ['Reposición de documentos', 'Sin costo'],
  ['Copia del dictamen', 'Alcaldía'],
  ['Apoyo de arriendo', 'Mensual'],
  ['Subsidio de vivienda', 'Minvivienda'],
];

const PREGUNTA = '¿Y si no me responden?';
const F_ESCRIBE = 200;
const F_ENVIA = 248;
const F_PUNTOS = 258;
const F_RESPUESTA = 296;

const Avatar = () => (
  <div style={{ marginBottom: 8 }}>
    <MarcaR size={24} />
  </div>
);

/** Cuándo entra cada ayuda. Rápido y una detrás de otra. */
const AYUDA_DESDE = 18;
const AYUDA_PASO = 8;
const AYUDA_DUR = 7;
const filaT = (f: number, i: number) =>
  suave(rampa(f, AYUDA_DESDE + i * AYUDA_PASO, AYUDA_DESDE + i * AYUDA_PASO + AYUDA_DUR));

/**
 * Las ayudas entran de a una, rápido.
 *
 * El alto del bloque es la suma de lo que ocupa cada fila, así que la columna
 * crece al mismo ritmo al que aparecen: se ve caer una lista, no un bloque
 * inflándose con el texto adentro.
 */
function Ayudas({ f }: { f: number }) {
  return (
    <div>
      {AYUDAS.map(([nombre, valor], i) => {
        const t = filaT(f, i);
        return (
          <div
            key={nombre}
            style={{
              height: ALTO_FILA * t,
              overflow: 'hidden',
              opacity: t,
              transform: `translateY(${(1 - t) * 8}px)`,
            }}
          >
            <Ayuda nombre={nombre} valor={valor} />
          </div>
        );
      })}
    </div>
  );
}

const GUION: Bloque[] = [
  {
    id: 'intro',
    desde: 0,
    dur: 14,
    alto: 66,
    nodo: () => (
      <>
        <Avatar />
        <Parrafo>Luz, esto es lo que te corresponde:</Parrafo>
      </>
    ),
  },
  {
    id: 'ayudas',
    desde: AYUDA_DESDE,
    dur: AYUDA_PASO * AYUDAS.length,
    alto: ALTO_FILA * AYUDAS.length,
    crece: (f) => AYUDAS.reduce((a, _, i) => a + filaT(f, i), 0) / AYUDAS.length,
    nodo: (f) => <Ayudas f={f} />,
  },
  // Pausa de 40 cuadros: cuatro renglones se leen, pero no si al segundo
  // siguiente ya entró otra cosa empujándolos hacia arriba.
  {
    id: 'peticion',
    desde: 120,
    dur: 16,
    alto: 138,
    nodo: (_f, t) => (
      <Archivo
        titulo="Derecho de petición"
        nombre="copia-del-dictamen-quibdo.pdf"
        t={t}
      />
    ),
  },
  {
    id: 'pregunta',
    desde: F_ENVIA + 4,
    dur: 12,
    alto: 54,
    nodo: () => <Burbuja texto={PREGUNTA} />,
  },
  {
    id: 'puntos',
    desde: F_PUNTOS,
    hasta: F_RESPUESTA,
    dur: 10,
    alto: 58,
    nodo: (f) => (
      <>
        <Avatar />
        <Puntos f={f - F_PUNTOS} />
      </>
    ),
  },
  {
    id: 'respuesta',
    desde: F_RESPUESTA,
    dur: 28,
    alto: 384,
    /* La segunda respuesta tiene la misma forma que la primera: dos renglones
     * y un documento. Antes era un recuadro con regla roja, una cifra enorme y
     * una etiqueta verde al costado — un tablero metido en una conversación, y
     * encima con un rojo que no existe en la paleta. */
    nodo: () => (
      <>
        <Avatar />
        <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.08em', color: TINTA3, marginBottom: 7 }}>
          VENCIÓ EL 5 DE SEPTIEMBRE · SIN RESPUESTA
        </div>
        <Parrafo>
          Pasaron los 15 días hábiles y no respondieron. Ese silencio ya es la violación:{' '}
          <strong style={{ color: TINTA }}>te dejo la tutela lista</strong>.
        </Parrafo>
        <div style={{ height: 14 }} />
        <Papel
          etiqueta="ACCIÓN DE TUTELA"
          titulo="Derecho de petición y vivienda digna"
          para="Juez de reparto — Quibdó, Chocó"
          cuerpo={TUTELA}
          normas={['Art. 86 C.P. — acción de tutela', 'Decreto 2591 de 1991 — trámite']}
          escrito={1}
        />
      </>
    ),
  },
];

/* ── El teléfono ───────────────────────────────────────────────────────────*/

const CHIPS = ['Ya lo radiqué', '¿Cómo lo radico?', '¿Y si no me responden?'];

const IconoClip = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={TINTA2} strokeWidth="1.8" strokeLinecap="round">
    <path d="M20 11.5 12.3 19a4.6 4.6 0 0 1-6.5-6.5l7.9-7.9a3 3 0 0 1 4.3 4.3l-7.8 7.9a1.5 1.5 0 0 1-2.2-2.1l7.1-7.2" />
  </svg>
);

const IconoMic = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={TINTA2} strokeWidth="1.8" strokeLinecap="round">
    <rect x="9" y="2" width="6" height="12" rx="3" />
    <path d="M5 10a7 7 0 0 0 14 0M12 17v5" />
  </svg>
);

function Telefono() {
  const f = useCurrentFrame();

  const escrito =
    f >= F_ESCRIBE && f < F_ENVIA
      ? PREGUNTA.slice(0, Math.round(rampa(f, F_ESCRIBE, F_ENVIA - 10) * PREGUNTA.length))
      : '';
  const escribiendo = escrito.length > 0;
  const cursor = Math.floor(f / 8) % 2 === 0;

  // El hilo se ancla abajo: lo que entra empuja a lo de arriba, que es lo que
  // hace un chat. Sin scrollTop, sin medir nada, y con el alto creciendo parejo
  // para que el empujón no se sienta como un tirón.
  const vivos = GUION.map((b) => {
    const entra = b.crece ? b.crece(f) : fluido(rampa(f, b.desde, b.desde + b.dur));
    const sale = b.hasta ? 1 - fluido(rampa(f, b.hasta, b.hasta + 9)) : 1;
    return {
      ...b,
      v: Math.min(entra, sale),
      // Las filas manejan su propia opacidad; el bloque no debe atenuarlas.
      o: b.crece ? Math.min(1, sale) : Math.min(entra, sale),
      t: suave(rampa(f, b.desde, b.desde + b.dur)),
    };
  }).filter((b) => b.v > 0.001);

  return (
    <div
      style={{
        position: 'absolute',
        width: ANCHO,
        height: ALTO,
        transform: `scale(${ESCALA})`,
        transformOrigin: '0 0',
        background: LIENZO,
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', inset: `0 0 ${PIE}px 0`, overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            left: 20,
            right: 20,
            bottom: 14,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {vivos.map((b) => (
            <div key={b.id} style={{ height: b.alto * b.v, overflow: 'hidden', opacity: b.o }}>
              {b.nodo(f, b.t)}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: PIE,
          background: LIENZO,
          padding: '10px 20px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', gap: 6, marginBottom: 9 }}>
          {CHIPS.map((s) => (
            <span
              key={s}
              style={{
                background: '#EDF1F6',
                color: TINTA,
                fontFamily: SORA,
                fontSize: 10.5,
                padding: '6px 10px',
                borderRadius: 999,
                whiteSpace: 'nowrap',
              }}
            >
              {s}
            </span>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            background: '#fff',
            border: `1px solid ${LINEA}`,
            borderRadius: 999,
            padding: '10px 8px 10px 16px',
          }}
        >
          <span
            style={{
              flex: 1,
              fontFamily: SORA,
              fontSize: 13,
              color: escribiendo ? TINTA : TINTA3,
              whiteSpace: 'nowrap',
            }}
          >
            {escribiendo ? escrito : 'Escribe, manda un audio o sube una foto…'}
            {escribiendo && cursor && <span style={{ color: VERDE }}>|</span>}
          </span>
          <IconoClip />
          <IconoMic />
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: escribiendo ? AZUL : '#EDF1F6',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 12 20 4l-8 16-2-7-6-1Z"
                stroke={escribiendo ? '#fff' : TINTA3}
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>

        <div
          style={{
            fontFamily: SORA,
            fontSize: 8,
            lineHeight: 1.45,
            color: TINTA3,
            textAlign: 'center',
            marginTop: 7,
          }}
        >
          Resiliencia redacta documentos; no presta asesoría jurídica ni reemplaza a un abogado.
          Revisa todo antes de radicarlo.
        </div>
      </div>
    </div>
  );
}

export function Escena() {
  return (
    <AbsoluteFill style={{ background: LIENZO }}>
      <Telefono />
    </AbsoluteFill>
  );
}

/* ── El formulario ─────────────────────────────────────────────────────────
 * Es la puerta de entrada: acá se pregunta todo —qué pasó, cómo va el trámite,
 * los datos y los soportes— para que el asistente pueda abrir con el caso ya
 * resuelto. Sin esto el video empezaba por el final.
 * ────────────────────────────────────────────────────────────────────────── */

const SITUACIONES: [string, string][] = [
  ['Mi casa quedó dañada', 'Arriendo y subsidio de vivienda'],
  ['No tengo dónde quedarme', 'Alojamiento temporal'],
  ['Me quedé sin mis cosas', 'Mercado, colchones, cocina'],
  ['Se me perdieron los documentos', 'Cédula sin costo'],
  ['Me quedé sin trabajo o sin negocio', 'Apoyo económico'],
];

const NOMBRE = 'Luz Marina Rentería';

const Marca = ({ on }: { on: boolean }) => (
  <span
    style={{
      width: 17,
      height: 17,
      flex: '0 0 auto',
      marginTop: 2,
      borderRadius: 4,
      border: `1px solid ${on ? VERDE : LINEA}`,
      background: on ? VERDE : '#fff',
      display: 'grid',
      placeItems: 'center',
    }}
  >
    {on && (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
        <path d="m5 12.5 4.5 4.5L19 7" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" />
      </svg>
    )}
  </span>
);

function Pantalla({
  paso,
  total,
  pregunta,
  ayuda,
  boton,
  children,
}: {
  paso: number;
  total: number;
  pregunta: string;
  ayuda: string;
  boton: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <MarcaR size={22} />
        <span style={{ fontFamily: MONO, fontSize: 10, color: TINTA3 }}>
          {paso} de {total}
        </span>
      </div>

      <div style={{ height: 2, background: LINEA, margin: '12px 0 26px' }}>
        <div style={{ height: '100%', width: `${(paso / total) * 100}%`, background: VERDE }} />
      </div>

      <div
        style={{
          fontFamily: SORA,
          fontSize: 25,
          fontWeight: 600,
          letterSpacing: '-0.03em',
          color: TINTA,
          lineHeight: 1.18,
        }}
      >
        {pregunta}
      </div>
      <div
        style={{
          fontFamily: SORA,
          fontSize: 12.5,
          lineHeight: 1.5,
          color: TINTA2,
          margin: '9px 0 22px',
        }}
      >
        {ayuda}
      </div>

      {children}

      <div
        style={{
          marginTop: 'auto',
          background: AZUL,
          color: '#fff',
          fontFamily: SORA,
          fontSize: 14,
          fontWeight: 600,
          textAlign: 'center',
          padding: '15px 0',
          borderRadius: 999,
        }}
      >
        {boton}
      </div>
      <div
        style={{
          fontFamily: SORA,
          fontSize: 12.5,
          fontWeight: 500,
          color: TINTA3,
          textAlign: 'center',
          marginTop: 12,
        }}
      >
        Atrás
      </div>
    </>
  );
}

/** Cuadros del formulario en los que pasa algo. */
const P2 = 54;
const P3 = 108;
const P4 = 162;

function Formulario() {
  const f = useCurrentFrame();
  const escrito = NOMBRE.slice(0, Math.round(rampa(f, P3 + 10, P4 - 12) * NOMBRE.length));
  const cursor = Math.floor(f / 8) % 2 === 0;

  const pantalla =
    f < P2 ? (
      <Pantalla
        paso={1}
        total={11}
        pregunta="¿Qué te pasó?"
        ayuda="Cada cosa abre un subsidio distinto. Marca todo lo que aplique."
        boton="Continuar"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          {SITUACIONES.map(([texto, abre], i) => {
            const on = i < 3 && f >= 12 + i * 11;
            return (
              <div key={texto} style={{ display: 'flex', gap: 11 }}>
                <Marca on={on} />
                <div>
                  <div
                    style={{
                      fontFamily: SORA,
                      fontSize: 13.5,
                      fontWeight: 500,
                      color: TINTA,
                      lineHeight: 1.35,
                    }}
                  >
                    {texto}
                  </div>
                  <div
                    style={{
                      fontFamily: MONO,
                      fontSize: 9.5,
                      color: on ? VERDE : TINTA3,
                      marginTop: 2,
                    }}
                  >
                    {abre}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Pantalla>
    ) : f < P3 ? (
      <Pantalla
        paso={2}
        total={11}
        pregunta="¿Ya fueron a evaluar tu casa?"
        ayuda="La visita del CMGRD es la que abre el arriendo y el subsidio de vivienda."
        boton="Continuar"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {[
            ['Sí, ya fueron', 'Vinieron a revisar los daños'],
            ['Todavía no', 'No ha ido nadie'],
          ].map(([t, n], i) => {
            const on = i === 0 && f >= P2 + 26;
            return (
              <div
                key={t}
                style={{
                  padding: '15px 16px',
                  border: `1px solid ${on ? VERDE : LINEA}`,
                  background: on ? '#E7F3EF' : '#fff',
                  borderRadius: 11,
                }}
              >
                <div style={{ fontFamily: SORA, fontSize: 14.5, fontWeight: 500, color: TINTA }}>
                  {t}
                </div>
                <div style={{ fontFamily: SORA, fontSize: 11.5, color: TINTA2, marginTop: 2 }}>
                  {n}
                </div>
              </div>
            );
          })}
        </div>
      </Pantalla>
    ) : f < P4 ? (
      <Pantalla
        paso={4}
        total={11}
        pregunta="¿Cómo te llamas?"
        ayuda="Como aparece en tu documento. Va a encabezar tus solicitudes."
        boton="Continuar"
      >
        <div
          style={{
            borderBottom: `2px solid ${escrito ? VERDE : LINEA}`,
            paddingBottom: 9,
            fontFamily: SORA,
            fontSize: 20,
            color: TINTA,
            minHeight: 28,
          }}
        >
          {escrito}
          {escrito.length < NOMBRE.length && cursor && <span style={{ color: VERDE }}>|</span>}
        </div>
      </Pantalla>
    ) : (
      <Pantalla
        paso={10}
        total={11}
        pregunta="Sube lo que tengas"
        ayuda="Con soportes el reclamo pesa. Lo que falte lo subes después."
        boton="Continuar"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          {[
            ['Fotos del daño', 'Es la prueba de lo que pasó.'],
            ['Escritura o recibo de servicios', 'Prueba que la vivienda es tuya.'],
            ['Denuncia por pérdida de documentos', 'Habilita la reposición.'],
          ].map(([t, p], i) => {
            const on = i === 0 && f >= P4 + 18;
            return (
              <div key={t} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                <Marca on={on} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: SORA, fontSize: 13.5, fontWeight: 500, color: TINTA }}>
                    {t}
                  </div>
                  <div style={{ fontFamily: SORA, fontSize: 11.5, color: TINTA2, marginTop: 1 }}>
                    {p}
                  </div>
                </div>
                <span
                  style={{
                    fontFamily: SORA,
                    fontSize: 11,
                    fontWeight: 500,
                    color: on ? VERDE : TINTA,
                    border: `1px solid ${on ? VERDE : LINEA}`,
                    borderRadius: 999,
                    padding: '5px 11px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {on ? 'Listo' : 'Adjuntar'}
                </span>
              </div>
            );
          })}
        </div>
      </Pantalla>
    );

  // Cada pantalla entra desde la derecha: el formulario avanza, no parpadea.
  const corte = [0, P2, P3, P4].reduce((a, b) => (f >= b ? b : a), 0);
  const t = suave(rampa(f, corte, corte + 9));

  return (
    <div
      style={{
        position: 'absolute',
        width: ANCHO,
        height: ALTO,
        transform: `scale(${ESCALA})`,
        transformOrigin: '0 0',
        background: LIENZO,
        padding: 26,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        key={corte}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          opacity: t,
          transform: `translateX(${(1 - t) * 26}px)`,
        }}
      >
        {pantalla}
      </div>
    </div>
  );
}

export function EscenaForm() {
  return (
    <AbsoluteFill style={{ background: LIENZO }}>
      <Formulario />
    </AbsoluteFill>
  );
}
