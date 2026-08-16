import { useEffect, useRef, useState } from 'react';
import type { Adjunto, Bloque, DatosPersona, Mensaje } from '../../types';
import { SUGERENCIAS, aperturaPara, seguimiento } from '../../data/respuesta';
import { RenderBloque } from './components/Bloques';
import { Composer } from './components/Composer';
import { MarcaR } from '../../components/Marca';
import './css/chat.css';

/* Versionado a propósito: un hilo guardado por una versión anterior de la app
 * describe un flujo que ya no existe, y al restaurarlo reaparecían preguntas
 * y botones que hoy no tienen a dónde llevar. Al subir la versión, el hilo
 * viejo se ignora y se genera la respuesta con las reglas de ahora. */
export const CLAVE_HILO = 'resiliencia.hilo.v2';

/** Se limpia al terminar el formulario: datos nuevos, respuesta nueva. */
export function borrarHilo() {
  try {
    sessionStorage.removeItem(CLAVE_HILO);
    sessionStorage.removeItem('resiliencia.hilo');
  } catch {
    /* almacenamiento bloqueado */
  }
}

/** Los adjuntos son object URLs: mueren al recargar, así que no se guardan. */
function serializable(ms: Mensaje[]): Mensaje[] {
  return ms.map((m) => ({
    ...m,
    bloques: m.bloques.filter((b) => b.tipo !== 'adjuntos'),
  }));
}

function hiloGuardado(): Mensaje[] | null {
  try {
    const crudo = sessionStorage.getItem(CLAVE_HILO);
    if (!crudo) return null;
    const dato = JSON.parse(crudo) as Mensaje[];
    return Array.isArray(dato) && dato.length ? dato : null;
  } catch {
    return null;
  }
}

/** Lo que la persona ya dijo. Una sugerencia usada no se vuelve a ofrecer. */
function yaDichas(mensajes: Mensaje[]): Set<string> {
  return new Set(
    mensajes
      .filter((m) => m.autor === 'usuario')
      .flatMap((m) => m.bloques.map((b) => (b.tipo === 'texto' ? b.texto : ''))),
  );
}

const hora = () =>
  new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

let contador = 0;
const nuevoId = () => `m${++contador}`;

interface Props {
  /** Todo llega del formulario: situaciones, trámite, datos y soportes. */
  datos?: DatosPersona;
}

/**
 * El chat.
 *
 * Ya no es un asistente que va preguntando: todo se preguntó en el formulario,
 * así que abre con el caso resuelto —las ayudas que sí le corresponden, el
 * documento redactado y los pasos que le tocan— y a partir de ahí queda para
 * lo que la persona quiera preguntar.
 */
export function ChatPage({ datos }: Props) {
  // La conversación sobrevive a un F5. Perder el hilo a mitad de trámite —y
  // tener que volver a contar que se te cayó la casa— es inaceptable.
  const [mensajes, setMensajes] = useState<Mensaje[]>(() => {
    const guardado = hiloGuardado();
    if (guardado?.length) return guardado;
    return datos
      ? [{ id: nuevoId(), autor: 'asistente', bloques: aperturaPara(datos), hora: hora() }]
      : [];
  });
  const [pensando, setPensando] = useState(false);

  // Se derivan del hilo, no de un contador: así sobreviven a un F5 y no
  // reaparece un botón que la persona ya usó.
  const dichas = yaDichas(mensajes);
  const sugerencias = SUGERENCIAS.filter((s) => !dichas.has(s));

  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [mensajes, pensando]);

  useEffect(() => {
    if (pensando) return; // no guardamos a mitad de una respuesta
    try {
      sessionStorage.setItem(CLAVE_HILO, JSON.stringify(serializable(mensajes)));
    } catch {
      /* almacenamiento bloqueado: seguimos sin persistir */
    }
  }, [mensajes, pensando]);

  function enviar(texto: string, adjuntos: Adjunto[] = []) {
    const bloques: Bloque[] = [];
    if (adjuntos.length) bloques.push({ tipo: 'adjuntos', items: adjuntos });
    if (texto) bloques.push({ tipo: 'texto', texto });

    setMensajes((prev) => [
      ...prev,
      { id: nuevoId(), autor: 'usuario', bloques, hora: hora() },
    ]);
    setPensando(true);

    // TODO: reemplazar por POST /api/chat { casoId, mensaje } → Bloque[]
    const respuesta = seguimiento(texto);
    setTimeout(() => {
      setMensajes((prev) => [
        ...prev,
        { id: nuevoId(), autor: 'asistente', bloques: respuesta, hora: hora() },
      ]);
      setPensando(false);
    }, 850);
  }

  return (
    <div className="rd-app">
      <main className="rd-scroll">
        <div className="rd-hilo">
          {mensajes.map((m) => (
            <div key={m.id} className={`rd-msg rd-msg--${m.autor}`}>
              {m.autor === 'asistente' && (
                <span className="rd-msg__avatar">
                  <MarcaR size={26} />
                </span>
              )}
              <div className="rd-msg__cuerpo">
                {m.bloques.map((b, i) => (
                  <RenderBloque key={i} bloque={b} datos={datos} />
                ))}
              </div>
            </div>
          ))}

          {pensando && (
            <div className="rd-msg rd-msg--asistente">
              <span className="rd-msg__avatar">
                <MarcaR size={26} />
              </span>
              <div className="rd-msg__cuerpo">
                <div className="rd-puntos">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          )}

          <div ref={finRef} />
        </div>
      </main>

      <footer className="rd-footer">
        <Composer
          sugerencias={pensando ? [] : sugerencias}
          pensando={pensando}
          onEnviar={enviar}
          textoDemoAudio={sugerencias[0]}
        />
      </footer>
    </div>
  );
}
