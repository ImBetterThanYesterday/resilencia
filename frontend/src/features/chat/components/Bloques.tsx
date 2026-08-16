import type {
  Adjunto,
  Bloque,
  DatosPersona,
  Documento,
  PasoAccion,
  Plazo,
  Subsidio,
} from '../../../types';
import { IconAlert, IconDoc, IconDownload } from '../../../components/icons';

/* ── Texto con **negrita** y saltos de línea ─────────────────────────────── */

function Texto({ texto }: { texto: string }) {
  return (
    <>
      {texto.split('\n').map((linea, i) =>
        linea === '' ? (
          <span key={i} className="rd-sep" />
        ) : (
          <p key={i} className="rd-p">
            {linea.split(/(\*\*[^*]+\*\*)/g).map((frag, j) =>
              frag.startsWith('**') && frag.endsWith('**') ? (
                <strong key={j}>{frag.slice(2, -2)}</strong>
              ) : (
                <span key={j}>{frag}</span>
              ),
            )}
          </p>
        ),
      )}
    </>
  );
}

/* ── Subsidios — solo lo que sí le corresponde ───────────────────────────── */

/**
 * Antes mostraba también lo que la persona NO podía pedir, y cada fila traía
 * descripción, requisitos y acordeón. Entre las seis ayudas eran veinticinco
 * líneas para responder "¿a qué tengo derecho?".
 *
 * Ahora es una línea por ayuda: qué es y cuánto. El detalle se pregunta —
 * para eso quedó abierto el chat.
 */
function ListaSubsidios({ items }: { items: Subsidio[] }) {
  return (
    <ul className="rd-lista">
      {items.map((s) => (
        <li key={s.id}>
          <strong>{s.nombre}</strong>
          <span>{s.monto ?? s.entidad}</span>
        </li>
      ))}
    </ul>
  );
}

/* ── Documento — el artefacto: se ve como una hoja ───────────────────────── */

const ETIQUETA_DOC: Record<Documento['tipo'], string> = {
  DERECHO_PETICION: 'Derecho de petición',
  TUTELA: 'Acción de tutela',
  RECURSO_REPOSICION: 'Recurso de reposición',
  QUEJA: 'Queja',
};

/** Reemplaza los [CAMPOS] con los datos ya entregados. */
function rellenar(texto: string, d?: DatosPersona) {
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

/** Resalta los [CAMPOS] que todavía faltan por llenar. */
function Extracto({ texto }: { texto: string }) {
  return (
    <>
      {texto.split(/(\[[^\]]+\])/g).map((frag, i) =>
        frag.startsWith('[') && frag.endsWith(']') ? (
          <mark key={i} className="rd-slot">
            {frag}
          </mark>
        ) : (
          <span key={i}>{frag}</span>
        ),
      )}
    </>
  );
}

