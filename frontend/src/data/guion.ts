/* ─────────────────────────────────────────────────────────────────────────────
 *  El evento.
 *
 *  Es lo único que no sale del formulario: la persona no tiene por qué contarle
 *  a nadie qué día fue el sismo que le tumbó la casa.
 *
 *  ⚠️  DEMO: el evento y el decreto son reales. Los requisitos, montos y plazos
 *      que se usan en el resto de la app NO están verificados contra la norma
 *      vigente — ver el aviso en data/subsidios.ts.
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * Sismo del 10 de agosto de 2026, magnitud 7.4.
 * Epicentro a 12 km de San José del Palmar, Chocó, ~100 km de profundidad.
 * Desastre nacional declarado por Decreto 1171 del 11 de agosto de 2026.
 * Balance UNGRD al 14 de agosto: 15 departamentos y 426 municipios afectados.
 */
export const EVENTO = {
  tipo: 'sismo',
  magnitud: '7.4',
  epicentro: 'San José del Palmar, Chocó',
  /** No se le pregunta a la persona: es un dato del evento. */
  fecha: '10 de agosto de 2026',
  decreto: 'Decreto 1171 del 11 de agosto de 2026',
} as const;
