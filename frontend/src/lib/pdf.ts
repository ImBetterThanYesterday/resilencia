import type { Documento, DatosPersona } from '../types';
import { cartaCompleta, nombreArchivo } from './documento';

/**
 * El PDF que se radica.
 *
 * jsPDF entra por import() dinámico y no por el import de arriba: pesa más que
 * toda la aplicación junta y solo hace falta cuando alguien pulsa el botón.
 * Metiéndolo en el bundle inicial, el 100% de las personas paga la descarga
 * para que la use una fracción.
 *
 * Times y no una fuente propia: las built-in de jsPDF viajan dentro del visor y
 * no hay que embeber nada. Incrustar una TTF son ~300 KB extra en base64 por un
 * escrito que la entidad va a imprimir en blanco y negro.
 */

const MM = { ancho: 210, alto: 297, margen: 25 };
const ANCHO_UTIL = MM.ancho - MM.margen * 2;

/**
 * Compone el documento y devuelve el jsPDF sin guardarlo. Separado de la
 * descarga para poder verificar la maquetación —saltos de página, firma que no
 * se parte— fuera del navegador.
 */
export async function construirPdf(
  doc: Documento,
  datos: DatosPersona | undefined,
  cuerpo: string,
) {
  const { jsPDF } = await import('jspdf');
  const carta = cartaCompleta(doc, datos, cuerpo);

  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = MM.margen;

  /** Salta de página cuando el bloque que viene no cabe. */
  function espacio(alto: number) {
    if (y + alto > MM.alto - MM.margen) {
      pdf.addPage();
      y = MM.margen;
    }
  }

  function parrafo(
    texto: string,
    opts: {
      tam?: number;
      estilo?: 'normal' | 'bold';
      interlineado?: number;
      despues?: number;
      alinear?: 'left' | 'justify';
    } = {},
  ) {
    const {
      tam = 11,
      estilo = 'normal',
      interlineado = 5.2,
      despues = 4,
      alinear = 'justify',
    } = opts;

    pdf.setFont('times', estilo);
    pdf.setFontSize(tam);

    const lineas = pdf.splitTextToSize(texto, ANCHO_UTIL) as string[];
    for (const linea of lineas) {
      espacio(interlineado);
      // La última línea de un párrafo justificado se estira hasta el margen y
      // queda con boquetes entre palabras. jsPDF no lo detecta solo.
      const esUltima = linea === lineas[lineas.length - 1];
      pdf.text(linea, MM.margen, y, {
        maxWidth: ANCHO_UTIL,
        align: alinear === 'justify' && !esUltima ? 'justify' : 'left',
      });
      y += interlineado;
    }
    y += despues;
  }

  // ── Encabezado ──────────────────────────────────────────────────────────
  parrafo(carta.lugarFecha, { tam: 11, despues: 8, alinear: 'left' });

  parrafo('Señores', { estilo: 'bold', despues: 0, alinear: 'left' });
  parrafo(carta.destinatario.toUpperCase(), { estilo: 'bold', despues: 8, alinear: 'left' });

  parrafo(`Referencia: ${carta.referencia}`, { estilo: 'bold', despues: 8, alinear: 'left' });

  // ── Cuerpo ──────────────────────────────────────────────────────────────
  for (const bloque of carta.cuerpo.split(/\n{2,}/)) {
    const t = bloque.trim();
    if (t) parrafo(t);
  }

  // ── Fundamento ──────────────────────────────────────────────────────────
  y += 2;
  parrafo('FUNDAMENTO DE DERECHO', { estilo: 'bold', tam: 10, despues: 2, alinear: 'left' });
  for (const f of carta.fundamento) {
    parrafo(`· ${f}`, { tam: 10, interlineado: 4.6, despues: 0, alinear: 'left' });
  }

  // ── Notificaciones ──────────────────────────────────────────────────────
  if (carta.notificaciones.length) {
    y += 6;
    parrafo('NOTIFICACIONES', { estilo: 'bold', tam: 10, despues: 2, alinear: 'left' });
    for (const n of carta.notificaciones) {
      parrafo(n, { tam: 10, interlineado: 4.6, despues: 0, alinear: 'left' });
    }
  }

  // ── Firma ───────────────────────────────────────────────────────────────
  // 32 mm reservados: si la firma cae partida entre dos páginas, el escrito
  // llega a la ventanilla con la última hoja sin firmar.
  espacio(32);
  y += 14;
  parrafo('Atentamente,', { despues: 16, alinear: 'left' });
  pdf.setLineWidth(0.2);
  pdf.line(MM.margen, y, MM.margen + 70, y);
  y += 5;
  parrafo(carta.firmante.toUpperCase(), { estilo: 'bold', despues: 0, alinear: 'left' });
  parrafo(carta.identificacion, { tam: 10, despues: 0, alinear: 'left' });

  return pdf;
}

export async function descargarPdf(
  doc: Documento,
  datos: DatosPersona | undefined,
  cuerpo: string,
) {
  const pdf = await construirPdf(doc, datos, cuerpo);
  pdf.save(nombreArchivo(doc, datos));
}
