/* ─────────────────────────────────────────────────────────────────────────────
 *  Territorio afectado — sismo del 10 de agosto de 2026 (M 7.4)
 *
 *  Epicentro: 12 km de San José del Palmar, Chocó · profundidad ~100 km.
 *  Desastre nacional declarado por Decreto 1171 del 11 de agosto de 2026.
 *
 *  Según el reporte de la UNGRD del 14 de agosto, la afectación cubre
 *  15 departamentos y 426 municipios. Acá están los departamentos con daño
 *  reportado, ordenados por gravedad.
 *
 *  ⚠️  La lista de municipios NO es exhaustiva: son las cabeceras y los
 *      municipios nombrados en los reportes. Sirven como sugerencia — el campo
 *      admite escribir cualquier otro. Antes de producción hay que cargar el
 *      listado oficial de los 426 municipios de la declaratoria.
 * ────────────────────────────────────────────────────────────────────────── */

export interface Departamento {
  nombre: string;
  /** Nota de afectación, para que la persona se ubique. */
  nota: string;
  municipios: string[];
}

export const OTRO = 'Otro departamento';

export const DEPARTAMENTOS: Departamento[] = [
  {
    nombre: 'Chocó',
    nota: 'Epicentro · 715 viviendas destruidas',
    municipios: [
      'Quibdó',
      'San José del Palmar',
      'Nuquí',
      'Istmina',
      'Condoto',
      'Tadó',
      'Bahía Solano',
      'Riosucio',
      'Acandí',
      'Novita',
    ],
  },
  {
    nombre: 'Valle del Cauca',
    nota: 'Calamidad pública declarada · Cali en alerta roja',
    municipios: [
      'Cali',
      'Buenaventura',
      'Palmira',
      'Tuluá',
      'Buga',
      'Cartago',
      'Jamundí',
      'Yumbo',
      'Candelaria',
      'Florida',
      'Pradera',
      'Zarzal',
      'Roldanillo',
      'Sevilla',
      'Guacarí',
    ],
  },
  {
    nombre: 'Risaralda',
    nota: 'Mayor número de fallecidos · Pereira en alerta roja',
    municipios: [
      'Pereira',
      'Dosquebradas',
      'Santa Rosa de Cabal',
      'La Virginia',
      'Marsella',
      'Belén de Umbría',
      'Apía',
      'Santuario',
      'Quinchía',
      'Guática',
      'Mistrató',
      'Pueblo Rico',
      'Balboa',
      'La Celia',
    ],
  },
  {
    nombre: 'Quindío',
    nota: '2.144 viviendas averiadas · Armenia en alerta roja',
    municipios: [
      'Armenia',
      'Calarcá',
      'La Tebaida',
      'Montenegro',
      'Quimbaya',
      'Circasia',
      'Filandia',
      'Salento',
      'Córdoba',
      'Pijao',
      'Génova',
      'Buenavista',
    ],
  },
  {
    nombre: 'Caldas',
    nota: '1.959 viviendas averiadas · Manizales con daño estructural',
    municipios: [
      'Manizales',
      'Villamaría',
      'Chinchiná',
      'Palestina',
      'Neira',
      'Anserma',
      'Riosucio',
      'Supía',
      'La Dorada',
      'Salamina',
      'Aguadas',
      'Viterbo',
    ],
  },
  {
    nombre: 'Antioquia',
    nota: '857 viviendas averiadas',
    municipios: [
      'Medellín',
      'Bello',
      'Itagüí',
      'Envigado',
      'Rionegro',
      'Apartadó',
      'Turbo',
      'Caucasia',
      'Andes',
      'Urrao',
    ],
  },
  {
    nombre: 'Tolima',
    nota: '234 viviendas averiadas',
    municipios: ['Ibagué', 'Espinal', 'Melgar', 'Honda', 'Líbano', 'Chaparral', 'Mariquita'],
  },
  {
    nombre: 'Cundinamarca',
    nota: '89 viviendas averiadas',
    municipios: ['Bogotá D.C.', 'Soacha', 'Fusagasugá', 'Girardot', 'Zipaquirá', 'Facatativá'],
  },
  {
    nombre: 'Cauca',
    nota: 'Afectación menor reportada',
    municipios: ['Popayán', 'Santander de Quilichao', 'Puerto Tejada', 'Guapi', 'Timbiquí'],
  },
  {
    nombre: 'Huila',
    nota: '52 viviendas averiadas',
    municipios: ['Neiva', 'Pitalito', 'Garzón', 'La Plata'],
  },
  {
    nombre: 'Sucre',
    nota: '56 viviendas averiadas',
    municipios: ['Sincelejo', 'Corozal', 'San Marcos', 'Sampués'],
  },
  {
    nombre: 'Nariño',
    nota: 'Sismo percibido · verificar afectación',
    municipios: ['Pasto', 'Tumaco', 'Ipiales', 'Túquerres'],
  },
];

export function municipiosDe(departamento: string): string[] {
  return DEPARTAMENTOS.find((d) => d.nombre === departamento)?.municipios ?? [];
}

export function notaDe(departamento: string): string | undefined {
  return DEPARTAMENTOS.find((d) => d.nombre === departamento)?.nota;
}
