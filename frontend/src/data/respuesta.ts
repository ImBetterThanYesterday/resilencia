import type { Bloque, DatosPersona, Documento, PasoAccion } from '../types';
import { subsidiosPara } from './subsidios';

/* ─────────────────────────────────────────────────────────────────────────────
 *  La respuesta que abre el chat.
 *
 *  Todo se preguntó en el formulario, así que el asistente no saluda para
 *  volver a preguntar: llega con la respuesta hecha. Tres cosas, en este orden:
 *  a qué tiene derecho, el documento ya redactado, y qué le toca hacer.
 *
 *  Cuando exista el backend esto se reemplaza por POST /api/casos → Bloque[].
 * ────────────────────────────────────────────────────────────────────────── */

const primerNombre = (nombre: string) => nombre.trim().split(/\s+/)[0] ?? '';

/** Necesita reclamar el dictamen mientras no lo tenga por escrito. */
const faltaDictamen = (d: DatosPersona) =>
  d.porEscrito !== 'si' &&
  (d.situaciones.includes('vivienda') || d.situaciones.includes('alojamiento'));

/**
 * El derecho de petición, redactado con lo que la persona ya entregó.
 *
 * Cambia según el caso: a quien no le entregaron el acta se le pide copia y
 * revaluación; a quien ya la tiene le sirve reclamar la asignación que se
 * desprende de ella. Mandar el mismo escrito en los dos casos sería ruido.
 */
export function peticionPara(d: DatosPersona): Documento {
  const evaluada = d.evaluada === 'si';

  const base =
    'Yo, [NOMBRE COMPLETO], identificada con cédula [NÚMERO], residente en [DIRECCIÓN], en ejercicio del derecho fundamental de petición consagrado en el artículo 23 de la Constitución Política y reglamentado por la Ley 1755 de 2015, respetuosamente solicito:';

  const sinActa = evaluada
    ? `${base}\n\nPRIMERO. Que se me expida copia del acta de evaluación de daños practicada a mi vivienda con ocasión del sismo ocurrido el [FECHA], la cual no me fue entregada al momento de la visita.\n\nSEGUNDO. Que se practique una revaluación técnica del inmueble.\n\nTERCERO. Que se me informe si mi hogar fue incluido en el Registro Único de Damnificados y, de no haberlo sido, el procedimiento para solicitar la inclusión…`
    : `${base}\n\nPRIMERO. Que se practique la evaluación técnica de habitabilidad de mi vivienda, afectada por el sismo ocurrido el [FECHA], la cual a la fecha no ha sido visitada por el Consejo Municipal de Gestión del Riesgo.\n\nSEGUNDO. Que se me expida copia del acta que resulte de dicha evaluación.\n\nTERCERO. Que se me informe si mi hogar fue incluido en el Registro Único de Damnificados y, de no haberlo sido, el procedimiento para solicitar la inclusión…`;

  const conActa = `${base}\n\nPRIMERO. Que se me informe el estado de la asignación del apoyo de arriendo temporal y de los programas de vivienda a los que da lugar el dictamen de habitabilidad practicado a mi vivienda con ocasión del sismo ocurrido el [FECHA].\n\nSEGUNDO. Que se me confirme por escrito la inclusión de mi hogar en el Registro Único de Damnificados y el número de registro asignado.\n\nTERCERO. Que se me indique el cronograma de entrega de las ayudas que correspondan a mi hogar…`;

  return {
    id: 'doc-peticion',
    tipo: 'DERECHO_PETICION',
    titulo: faltaDictamen(d)
      ? evaluada
        ? 'Derecho de petición — copia del dictamen y revaluación estructural'
        : 'Derecho de petición — evaluación de habitabilidad de la vivienda'
      : 'Derecho de petición — asignación de ayudas y registro en el RUD',
    destinatario:
      'Alcaldía Municipal de [MUNICIPIO] — Consejo Municipal de Gestión del Riesgo de Desastres',
    extracto: faltaDictamen(d) ? sinActa : conActa,
    fundamento: [
      'Art. 23 C.P. — derecho de petición',
      'Ley 1755 de 2015 — término de respuesta',
      'Ley 1523 de 2012 — gestión del riesgo de desastres',
    ],
    citas: [],
  };
}

/** Qué le toca hacer, en orden, sin nada que dependa de nosotros. */
export function pasosPara(d: DatosPersona): PasoAccion[] {
  const pasos: PasoAccion[] = [];

  if (d.situaciones.includes('documentos')) {
    pasos.push({
      titulo: 'Saca el duplicado de tu cédula',
      detalle: 'Gratis por ser damnificado. Sin ella no cobras nada más.',
      donde: 'Registraduría o jornada móvil',
    });
  }

  pasos.push({
    titulo: 'Radica el escrito',
    detalle: 'Lleva dos copias. Que te sellen la tuya: ese sello prueba la fecha.',
    donde: d.municipio ? `Alcaldía de ${d.municipio}` : 'Alcaldía de tu municipio',
  });

  pasos.push({
    titulo: 'Confirma que estás en el censo',
    detalle: 'Sin RUD no se asigna nada, aunque te corresponda.',
    donde: 'CMGRD de tu municipio',
  });

  pasos.push({
    titulo: 'Vuelve con el radicado',
    detalle: 'Desde ese día te cuento los 15 días hábiles.',
  });

  pasos.push({
    titulo: 'Si no responden',
    detalle: 'El silencio ya es la violación: te dejo la tutela lista para firmar.',
  });

  return pasos;
}

