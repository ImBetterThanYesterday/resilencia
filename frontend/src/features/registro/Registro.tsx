import { useEffect, useRef, useState } from 'react';
import type { DatosPersona } from '../../types';
import { MarcaR } from '../../components/Marca';
import { DEPARTAMENTOS, OTRO, municipiosDe } from '../../data/territorio';
import { EVENTO } from '../../data/guion';
import { Soportes, type Adjuntado } from './components/Soportes';
import './css/registro.css';

const CLAVE = 'resiliencia.datos';

/**
 * Si ya los dio una vez, no se le vuelven a pedir.
 *
 * Se completa con los valores vacíos porque en el disco puede haber un registro
 * de una versión anterior del formulario: entrar al chat con campos en
 * undefined rompería la respuesta de alguien que ya había llenado todo.
 */
export function datosGuardados(): DatosPersona | null {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return null;
    const guardado = JSON.parse(crudo) as Partial<DatosPersona>;
    return { ...VACIO, ...guardado, situaciones: guardado.situaciones ?? [] };
  } catch {
    return null;
  }
}

export function borrarDatos() {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    /* almacenamiento bloqueado: seguimos sin persistir */
  }
}

/** Lo que puede haberle pasado. En primera persona: cuenta, no responde. */
export const SITUACIONES = [
  { id: 'fallecimiento', etiqueta: 'Falleció alguien cercano', abre: 'Auxilio funerario' },
  { id: 'heridos', etiqueta: 'Alguien en casa está herido', abre: 'Atención en salud' },
  { id: 'vivienda', etiqueta: 'Mi casa quedó dañada', abre: 'Arriendo y subsidio de vivienda' },
  { id: 'alojamiento', etiqueta: 'No tengo dónde quedarme', abre: 'Alojamiento temporal' },
  { id: 'enseres', etiqueta: 'Me quedé sin mis cosas', abre: 'Mercado, colchones, cocina' },
  { id: 'sustento', etiqueta: 'Me quedé sin trabajo o sin negocio', abre: 'Apoyo económico' },
  { id: 'documentos', etiqueta: 'Se me perdieron los documentos', abre: 'Cédula sin costo' },
  {
    id: 'prioritaria',
    etiqueta: 'En mi casa hay niños, personas mayores o alguien con discapacidad',
    abre: 'Atención prioritaria',
  },
];

const VACIO: DatosPersona = {
  situaciones: [],
  evaluada: '',
  porEscrito: '',
  tenencia: '',
  soportes: [],
  nombre: '',
  tipoDoc: 'C.C.',
  documento: '',
  telefono: '',
  departamento: '',
  municipio: '',
  direccion: '',
  correo: '',
  fechaEvento: '',
};

type Campo = keyof DatosPersona;

interface Paso {
  campo: Campo;
  pregunta: string;
  ayuda: string;
  tipo?: 'text' | 'tel' | 'email' | 'date';
  modo?: 'numeric';
  autocompletar?: string;
  conTipoDoc?: boolean;
  opcional?: boolean;
  /** Si viene, el campo es un select en vez de texto libre. */
  opciones?: (d: DatosPersona) => string[];
  /** Si viene, se responde de un toque: botones grandes en vez de escribir. */
  elecciones?: { valor: string; etiqueta: string; nota?: string }[];
  /** Si devuelve false, la pregunta no se hace: no aplica a este caso. */
  cuando?: (d: DatosPersona) => boolean;
}

const tocoLaCasa = (d: DatosPersona) =>
  d.situaciones.includes('vivienda') || d.situaciones.includes('alojamiento');

/**
 * Registro inicial, una pregunta por pantalla.
 *
 * Acá se pregunta absolutamente todo: qué pasó, cómo va el trámite, los datos
 * y los soportes. Antes la mitad se preguntaba dentro del chat y era peor de
 * las dos maneras — se sentía interrogatorio y además retrasaba la respuesta.
 * Con todo junto, el asistente puede abrir con el caso ya resuelto.
 *
 * Un formulario de doce campos a la vez asusta a quien acaba de perder la casa;
 * de a uno se responde sin pensarlo, y cada pregunta explica por qué se hace,
 * que es lo que sostiene la confianza para entregar una cédula.
 */
