/**
 * Cliente del agente de dudas (n8n).
 *
 * El webhook devuelve CORS abierto —refleja el Origin que le llega— así que el
 * navegador puede llamarlo directo y no hace falta proxy. Cuando exista backend
 * propio, esto es lo único que cambia de sitio.
 *
 * Sobre el formato de respuesta: n8n no garantiza uno. Según cómo esté armado
 * el «Respond to Webhook», lo mismo llega {output}, {text}, un array con el
 * objeto adentro, o texto plano. Adivinar una sola forma es garantizar que el
 * día que alguien toque el workflow, el chat empiece a contestar "undefined".
 */

/* Configurable desde Vercel sin tocar código: si mañana el workflow cambia de
 * URL, se edita la variable y se redespliega. Va con VITE_ y por lo tanto viaja
 * al bundle —es visible para cualquiera que abra las herramientas del
 * navegador—, lo cual está bien porque es un webhook público. El día que el
 * agente necesite una API key, la key NO puede vivir acá: tiene que quedar
 * detrás de una función del servidor. */
const ENDPOINT =
  import.meta.env.VITE_AGENTE_URL ?? 'https://manuelgruez0.app.n8n.cloud/webhook/rag-agent';
const CLAVE_SESION = 'resilencia.agente.sesion';
const TIMEOUT_MS = 45_000;

/**
 * Un id por navegador, estable entre visitas: es lo que le permite al agente
 * recordar lo que ya se habló. Si el almacenamiento está bloqueado se genera
 * uno al vuelo y la sesión dura lo que la pestaña.
 */
export function idSesion(): string {
  try {
    const guardado = localStorage.getItem(CLAVE_SESION);
    if (guardado) return guardado;
    const nuevo = crypto.randomUUID();
    localStorage.setItem(CLAVE_SESION, nuevo);
    return nuevo;
  } catch {
    return crypto.randomUUID();
  }
}

/** Saca el texto de la respuesta sea cual sea la forma en que venga envuelto. */
function extraerTexto(dato: unknown): string {
  if (typeof dato === 'string') return dato.trim();
  if (Array.isArray(dato)) {
    for (const item of dato) {
      const t = extraerTexto(item);
      if (t) return t;
    }
    return '';
  }
  if (dato && typeof dato === 'object') {
    const obj = dato as Record<string, unknown>;
    for (const llave of ['output', 'text', 'message', 'respuesta', 'answer', 'response', 'data']) {
      if (llave in obj) {
        const t = extraerTexto(obj[llave]);
        if (t) return t;
      }
    }
  }
  return '';
}

export class ErrorAgente extends Error {}

export async function preguntar(chatInput: string, sessionId: string): Promise<string> {
  // Sin timeout, una consulta que el agente no cierra deja los puntos
  // suspensivos girando para siempre y no hay forma de reintentar.
  const corte = AbortSignal.timeout(TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatInput, sessionId }),
      signal: corte,
    });
  } catch {
    throw new ErrorAgente('No pude conectarme. Revisa tu conexión e inténtalo otra vez.');
  }

  const crudo = await res.text();
  let dato: unknown = crudo;
  try {
    dato = JSON.parse(crudo);
  } catch {
    /* respuesta en texto plano: se usa tal cual */
  }

  if (!res.ok) {
    throw new ErrorAgente('El asistente no está disponible en este momento.');
  }

  const texto = extraerTexto(dato);
  if (!texto) {
    throw new ErrorAgente('El asistente respondió vacío. Inténtalo de nuevo.');
  }
  return texto;
}