/** El mensaje con el que abre el chat. */
export function aperturaPara(d: DatosPersona): Bloque[] {
  const nombre = primerNombre(d.nombre);

  return [
    {
      tipo: 'texto',
      texto: `${nombre ? `${nombre}, esto` : 'Esto'} es lo que te corresponde:`,
    },
    { tipo: 'subsidios', items: subsidiosPara(d) },
    {
      tipo: 'texto',
      texto: 'Para destrabar el dictamen te dejé este escrito, ya con tus datos.',
    },
    { tipo: 'documento', doc: peticionPara(d) },
    { tipo: 'texto', texto: 'Lo que sigue:' },
    { tipo: 'pasos', items: pasosPara(d) },
  ];
}

/* ── Seguimiento ───────────────────────────────────────────────────────────
 * Lo que el asistente contesta después de la apertura. En la demo se resuelve
 * por palabras clave; con el backend esto es POST /api/chat → Bloque[].
 * ────────────────────────────────────────────────────────────────────────── */

const tutelaPara = (): Documento => ({
  id: 'doc-tutela',
  tipo: 'TUTELA',
  titulo: 'Acción de tutela — derecho de petición y vivienda digna',
  destinatario: 'Juez de reparto — [MUNICIPIO], [DEPARTAMENTO]',
  extracto:
    'HECHOS\n\n1. El [FECHA] mi vivienda, ubicada en [DIRECCIÓN], resultó afectada por el sismo.\n\n2. Desde entonces mi hogar no habita el inmueble por riesgo de colapso.\n\n3. Radiqué derecho de petición ante la Alcaldía Municipal solicitando copia del dictamen de habitabilidad, como consta en el radicado [NÚMERO].\n\n4. **A la fecha, transcurridos más de quince (15) días hábiles, la entidad accionada no ha dado respuesta alguna.**\n\n5. La ausencia de dictamen me impide acceder al apoyo de arriendo temporal y a los programas de vivienda…',
  fundamento: [
    'Art. 86 C.P. — acción de tutela',
    'Art. 23 C.P. — derecho de petición',
    'Art. 51 C.P. — vivienda digna',
    'Decreto 2591 de 1991 — trámite de la tutela',
  ],
  citas: [],
});

/** Preguntas que la persona hace apenas ve el documento. */
export const SUGERENCIAS = ['Ya lo radiqué', '¿Cómo lo radico?', '¿Y si no me responden?'];

export function seguimiento(texto: string): Bloque[] {
  const t = texto.toLowerCase();

  if (/venci|vencer|no me (respond|contest)|pasaron los 15|no respond/.test(t)) {
    return [
      {
        tipo: 'plazo',
        plazo: {
          id: 'plazo-1',
          instrumento: 'Derecho de petición',
          radicadoEl: '16 de agosto de 2026',
          venceEl: '5 de septiembre de 2026',
          diasHabiles: 15,
          diasRestantes: 0,
          siguientePaso: 'Tutela generada',
          estado: 'ESCALADO',
        },
      },
      {
        tipo: 'texto',
        texto:
          'Se venció el término sin respuesta. **Ese silencio ya es la violación** y sostiene la tutela.',
      },
      { tipo: 'documento', doc: tutelaPara() },
      {
        tipo: 'texto',
        texto: 'Se radica en cualquier juzgado de tu municipio. El juez falla en **10 días**.',
      },
    ];
  }

  if (/radiqu[eé]|ya lo rad|lo lleve|lo llev[eé]/.test(t)) {
    return [
      { tipo: 'texto', texto: 'Guarda el número de radicado: es la prueba de la fecha.' },
      {
        tipo: 'plazo',
        plazo: {
          id: 'plazo-1',
          instrumento: 'Derecho de petición',
          radicadoEl: '16 de agosto de 2026',
          venceEl: '5 de septiembre de 2026',
          diasHabiles: 15,
          diasRestantes: 15,
          siguientePaso: 'Tutela si no responden',
          estado: 'CORRIENDO',
        },
      },
      { tipo: 'texto', texto: 'Si no responden, te aviso y dejo la tutela lista.' },
    ];
  }

  if (/c[oó]mo (lo )?radic|d[oó]nde (lo )?(llev|radic)|ventanilla/.test(t)) {
    return [
      {
        tipo: 'texto',
        texto:
          'Imprímelo dos veces y llévalo a la ventanilla de correspondencia de la alcaldía.\n\nNo tienes que explicar nada ni pedir permiso: **están obligados a recibirlo**. Que te sellen tu copia con la fecha y guárdala.',
      },
      {
        tipo: 'texto',
        texto: 'También sirve por correo certificado o por el correo electrónico oficial.',
      },
    ];
  }

  return [
    {
      tipo: 'texto',
      texto:
        'Hasta acá llega el guión de la demo. Con el backend conectado, desde este punto la conversación es real.',
    },
  ];
}