const PASOS: Paso[] = [
  {
    campo: 'evaluada',
    pregunta: '¿Ya fueron a evaluar tu casa?',
    ayuda: 'La visita del CMGRD es la que abre el arriendo y el subsidio de vivienda.',
    cuando: tocoLaCasa,
    elecciones: [
      { valor: 'si', etiqueta: 'Sí, ya fueron', nota: 'Vinieron a revisar los daños' },
      { valor: 'no', etiqueta: 'Todavía no', nota: 'No ha ido nadie' },
    ],
  },
  {
    campo: 'porEscrito',
    pregunta: '¿Te dejaron algo por escrito?',
    ayuda: 'Sin el acta en la mano no se puede reclamar nada. Si no te la dieron, la pido yo.',
    cuando: (d) => tocoLaCasa(d) && d.evaluada === 'si',
    elecciones: [
      { valor: 'si', etiqueta: 'Sí, tengo el acta', nota: 'Me entregaron una copia' },
      { valor: 'no', etiqueta: 'No me dejaron nada', nota: 'Tomaron fotos y se fueron' },
    ],
  },
  {
    campo: 'tenencia',
    pregunta: '¿La vivienda es tuya?',
    ayuda: 'Define a cuál programa de vivienda puedes entrar.',
    cuando: (d) => d.situaciones.includes('vivienda'),
    elecciones: [
      { valor: 'propia', etiqueta: 'Propia', nota: 'Con escritura, promesa o posesión' },
      { valor: 'arrendada', etiqueta: 'Arrendada', nota: 'Pago arriendo' },
      { valor: 'familiar', etiqueta: 'De un familiar', nota: 'Vivo ahí sin pagar' },
    ],
  },
  {
    campo: 'nombre',
    pregunta: '¿Cómo te llamas?',
    ayuda: 'Como aparece en tu documento. Va a encabezar tus solicitudes.',
    autocompletar: 'name',
  },
  {
    campo: 'documento',
    pregunta: '¿Cuál es tu número de documento?',
    ayuda: 'Sin él la entidad puede devolver el escrito. No lo compartimos con nadie.',
    modo: 'numeric',
    conTipoDoc: true,
  },
  {
    campo: 'telefono',
    pregunta: '¿A qué número te avisamos?',
    ayuda: 'Te escribimos solo cuando haya respuesta o se venza un plazo.',
    tipo: 'tel',
    autocompletar: 'tel',
  },
  {
    campo: 'departamento',
    pregunta: '¿En qué departamento vives?',
    ayuda: 'Solo aparecen los de la zona declarada en calamidad.',
    opciones: () => [...DEPARTAMENTOS.map((d) => d.nombre), OTRO],
  },
  {
    campo: 'municipio',
    pregunta: '¿Y en qué municipio?',
    ayuda: 'Tus solicitudes van dirigidas a esta alcaldía.',
    opciones: (d) => municipiosDe(d.departamento),
  },
  {
    campo: 'direccion',
    pregunta: '¿Dónde queda la vivienda afectada?',
    ayuda: 'Barrio, calle y número. Ahí debe llegarte la respuesta.',
    autocompletar: 'street-address',
  },
];

interface Props {
  onListo: (datos: DatosPersona) => void;
  /** Lo que ya marcó en la landing: entra preseleccionado. */
  preseleccion?: string[];
}