function Papel({ doc, datos }: { doc: Documento; datos?: DatosPersona }) {
  return (
    <figure className="rd-papel">
      <figcaption className="rd-papel__cab">
        <span className="rd-papel__tipo">{ETIQUETA_DOC[doc.tipo]}</span>
        <h4 className="rd-papel__titulo">{doc.titulo}</h4>
        <p className="rd-papel__para">
          <span>Dirigido a</span>
          {rellenar(doc.destinatario, datos)}
        </p>
      </figcaption>

      <div className="rd-papel__hoja">
        <pre className="rd-papel__texto">
          <Extracto texto={rellenar(doc.extracto, datos)} />
        </pre>
        <span className="rd-papel__degradado" aria-hidden="true" />
      </div>

      <div className="rd-papel__pie">
        <ul className="rd-normas">
          {doc.fundamento.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>

        {doc.citas.length > 0 && (
          <p className="rd-aviso">
            <IconAlert size={14} />
            <span>
              {doc.citas.length} cita pendiente de verificar. No se imprime en el PDF
              hasta validarla contra la relatoría.
            </span>
          </p>
        )}

        <div className="rd-acciones">
          {/* TODO: POST /api/casos/:id/doc → PDF */}
          <button className="rd-btn rd-btn--solido" type="button">
            <IconDownload size={16} />
            Descargar PDF
          </button>
          <button className="rd-btn rd-btn--plano" type="button">
            Revisar y editar
          </button>
        </div>
      </div>
    </figure>
  );
}

/* ── Plazo — el reloj ────────────────────────────────────────────────────── */

function PlazoBloque({ plazo }: { plazo: Plazo }) {
  const vencido = plazo.estado !== 'CORRIENDO';
  const consumido = vencido
    ? 100
    : Math.min(100, ((plazo.diasHabiles - plazo.diasRestantes) / plazo.diasHabiles) * 100);

  return (
    <section className={`rd-plazo ${vencido ? 'rd-plazo--vencido' : ''}`}>
      <p className="rd-plazo__eyebrow">
        {plazo.instrumento} · radicado el {plazo.radicadoEl}
      </p>

      <p className="rd-plazo__cifra">
        <span className="rd-plazo__n">{plazo.diasRestantes}</span>
        <span className="rd-plazo__unidad">
          {vencido ? 'días — el plazo se venció' : 'días hábiles restantes'}
        </span>
      </p>

      <div className="rd-plazo__linea">
        <i style={{ width: `${consumido}%` }} />
      </div>

      <p className="rd-plazo__pie">
        <span>{vencido ? 'Venció el' : 'Vence el'} {plazo.venceEl}</span>
        <span className="rd-plazo__paso">{plazo.siguientePaso}</span>
      </p>
    </section>
  );
}

/* ── Datos faltantes ─────────────────────────────────────────────────────── */

function Faltantes({ titulo, items }: { titulo: string; items: string[] }) {
  return (
    <section className="rd-faltantes">
      <h4>{titulo}</h4>
      <ol>
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ol>
    </section>
  );
}

/* ── Pasos — lo que le toca a la persona ─────────────────────────────────── */

/**
 * El cierre de la respuesta. Sin esto la persona se queda con un documento
 * bonito en la pantalla y sin saber qué hacer el lunes por la mañana.
 *
 * Numerado porque acá el orden sí carga información: sin cédula no cobra nada,
 * y sin radicado no empieza a correr ningún plazo.
 */
function Pasos({ items }: { items: PasoAccion[] }) {
  return (
    <ol className="rd-pasos">
      {items.map((p, i) => (
        <li key={i}>
          <strong>{p.titulo}</strong>
          <p>{p.detalle}</p>
          {p.donde && <span className="rd-pasos__donde">{p.donde}</span>}
        </li>
      ))}
    </ol>
  );
}

/* ── Adjuntos ────────────────────────────────────────────────────────────── */

function Adjuntos({ items }: { items: Adjunto[] }) {
  return (
    <ul className="rd-adjuntos">
      {items.map((a) =>
        a.esImagen ? (
          <li key={a.id} className="rd-adj-foto">
            <img src={a.url} alt={a.nombre} />
          </li>
        ) : (
          <li key={a.id} className="rd-adj rd-adj--enviado">
            <span className="rd-adj__mini rd-adj__mini--doc">
              <IconDoc size={16} />
            </span>
            <span className="rd-adj__info">
              <span className="rd-adj__nombre">{a.nombre}</span>
              <span className="rd-adj__peso">{a.peso}</span>
            </span>
          </li>
        ),
      )}
    </ul>
  );
}

/* ── Router ──────────────────────────────────────────────────────────────── */

interface RenderProps {
  bloque: Bloque;
  datos?: DatosPersona;
}

export function RenderBloque({ bloque, datos }: RenderProps) {
  switch (bloque.tipo) {
    case 'texto':
      return <Texto texto={bloque.texto} />;
    case 'subsidios':
      return <ListaSubsidios items={bloque.items} />;
    case 'documento':
      return <Papel doc={bloque.doc} datos={datos} />;
    case 'pasos':
      return <Pasos items={bloque.items} />;
    case 'plazo':
      return <PlazoBloque plazo={bloque.plazo} />;
    case 'faltantes':
      return <Faltantes titulo={bloque.titulo} items={bloque.items} />;
    case 'adjuntos':
      return <Adjuntos items={bloque.items} />;
  }
}
