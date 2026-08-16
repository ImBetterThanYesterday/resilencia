import type { Documento, DatosPersona } from '../types';

/**
 * De bloque de pantalla a escrito radicable.
 *
 * Lo que el chat muestra es un extracto: termina en «…» porque en la burbuja
 * solo cabe el argumento. Un PDF que se radica en una ventanilla no puede
 * terminar en puntos suspensivos, así que acá se arma la carta entera —
 * encabezado con lugar y fecha, destinatario, petición, fundamento,
 * notificaciones y firma.
 *
 * La sección de notificaciones no es formalismo: si el escrito no dice a dónde
 * responder, la entidad puede archivar sin notificar y el plazo del art. 23 se
 * pierde sin que la persona se entere.
 */

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function fechaLarga(d = new Date()) {
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

/** Reemplaza los [CAMPOS] con los datos ya entregados. */
export function rellenar(texto: string, d?: DatosPersona) {
  if (!d) return texto;
  const mapa: Record<string, string> = {
    '[NOMBRE COMPLETO]': d.nombre,
    '[NÚMERO]': d.documento ? `${d.tipoDoc} ${d.documento}` : '',
    '[DIRECCIÓN]': d.direccion,
    '[FECHA]': d.fechaEvento,
    '[MUNICIPIO]': d.municipio,
    '[DEPARTAMENTO]': d.departamento,
  };
  return Object.entries(mapa).reduce(
    (acc, [clave, valor]) => (valor ? acc.replaceAll(clave, valor) : acc),
    texto,
  );
}

/** Los [CAMPOS] que quedaron sin dato. Se avisan antes de descargar. */
export function huecos(texto: string): string[] {
  return [...new Set(texto.match(/\[[^\]]+\]/g) ?? [])];
}

/**
 * Cuerpo editable del escrito: lo que la persona ve y corrige en «Revisar y
 * editar». Deja fuera el encabezado y la firma porque esos se componen solos
 * con los datos del formulario y no hay nada que redactar ahí.
 */
export function cuerpoEditable(doc: Documento, datos?: DatosPersona) {
  return rellenar(doc.extracto, datos).replace(/…\s*$/, '.');
}

/** El escrito completo, listo para radicar, como lista de párrafos. */
export function cartaCompleta(doc: Documento, datos: DatosPersona | undefined, cuerpo: string) {
  const lugar = datos?.municipio || '[MUNICIPIO]';
  const dpto = datos?.departamento ? `, ${datos.departamento}` : '';
  const destinatario = rellenar(doc.destinatario, datos);

  const notificaciones = [
    datos?.direccion && `Dirección: ${datos.direccion}`,
    datos?.correo && `Correo electrónico: ${datos.correo}`,
    datos?.telefono && `Teléfono: ${datos.telefono}`,
  ].filter(Boolean) as string[];

  return {
    titulo: doc.titulo,
    lugarFecha: `${lugar}${dpto}, ${fechaLarga()}`,
    destinatario,
    referencia: doc.titulo,
    cuerpo,
    fundamento: doc.fundamento,
    notificaciones,
    firmante: datos?.nombre || '[NOMBRE COMPLETO]',
    identificacion:
      datos?.documento ? `${datos.tipoDoc} ${datos.documento}` : '[NÚMERO DE DOCUMENTO]',
  };
}

/** Nombre de archivo sin acentos ni espacios. */
export function nombreArchivo(doc: Documento, datos?: DatosPersona) {
  const limpio = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();

  const quien = datos?.nombre ? `-${limpio(datos.nombre.split(/\s+/)[0] ?? '')}` : '';
  return `${limpio(doc.titulo).slice(0, 60)}${quien}.pdf`;
}