export function Registro({ onListo, preseleccion = [] }: Props) {
  // -1 es la pantalla de situaciones: va antes de pedir un solo dato personal.
  const [i, setI] = useState(-1);
  const [d, setD] = useState<DatosPersona>({ ...VACIO, situaciones: preseleccion });
  const [subidos, setSubidos] = useState<Record<string, Adjuntado>>({});
  const [autoriza, setAutoriza] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Las preguntas del trámite dependen de lo que marcó: a quien solo perdió los
  // documentos no se le pregunta por el dictamen de una casa que no reportó.
  const pasos = PASOS.filter((p) => p.cuando?.(d) ?? true);

  const enSituaciones = i === -1;
  const enSoportes = i === pasos.length;
  const enAutorizacion = i > pasos.length;
  const paso = pasos[i];

  useEffect(() => {
    inputRef.current?.focus();
  }, [i]);

  const valor = paso ? (d[paso.campo] as string) : '';
  const opciones = paso?.opciones?.(d) ?? [];
  const esSelect = opciones.length > 0;

  const puedeSeguir = enSituaciones
    ? d.situaciones.length > 0
    : enSoportes
      ? true // faltar un papel no puede frenar el reclamo
      : paso
        ? paso.opcional || valor.trim().length > 0
        : autoriza;

  function alternarSituacion(id: string) {
    setD((p) => ({
      ...p,
      situaciones: p.situaciones.includes(id)
        ? p.situaciones.filter((x) => x !== id)
        : [...p.situaciones, id],
    }));
  }

  function adjuntar(id: string, nombre: string, archivo: File) {
    setSubidos((p) => ({
      ...p,
      [id]: {
        nombre,
        archivo: archivo.name,
        url: URL.createObjectURL(archivo),
        esImagen: archivo.type.startsWith('image/'),
      },
    }));
  }

  function quitar(id: string) {
    setSubidos((p) => {
      const { [id]: fuera, ...resto } = p;
      if (fuera) URL.revokeObjectURL(fuera.url);
      return resto;
    });
  }

  function siguiente() {
    if (!puedeSeguir) return;
    if (enAutorizacion) {
      // La fecha del sismo no se pregunta: es un dato del evento, no de la persona.
      const completo: DatosPersona = {
        ...d,
        fechaEvento: EVENTO.fecha,
        soportes: Object.values(subidos).map((s) => s.nombre),
      };
      try {
        localStorage.setItem(CLAVE, JSON.stringify(completo));
      } catch {
        /* si el navegador bloquea el almacenamiento, seguimos sin guardar */
      }
      onListo(completo);
      return;
    }
    setI((n) => n + 1);
  }

  /** Elegir ya es responder: no tiene sentido tocar y después confirmar. */
  function elegir(campo: Campo, valor: string) {
    setD((p) => ({ ...p, [campo]: valor }));
    setI((n) => n + 1);
  }

  function atras() {
    setI((n) => Math.max(-1, n - 1));
  }

  const total = pasos.length + 3;
  const actual = Math.min(i + 2, total);

  return (
    <div className="rg">
      <div className="rg-caja">
        <header className="rg-cab">
          <MarcaR size={30} />
          <span className="rg-cab__paso">
            {actual} de {total}
          </span>
        </header>

        <div className="rg-barra">
          <i style={{ width: `${(actual / total) * 100}%` }} />
        </div>

        {enSituaciones ? (
          <div className="rg-cuerpo">
            <h1 className="rg-pregunta">¿Qué te pasó?</h1>
            <p className="rg-ayuda">
              Cada cosa abre un subsidio distinto. Marca todo lo que aplique.
            </p>

            <ul className="rg-situaciones">
              {SITUACIONES.map((o) => {
                const activa = d.situaciones.includes(o.id);
                return (
                  <li key={o.id}>
                    <label className={`rg-sit ${activa ? 'rg-sit--on' : ''}`}>
                      <input
                        type="checkbox"
                        checked={activa}
                        onChange={() => alternarSituacion(o.id)}
                      />
                      <span className="rg-autoriza__caja" aria-hidden="true" />
                      <span className="rg-sit__texto">
                        <span className="rg-sit__etiqueta">{o.etiqueta}</span>
                        <span className="rg-sit__abre">{o.abre}</span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : enSoportes ? (
          <div className="rg-cuerpo">
            <h1 className="rg-pregunta">Sube lo que tengas</h1>
            <p className="rg-ayuda">
              Con soportes el reclamo pesa. Lo que falte lo puedes subir después: no frena
              nada.
            </p>
            <Soportes
              situaciones={d.situaciones}
              subidos={subidos}
              onAdjuntar={adjuntar}
              onQuitar={quitar}
            />
          </div>
        ) : paso ? (
          <div className="rg-cuerpo" key={paso.campo}>
            <h1 className="rg-pregunta">{paso.pregunta}</h1>
            <p className="rg-ayuda">{paso.ayuda}</p>

            {paso.elecciones ? (
              <ul className="rg-elecciones">
                {paso.elecciones.map((o) => (
                  <li key={o.valor}>
                    <button
                      type="button"
                      className={`rg-eleccion ${valor === o.valor ? 'rg-eleccion--on' : ''}`}
                      onClick={() => elegir(paso.campo, o.valor)}
                    >
                      <span className="rg-eleccion__etiqueta">{o.etiqueta}</span>
                      {o.nota && <span className="rg-eleccion__nota">{o.nota}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rg-entrada">
                {esSelect ? (
                  <select
                    className="rg-select"
                    value={valor}
                    onChange={(e) => {
                      const v = e.target.value;
                      setD((p) => ({
                        ...p,
                        [paso.campo]: v,
                        // cambiar de departamento invalida el municipio elegido
                        ...(paso.campo === 'departamento' ? { municipio: '' } : {}),
                      }));
                    }}
                  >
                    <option value="">Selecciona…</option>
                    {opciones.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : (
                  <>
                    {paso.conTipoDoc && (
                      <select
                        className="rg-tipo"
                        value={d.tipoDoc}
                        onChange={(e) => setD((p) => ({ ...p, tipoDoc: e.target.value }))}
                      >
                        <option>C.C.</option>
                        <option>T.I.</option>
                        <option>C.E.</option>
                        <option>Pasaporte</option>
                      </select>
                    )}
                    <input
                      ref={inputRef}
                      type={paso.tipo ?? 'text'}
                      inputMode={paso.modo}
                      autoComplete={paso.autocompletar}
                      value={valor}
                      onChange={(e) => setD((p) => ({ ...p, [paso.campo]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          siguiente();
                        }
                      }}
                    />
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="rg-cuerpo">
            <h1 className="rg-pregunta">Una última cosa</h1>
            <p className="rg-ayuda">
              Para redactar y radicar tus solicitudes necesitamos tu permiso para usar
              estos datos.
            </p>

            <label className={`rg-autoriza ${autoriza ? 'rg-autoriza--on' : ''}`}>
              <input
                type="checkbox"
                checked={autoriza}
                onChange={(e) => setAutoriza(e.target.checked)}
              />
              <span className="rg-autoriza__caja" aria-hidden="true" />
              <span>
                Autorizo el tratamiento de mis datos personales conforme a la Ley 1581 de
                2012. Puedo pedir que los borren cuando quiera.
              </span>
            </label>

            <ul className="rg-resumen">
              <li>
                <span>Nombre</span>
                {d.nombre}
              </li>
              <li>
                <span>Documento</span>
                {d.tipoDoc} {d.documento}
              </li>
              <li>
                <span>Dónde</span>
                {d.municipio}, {d.departamento}
              </li>
              <li>
                <span>Soportes</span>
                {Object.keys(subidos).length || 'ninguno'}
              </li>
            </ul>
          </div>
        )}

        <footer className="rg-pie">
          {/* Las preguntas de un toque avanzan solas: un botón acá sobraría. */}
          {!paso?.elecciones && (
            <button
              type="button"
              className="rg-btn rg-btn--principal"
              onClick={siguiente}
              disabled={!puedeSeguir}
            >
              {enAutorizacion
                ? 'Ver mi caso resuelto'
                : enSoportes
                  ? Object.keys(subidos).length
                    ? 'Continuar'
                    : 'Continuar sin soportes'
                  : enSituaciones && d.situaciones.length > 0
                    ? `Continuar con ${d.situaciones.length} ${d.situaciones.length === 1 ? 'situación' : 'situaciones'}`
                    : 'Continuar'}
            </button>
          )}

          <div className="rg-pie__menores">
            {i > -1 && (
              <button type="button" className="rg-btn rg-btn--texto" onClick={atras}>
                Atrás
              </button>
            )}
            {paso?.opcional && (
              <button
                type="button"
                className="rg-btn rg-btn--texto"
                onClick={() => setI((n) => n + 1)}
              >
                Saltar
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
