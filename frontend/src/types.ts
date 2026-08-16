// Modelo de datos del chat.
// Todo lo que el agente puede "decir" es un bloque; un mensaje es una lista de bloques.
// Así el backend puede devolver texto + tarjetas en una sola respuesta.

export type EstadoSubsidio = 'APLICA' | 'POSIBLE' | 'FALTA_DATO' | 'NO_APLICA';

export interface Requisito {
  texto: string;
  cumple: 'si' | 'no' | 'desconocido';
}

export interface Subsidio {
  id: string;
  nombre: string;
  entidad: string;
  descripcion: string;
  monto?: string;
  estado: EstadoSubsidio;
  requisitos: Requisito[];
  comoSeSolicita: string;
  /** Por qué el agente cree que aplica. Se le muestra a la persona. */
  porQue: string;
}

export type TipoDocumento =
  | 'DERECHO_PETICION'
  | 'TUTELA'
  | 'RECURSO_REPOSICION'
  | 'QUEJA';

export interface Documento {
  id: string;
  tipo: TipoDocumento;
  titulo: string;
  destinatario: string;
  extracto: string;
  fundamento: string[];
  citas: { sentencia: string; usadaPara: string }[];
}

export interface Plazo {
  id: string;
  instrumento: string;
  radicadoEl: string;
  venceEl: string;
  diasHabiles: number;
  diasRestantes: number;
  siguientePaso: string;
  estado: 'CORRIENDO' | 'VENCIDO' | 'ESCALADO';
}

export interface Adjunto {
  id: string;
  nombre: string;
  /** Object URL local. Cuando exista el backend, es la URL del archivo subido. */
  url: string;
  esImagen: boolean;
  peso: string;
}

export interface DatosPersona {
  /** Qué le pasó. Se pregunta antes que nada: es la razón de todo lo demás. */
  situaciones: string[];
  /* Estado del trámite. Va en el formulario, no en el chat: preguntarlo de a
   * poco en una conversación alarga lo que la persona quiere resolver ya. */
  evaluada: 'si' | 'no' | '';
  porEscrito: 'si' | 'no' | '';
  tenencia: 'propia' | 'arrendada' | 'familiar' | '';
  /** Nombres de lo que adjuntó. Los archivos viven en memoria. */
  soportes: string[];
  nombre: string;
  tipoDoc: string;
  documento: string;
  telefono: string;
  departamento: string;
  municipio: string;
  direccion: string;
  correo: string;
  fechaEvento: string;
}

/** Un paso concreto que le toca a la persona, no a nosotros. */
export interface PasoAccion {
  titulo: string;
  detalle: string;
  donde?: string;
}

export type Bloque =
  | { tipo: 'texto'; texto: string }
  | { tipo: 'subsidios'; intro?: string; items: Subsidio[] }
  | { tipo: 'documento'; doc: Documento }
  | { tipo: 'plazo'; plazo: Plazo }
  | { tipo: 'faltantes'; titulo: string; items: string[] }
  | { tipo: 'adjuntos'; items: Adjunto[] }
  | { tipo: 'pasos'; items: PasoAccion[] };

export interface Mensaje {
  id: string;
  autor: 'usuario' | 'asistente';
  bloques: Bloque[];
  hora: string;
  /** true mientras el texto se está "escribiendo" */
  escribiendo?: boolean;
}
