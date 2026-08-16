/* ─────────────────────────────────────────────────────────────────────────────
 *  Soportes del caso.
 *
 *  Qué se le pide a cada persona sale de lo que marcó: no tiene sentido pedirle
 *  el registro de defunción a quien solo perdió los documentos. Cada soporte
 *  dice para qué sirve — nadie sube una escritura porque sí.
 *
 *  ⚠️  DEMO: los documentos son los razonables para cada trámite, pero la lista
 *      exacta la fija cada entidad. Verificar contra la ventanilla real antes
 *      de producción.
 * ────────────────────────────────────────────────────────────────────────── */

export interface Soporte {
  id: string;
  nombre: string;
  /** Para qué sirve. Se muestra siempre: justifica el pedido. */
  porQue: string;
  /** Situaciones que lo hacen necesario. */
  situaciones: string[];
  opcional?: boolean;
}

export const SOPORTES: Soporte[] = [
  {
    id: 'foto-dano',
    nombre: 'Fotos del daño',
    porQue: 'Es la prueba de lo que pasó. Con el celular basta.',
    situaciones: ['vivienda', 'enseres', 'alojamiento'],
  },
  {
    id: 'acta',
    nombre: 'Acta de evaluación de daños',
    porQue: 'Define si te dan arriendo temporal. Si no te la entregaron, la reclamamos.',
    situaciones: ['vivienda', 'alojamiento'],
    opcional: true,
  },
  {
    id: 'tenencia',
    nombre: 'Escritura, promesa o recibo de servicios',
    porQue: 'Prueba que la vivienda es tuya o que vivías ahí.',
    situaciones: ['vivienda'],
  },
  {
    id: 'defuncion',
    nombre: 'Registro civil de defunción',
    porQue: 'Sin esto no se puede pedir el auxilio funerario.',
    situaciones: ['fallecimiento'],
  },
  {
    id: 'sepelio',
    nombre: 'Facturas del sepelio',
    porQue: 'Si ya pagaste, con estas se pide el reembolso.',
    situaciones: ['fallecimiento'],
    opcional: true,
  },
  {
    id: 'historia',
    nombre: 'Historia clínica o epicrisis',
    porQue: 'Soporta la atención en salud y la incapacidad.',
    situaciones: ['heridos'],
  },
  {
    id: 'albergue',
    nombre: 'Constancia del albergue o carta del familiar',
    porQue: 'Prueba que estás fuera de tu casa.',
    situaciones: ['alojamiento'],
  },
  {
    id: 'denuncia',
    nombre: 'Denuncia por pérdida de documentos',
    porQue: 'Se hace en línea y es gratis. Habilita la reposición.',
    situaciones: ['documentos'],
  },
  {
    id: 'negocio',
    nombre: 'RUT o registro de cámara de comercio',
    porQue: 'Para el apoyo económico al negocio.',
    situaciones: ['sustento'],
    opcional: true,
  },
  {
    id: 'menores',
    nombre: 'Registro civil de los menores',
    porQue: 'Activa la atención prioritaria del hogar.',
    situaciones: ['prioritaria'],
  },
  {
    id: 'discapacidad',
    nombre: 'Certificado de discapacidad',
    porQue: 'Si alguien en casa lo tiene, sube la prioridad.',
    situaciones: ['prioritaria'],
    opcional: true,
  },
];

/** Los que aplican a lo que la persona marcó, obligatorios primero. */
export function soportesPara(situaciones: string[]): Soporte[] {
  return SOPORTES.filter((s) => s.situaciones.some((x) => situaciones.includes(x))).sort(
    (a, b) => Number(a.opcional ?? false) - Number(b.opcional ?? false),
  );
}
