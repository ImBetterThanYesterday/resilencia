import type { DatosPersona, Subsidio } from '../types';

/* ─────────────────────────────────────────────────────────────────────────────
 *  Catálogo de ayudas.
 *
 *  Regla que lo gobierna: a la persona solo se le muestra lo que puede pedir.
 *  Una lista con lo que NO le corresponde no cambia nada de lo que va a hacer
 *  hoy — solo la hace sentir que perdió otra cosa más.
 *
 *  ⚠️  DEMO: los programas y entidades son reales (UNGRD, RUD, Fonvivienda,
 *      DPS, Registraduría). Los requisitos y montos concretos NO están
 *      verificados contra la norma vigente. Antes de producción hay que
 *      contrastar cada uno con el decreto o resolución aplicable.
 * ────────────────────────────────────────────────────────────────────────── */

interface Regla extends Omit<Subsidio, 'estado' | 'porQue'> {
  /** Situaciones que lo activan. Basta con una. */
  activa: string[];
  /** Por qué le corresponde, dicho con lo que la persona marcó. */
  porQue: (d: DatosPersona) => string;
  /** Si devuelve false, no se muestra: no es suyo. */
  aplica?: (d: DatosPersona) => boolean;
}

const CATALOGO: Regla[] = [
  {
    id: 'documentos',
    nombre: 'Reposición de documentos',
    entidad: 'Registraduría Nacional',
    descripcion: 'Duplicado de cédula y registro civil, sin costo por ser damnificado.',
    monto: 'Sin costo',
    activa: ['documentos'],
    porQue: () => 'Sin cédula no avanza ningún otro trámite. Empieza por acá.',
    requisitos: [
      { texto: 'Denuncia por pérdida (se hace en línea, gratis)', cumple: 'desconocido' },
      { texto: 'Huella para cotejo', cumple: 'si' },
    ],
    comoSeSolicita: 'En la Registraduría o en las jornadas móviles de la zona.',
  },
  {
    id: 'funerario',
    nombre: 'Auxilio funerario',
    entidad: 'Alcaldía · UNGRD',
    descripcion: 'Cubre gastos funerarios. Se puede pedir aunque ya hayas pagado.',
    monto: 'Según decreto vigente',
    activa: ['fallecimiento'],
    porQue: () => 'Marcaste un fallecimiento por el sismo.',
    requisitos: [
      { texto: 'Registro civil de defunción', cumple: 'desconocido' },
      { texto: 'Parentesco con la persona fallecida', cumple: 'desconocido' },
    ],
    comoSeSolicita: 'En la alcaldía, con los soportes de pago si ya pagaste.',
  },
  {
    id: 'salud',
    nombre: 'Atención en salud sin costo',
    entidad: 'Secretaría de Salud · EPS',
    descripcion: 'Urgencias, hospitalización y medicamentos derivados del sismo.',
    monto: 'Sin costo',
    activa: ['heridos'],
    porQue: () => 'Hay alguien herido en tu hogar.',
    requisitos: [{ texto: 'Historia clínica o epicrisis', cumple: 'desconocido' }],
    comoSeSolicita: 'En cualquier IPS. No pueden exigir pago ni afiliación previa.',
  },
  {
    id: 'humanitaria',
    nombre: 'Ayuda humanitaria de emergencia',
    entidad: 'UNGRD · Alcaldía',
    descripcion: 'Mercado, colchones, cobijas y elementos de cocina.',
    monto: 'En especie',
    activa: ['enseres', 'alojamiento'],
    porQue: () => 'Te quedaste sin lo básico de la casa.',
    requisitos: [{ texto: 'Estar en el censo de damnificados (RUD)', cumple: 'desconocido' }],
    comoSeSolicita: 'Se entrega desde el censo. Si no te ha llegado, se reclama.',
  },
  {
    id: 'alojamiento',
    nombre: 'Alojamiento temporal',
    entidad: 'Alcaldía · CMGRD',
    descripcion: 'Albergue mientras no puedas volver a tu casa.',
    activa: ['alojamiento'],
    porQue: () => 'No tienes dónde quedarte.',
    requisitos: [{ texto: 'Estar en el censo de damnificados (RUD)', cumple: 'desconocido' }],
    comoSeSolicita: 'En el CMGRD de tu municipio.',
  },
  {
    id: 'dictamen',
    nombre: 'Copia del dictamen de habitabilidad',
    entidad: 'Alcaldía · CMGRD',
    descripcion:
      'No es plata: es el papel que dice cómo quedó tu casa. Sin él no se asigna arriendo ni subsidio de vivienda.',
    activa: ['vivienda', 'alojamiento'],
    // Si ya se lo entregaron, pedirlo otra vez no aporta nada.
    aplica: (d) => d.porEscrito !== 'si',
    porQue: (d) =>
      d.evaluada === 'si'
        ? 'Ya evaluaron tu casa, así que el acta existe aunque no te la hayan entregado.'
        : 'Todavía no han evaluado tu casa y sin esa evaluación no arranca nada.',
    requisitos: [{ texto: 'Tu documento de identidad', cumple: 'si' }],
    comoSeSolicita: 'Por derecho de petición ante la alcaldía. Ya te lo dejé redactado.',
  },
  {
    id: 'arriendo',
    nombre: 'Apoyo de arriendo temporal',
    entidad: 'UNGRD · Alcaldía',
    descripcion: 'Pago mensual mientras la vivienda no sea habitable.',
    monto: 'Mensual · según decreto vigente',
    activa: ['vivienda', 'alojamiento'],
    porQue: () => 'Estás fuera de tu casa por el sismo.',
    requisitos: [
      { texto: 'Dictamen de habitabilidad', cumple: 'desconocido' },
      { texto: 'Estar en el censo de damnificados (RUD)', cumple: 'desconocido' },
    ],
    comoSeSolicita: 'Se asigna desde el censo, con el dictamen en mano.',
  },
  {
    id: 'vivienda',
    nombre: 'Subsidio de vivienda',
    entidad: 'Minvivienda · Fonvivienda',
    descripcion: 'Reparación, reforzamiento o reubicación según cómo quede clasificada.',
    monto: 'Según convocatoria vigente',
    activa: ['vivienda'],
    // El subsidio va al titular. A quien arrienda le corresponde otra ruta.
    aplica: (d) => d.tenencia !== 'arrendada',
    porQue: (d) =>
      d.tenencia === 'propia'
        ? 'La vivienda es tuya y quedó dañada.'
        : 'La vivienda del hogar quedó dañada.',
    requisitos: [
      { texto: 'Dictamen de habitabilidad', cumple: 'desconocido' },
      { texto: 'Escritura, promesa o prueba de posesión', cumple: 'desconocido' },
      { texto: 'No haber recibido antes un subsidio de vivienda', cumple: 'desconocido' },
    ],
    comoSeSolicita: 'En la alcaldía o en tu caja de compensación.',
  },
  {
    id: 'sustento',
    nombre: 'Apoyo para reactivar el sustento',
    entidad: 'DPS · Alcaldía',
    descripcion: 'Transferencia o capital semilla para volver a generar ingresos.',
    monto: 'Según programa vigente',
    activa: ['sustento'],
    porQue: () => 'Perdiste el trabajo o el negocio por el sismo.',
    requisitos: [{ texto: 'Estar en el censo de damnificados (RUD)', cumple: 'desconocido' }],
    comoSeSolicita: 'En la alcaldía o en el punto del DPS de tu municipio.',
  },
  {
    id: 'prioritaria',
    nombre: 'Atención prioritaria del hogar',
    entidad: 'ICBF · Alcaldía',
    descripcion:
      'Tu hogar pasa primero en entregas y asignaciones, y hay acompañamiento para menores y personas mayores.',
    activa: ['prioritaria'],
    porQue: () => 'En tu casa hay menores, personas mayores o alguien con discapacidad.',
    requisitos: [{ texto: 'Registro civil de los menores o certificado de discapacidad', cumple: 'desconocido' }],
    comoSeSolicita: 'Se declara al inscribirse en el censo. Si no lo aplicaron, se reclama.',
  },
];

/**
 * Lo que esta persona puede pedir. Nada más.
 *
 * El orden importa: primero lo que destraba a lo demás (documentos, dictamen),
 * después la plata. Quien no tiene cédula no puede cobrar nada.
 */
const PESO: Record<string, number> = {
  documentos: 0,
  dictamen: 1,
  salud: 2,
  funerario: 3,
  alojamiento: 4,
  humanitaria: 5,
  arriendo: 6,
  vivienda: 7,
  sustento: 8,
  prioritaria: 9,
};

export function subsidiosPara(d: DatosPersona): Subsidio[] {
  return CATALOGO.filter(
    (r) => r.activa.some((s) => d.situaciones.includes(s)) && (r.aplica?.(d) ?? true),
  )
    .sort((a, b) => (PESO[a.id] ?? 99) - (PESO[b.id] ?? 99))
    .map(({ activa: _activa, aplica: _aplica, porQue, ...resto }) => ({
      ...resto,
      estado: 'APLICA' as const,
      porQue: porQue(d),
    }));
}
