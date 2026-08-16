/**
 * Dictado por voz, sin backend.
 *
 * La Web Speech API transcribe en el propio navegador. No es un lujo técnico:
 * mucha de la gente a la que esto va dirigido escribe con dificultad o está
 * respondiendo desde un celular con la casa a medio caer. Poder hablarle a la
 * pantalla es la diferencia entre que pregunte y que se rinda.
 *
 * La transcripción queda en el campo de texto y no se envía sola: la persona
 * lee lo que entendió el navegador y lo corrige antes de mandarlo. Con nombres
 * de municipios y de entidades se equivoca seguido.
 *
 * Firefox no la trae. Ahí el botón del micrófono simplemente no aparece — es
 * preferible a ofrecerlo y que no haga nada.
 */

interface ResultadoVoz {
  isFinal: boolean;
  0: { transcript: string };
}

interface EventoVoz {
  resultIndex: number;
  results: { length: number; [i: number]: ResultadoVoz };
}

interface Reconocedor {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: EventoVoz) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

type ConstructorVoz = new () => Reconocedor;

function constructor(): ConstructorVoz | null {
  const w = window as unknown as {
    SpeechRecognition?: ConstructorVoz;
    webkitSpeechRecognition?: ConstructorVoz;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const hayDictado = () => constructor() !== null;

interface Opciones {
  /** Se llama con la transcripción acumulada mientras la persona habla. */
  alTranscribir: (texto: string) => void;
  /** Se llama cuando el reconocimiento termina, por la razón que sea. */
  alTerminar: () => void;
}

/** Arranca el dictado. Devuelve la función para detenerlo, o null si no hay soporte. */
export function dictar({ alTranscribir, alTerminar }: Opciones): (() => void) | null {
  const Ctor = constructor();
  if (!Ctor) return null;

  const rec = new Ctor();
  rec.lang = 'es-CO';
  rec.continuous = true;
  rec.interimResults = true;

  // Lo ya confirmado se acumula aparte: los resultados provisionales se
  // reemplazan en cada evento, y concatenarlos sin separar repite palabras.
  let firme = '';

  rec.onresult = (e) => {
    let provisional = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) firme += r[0].transcript;
      else provisional += r[0].transcript;
    }
    alTranscribir((firme + provisional).trim());
  };

  rec.onerror = () => alTerminar();
  rec.onend = () => alTerminar();

  try {
    rec.start();
  } catch {
    return null;
  }

  return () => {
    try {
      rec.stop();
    } catch {
      /* ya estaba detenido */
    }
  };
}
