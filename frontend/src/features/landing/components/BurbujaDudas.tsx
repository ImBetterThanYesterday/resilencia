import { useEffect, useRef, useState } from 'react';
import { ErrorAgente, idSesion, preguntar } from '../../../lib/agente';
import { dictar, hayDictado } from '../../../lib/voz';
import { IconChat, IconMic, IconSend, IconStop, IconX } from '../../../components/icons';
import { MarcaR } from '../../../components/Marca';

/**
 * El agente de dudas de la landing.
 *
 * Separado del chat del producto a propósito. El de /chat trabaja sobre un caso
 * ya levantado —tiene los datos, las ayudas y el escrito— y responde con
 * bloques. Este contesta lo de antes de empezar: si esto es gratis, si sirve
 * para el municipio de uno, qué papeles hay que tener a mano. Meter las dos
 * cosas en un componente obligaba a que el de la landing arrastrara un caso
 * que todavía no existe.
 *
 * Por eso también es texto plano y no bloques: acá nadie está redactando nada.
 */

const CLAVE_HILO = 'resilencia.dudas.hilo';
const MAX_GUARDADO = 40;

interface Turno {
  autor: 'persona' | 'agente';
  texto: string;
}

const BIENVENIDA: Turno = {
  autor: 'agente',
  texto:
    '¿Tienes dudas? Pregúntame lo que sea sobre las ayudas por el terremoto: si te corresponden, qué papeles necesitas o cómo se piden.',
};

const EJEMPLOS = [
  '¿Esto tiene algún costo?',
  '¿Qué papeles necesito?',
  'No me han visitado la casa',
];

function hiloGuardado(): Turno[] {
  try {
    const crudo = sessionStorage.getItem(CLAVE_HILO);
    const dato = crudo ? (JSON.parse(crudo) as Turno[]) : null;
    return Array.isArray(dato) && dato.length ? dato : [BIENVENIDA];
  } catch {
    return [BIENVENIDA];
  }
}

export function BurbujaDudas() {
  const [abierto, setAbierto] = useState(false);
  const [turnos, setTurnos] = useState<Turno[]>(hiloGuardado);
  const [texto, setTexto] = useState('');
  const [pensando, setPensando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [grabando, setGrabando] = useState(false);

  const finRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const detenerRef = useRef<(() => void) | null>(null);
  const sesion = useRef(idSesion());

  const puedeDictar = hayDictado();

  useEffect(() => {
    if (abierto) finRef.current?.scrollIntoView({ block: 'end' });
  }, [turnos, pensando, abierto]);

  useEffect(() => {
    try {
      sessionStorage.setItem(CLAVE_HILO, JSON.stringify(turnos.slice(-MAX_GUARDADO)));
    } catch {
      /* almacenamiento bloqueado: el hilo vive en memoria */
    }
  }, [turnos]);

  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [abierto]);

  // El textarea crece con el contenido hasta un tope, como el del chat grande.
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 96) + 'px';
  }, [texto]);

  // Cortar el micrófono si el componente se va con la grabación viva.
  useEffect(() => () => detenerRef.current?.(), []);

  function alternarDictado() {
    if (grabando) {
      detenerRef.current?.();
      return;
    }
    const detener = dictar({
      alTranscribir: setTexto,
      alTerminar: () => {
        setGrabando(false);
        detenerRef.current = null;
        areaRef.current?.focus();
      },
    });
    if (!detener) return;
    detenerRef.current = detener;
    setGrabando(true);
  }

  async function enviar(entrada?: string) {
    const pregunta = (entrada ?? texto).trim();
    if (!pregunta || pensando) return;

    detenerRef.current?.();
    setTexto('');
    setError(null);
    setTurnos((prev) => [...prev, { autor: 'persona', texto: pregunta }]);
    setPensando(true);

    try {
      const respuesta = await preguntar(pregunta, sesion.current);
      setTurnos((prev) => [...prev, { autor: 'agente', texto: respuesta }]);
    } catch (e) {
      setError(
        e instanceof ErrorAgente
          ? e.message
          : 'Algo falló al consultar. Inténtalo de nuevo.',
      );
    } finally {
      setPensando(false);
    }
  }

  function abrir() {
    setAbierto(true);
    setTimeout(() => areaRef.current?.focus(), 260);
  }

  const sugerencias = turnos.length <= 1 && !pensando ? EJEMPLOS : [];

  return (
    <>
      <button
        type="button"
        className={`ld-burbuja ${abierto ? 'ld-burbuja--oculta' : ''}`}
        onClick={abrir}
        aria-label="Abrir el asistente de dudas"
      >
        <IconChat size={22} />
        <span className="ld-burbuja__texto">¿Tienes dudas?</span>
      </button>

      {abierto && (
        <section className="ld-dudas" role="dialog" aria-label="Asistente de dudas">
          <header className="ld-dudas__cab">
            <MarcaR size={30} />
            <div className="ld-dudas__quien">
              <p className="ld-dudas__nombre">Resilencia</p>
              <p className="ld-dudas__estado">Te respondo al instante</p>
            </div>
            <button
              type="button"
              className="ld-dudas__cerrar"
              onClick={() => setAbierto(false)}
              aria-label="Cerrar el asistente"
            >
              <IconX size={16} />
            </button>
          </header>

          <div className="ld-dudas__hilo">
            {turnos.map((t, i) => (
              <p key={i} className={`ld-dudas__msg ld-dudas__msg--${t.autor}`}>
                {t.texto}
              </p>
            ))}

            {pensando && (
              <p className="ld-dudas__msg ld-dudas__msg--agente ld-dudas__msg--pensando">
                <span />
                <span />
                <span />
              </p>
            )}

            {error && <p className="ld-dudas__error">{error}</p>}

            <div ref={finRef} />
          </div>

          {sugerencias.length > 0 && (
            <div className="ld-dudas__ejemplos">
              {sugerencias.map((s) => (
                <button key={s} type="button" onClick={() => enviar(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className={`ld-dudas__caja ${grabando ? 'ld-dudas__caja--grabando' : ''}`}>
            <textarea
              ref={areaRef}
              rows={1}
              className="ld-dudas__area"
              value={texto}
              placeholder={grabando ? 'Te escucho…' : 'Escribe tu duda o dila en voz alta…'}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void enviar();
                }
              }}
            />

            {puedeDictar && (
              <button
                type="button"
                className={`ld-dudas__icono ${grabando ? 'ld-dudas__icono--rec' : ''}`}
                onClick={alternarDictado}
                disabled={pensando}
                aria-label={grabando ? 'Detener el dictado' : 'Dictar por voz'}
              >
                {grabando ? <IconStop size={17} /> : <IconMic size={18} />}
              </button>
            )}

            <button
              type="button"
              className="ld-dudas__icono ld-dudas__icono--enviar"
              onClick={() => void enviar()}
              disabled={!texto.trim() || pensando}
              aria-label="Enviar"
            >
              <IconSend size={18} />
            </button>
          </div>

          <p className="ld-dudas__legal">
            Resilencia orienta y redacta documentos; no presta asesoría jurídica.
          </p>
        </section>
      )}
    </>
  );
}
