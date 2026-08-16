import type { DatosPersona, Mensaje } from '../types';
import { aperturaPara, seguimiento } from '../data/respuesta';
import { CLAVE_HILO } from '../features/chat/ChatPage';

/**
 * Estado sembrado para el video.
 *
 * El demo usa los componentes reales, sin tocarlos: para que aparezcan con
 * contenido se les deja el mismo estado que dejaría una persona usando la app.
 * ChatPage lee los datos de localStorage y el hilo de sessionStorage — se
 * escriben acá antes de montar, y la UI se dibuja sola.
 *
 * La apertura no se escribe a mano: se genera con la misma función que usa la
 * app. Si cambia la respuesta real, cambia el video.
 */

export const DATOS_DEMO: DatosPersona = {
  situaciones: ['vivienda', 'alojamiento', 'documentos'],
  evaluada: 'si',
  porEscrito: 'no',
  tenencia: 'propia',
  soportes: ['Fotos del daño', 'Escritura, promesa o recibo de servicios'],
  nombre: 'Luz Marina Rentería',
  tipoDoc: 'C.C.',
  documento: '1077452188',
  telefono: '3214458890',
  departamento: 'Chocó',
  municipio: 'Quibdó',
  direccion: 'Barrio Niño Jesús, calle 24 # 8-14',
  correo: '',
  fechaEvento: '10 de agosto de 2026',
};

const msg = (autor: Mensaje['autor'], bloques: Mensaje['bloques'], id: string): Mensaje => ({
  id,
  autor,
  bloques,
  hora: '',
});

/** El caso recién resuelto: un solo mensaje con todo adentro. */
export const M_CASO: Mensaje[] = [msg('asistente', aperturaPara(DATOS_DEMO), 'm1')];

/** Lo que se escribe en el video, letra por letra. */
export const PREGUNTA = '¿Y si no me responden?';

/** La pregunta ya enviada, esperando respuesta. */
export const M_PREGUNTA: Mensaje[] = [
  ...M_CASO,
  msg('usuario', [{ tipo: 'texto', texto: PREGUNTA }], 'm2'),
];

/** Y la respuesta, generada por la misma función que usa la app. */
export const M_RESPUESTA: Mensaje[] = [
  ...M_PREGUNTA,
  msg('asistente', seguimiento(PREGUNTA), 'm3'),
];

/** Deja el hilo exactamente con los mensajes que se quieren ver. */
export function sembrarHilo(mensajes: Mensaje[]) {
  try {
    localStorage.setItem('resiliencia.datos', JSON.stringify(DATOS_DEMO));
    sessionStorage.setItem(CLAVE_HILO, JSON.stringify(mensajes));
  } catch {
    /* sin almacenamiento: los componentes salen en su estado inicial */
  }
}
