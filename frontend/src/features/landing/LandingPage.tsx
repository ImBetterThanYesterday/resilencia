import { useEffect, useRef, useState, type ReactNode } from 'react';
import { MarcaR } from '../../components/Marca';
import { BanderaCO } from '../../components/Bandera';
import { IconGratis, IconPersona, IconSello } from '../../components/icons';
import { BurbujaDudas } from './components/BurbujaDudas';
import barrioColor from '../../assets/fotos/barrio-color.jpg';
import barrioLadera from '../../assets/fotos/barrio-ladera.jpg';
import grieta from '../../assets/fotos/grieta.jpg';
import grupo from '../../assets/fotos/grupo.jpg';
import './css/landing.css';

/**
 * Landing de Resilencia.
 *
 * Registro: organización que presta un servicio público, no producto de
 * software. Eso define las decisiones: encabezado con navegación real, proceso
 * numerado (la secuencia es cierta, no decorativa), pie con la letra chica a
 * la vista, y cero lenguaje de campaña.
 *
 * La pieza central sigue siendo la lista situación → respuesta: el problema y
 * la solución en el mismo renglón, al mismo peso tipográfico. Ese es el
 * argumento del producto, así que es lo único que recibe color e interacción.
 *
 * Sin tarjetas, sin badges, sin sombras. Reglas y aire hacen el trabajo.
 *
 * NOTA: no hay cifras de impacto. Inventar "N familias atendidas" en un
 * producto que todavía no atendió a nadie es la clase de dato que no
 * sobrevive una pregunta del jurado.
 */

interface Fila {
  ids: string[];
  situacion: string;
  respuesta: string;
}

const FILAS: Fila[] = [
  {
    ids: ['fallecimiento'],
    situacion: 'Pérdidas familiares',
    respuesta: 'Auxilio funerario',
  },
  {
    ids: ['heridos'],
    situacion: 'Heridos en casa',
    respuesta: 'Atención médica prioritaria',
  },
  {
    ids: ['vivienda', 'alojamiento'],
    situacion: 'Daños en la vivienda o sin techo',
    respuesta: 'Alojamiento temporal y arriendo',
  },
  {
    ids: ['enseres'],
    situacion: 'Sin alimentos ni enseres',
    respuesta: 'Mercado, ropa y cocina',
  },
  {
    ids: ['sustento'],
    situacion: 'Pérdida de empleo o negocio',
    respuesta: 'Apoyo económico y crédito blando',
  },
  {
    ids: ['documentos'],
    situacion: 'Documentos perdidos',
    respuesta: 'Cédula y registro civil, gratis',
  },
  {
    ids: ['prioritaria'],
    situacion: 'Niños, adultos mayores o discapacidad',
    respuesta: 'Atención prioritaria',
  },
];

const COMPROMISOS = [
  { icono: IconGratis, titulo: 'Gratuito, siempre' },
  { icono: IconPersona, titulo: 'Sin intermediarios' },
  { icono: IconSello, titulo: 'Documentos radicables' },
];

const PASOS = [
  {
    titulo: 'Cuentas qué te pasó',
    detalle: 'Marcas tu situación, la escribes o mandas un audio. También puedes subir fotos.',
  },
  {
    titulo: 'Te decimos a qué tienes derecho',
    detalle: 'Qué te corresponde, qué requisitos te faltan y dónde se pide.',
  },
  {
    titulo: 'Si te lo niegan, redactamos el reclamo',
    detalle: 'Derecho de petición primero; tutela solo si corresponde.',
  },
  {
    titulo: 'Vigilamos el plazo por ti',
    detalle: 'Si se vence sin respuesta, preparamos el siguiente paso sin que lo pidas.',
  },
];

/** Revelado al entrar en pantalla. Respeta prefers-reduced-motion. */
function Revelar({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`ld-revelar ${visible ? 'ld-revelar--visible' : ''}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

interface Props {
  /** Abre el chat. Si viene con ids, entra con esas situaciones ya marcadas. */
  onEntrar: (preseleccion?: string[]) => void;
}

export function LandingPage({ onEntrar }: Props) {
  const [scrolleado, setScrolleado] = useState(false);

  useEffect(() => {
    const alScroll = () => setScrolleado(window.scrollY > 12);
    alScroll();
    window.addEventListener('scroll', alScroll, { passive: true });
    return () => window.removeEventListener('scroll', alScroll);
  }, []);

  function irA(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="ld">
      {/* ── Encabezado ───────────────────────────────────────────────────── */}
      <header className={`ld-nav ${scrolleado ? 'ld-nav--fija' : ''}`}>
        <div className="ld-ancho ld-nav__fila">
          <a
            className="ld-nav__marca"
            href="#inicio"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <MarcaR size={30} />
            <span>Resilencia</span>
          </a>

          <nav className="ld-nav__links">
            <button type="button" onClick={() => irA('ayudas')}>
              Ayudas
            </button>
            <button type="button" onClick={() => irA('como')}>
              Cómo funciona
            </button>
            <button type="button" onClick={() => irA('quienes')}>
              Quiénes somos
            </button>
          </nav>

          <button type="button" className="ld-nav__cta" onClick={() => onEntrar()}>
            Ver mis subsidios
          </button>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="ld-hero" id="inicio">
        <div className="ld-ancho">
          <Revelar>
            <p className="ld-hero__contexto">
              <BanderaCO size={19} />
              Subsidios para damnificados del terremoto · Colombia
            </p>

            <h1 className="ld-hero__h1">Soy Resilencia.</h1>

            {/* El nombre está escrito como el dominio, sin la i. No es un error
                de tipeo: es el argumento. Lo decimos nosotros antes de que lo
                note alguien más, y lo convertimos en lo que significa estar
                damnificado — te falta algo, y sigues de pie igual. */}
            <p className="ld-hero__guino">
              Nos falta una <span className="ld-hero__i">i</span>, no la resiliencia.
            </p>

            <p className="ld-hero__bajada">
              Te digo exactamente a qué subsidios tienes derecho tras el terremoto y te
              acompaño hasta que te los entreguen. Si te los niegan, redacto tu reclamo.
            </p>

            <div className="ld-hero__acciones">
              <button type="button" className="ld-btn ld-btn--acento" onClick={() => onEntrar()}>
                Ver a qué subsidios tengo derecho
              </button>
              <p className="ld-hero__nota">
                Gratis · sin registro · dos minutos
              </p>
            </div>
          </Revelar>
        </div>
      </section>

      {/* ── Compromisos ──────────────────────────────────────────────────── */}
      <section className="ld-compromisos">
        <div className="ld-ancho">
          <ul className="ld-compromisos__lista">
            {COMPROMISOS.map((c, i) => {
              const Icono = c.icono;
              return (
                <li key={c.titulo}>
                  <Revelar delay={i * 80}>
                    <div className="ld-compromiso">
                      <span className="ld-compromiso__icono">
                        <Icono size={22} />
                      </span>
                      <h3>{c.titulo}</h3>
                    </div>
                  </Revelar>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ── Banda: a quién sirve ─────────────────────────────────────────── */}
      <figure className="ld-banda">
        <img src={barrioColor} alt="Barrio de ladera en Colombia, viviendas autoconstruidas" />
        <figcaption>
          <p>
            La vivienda autoconstruida en ladera es la primera que un sismo se lleva —
            y la última en aparecer en los registros de ayuda.
          </p>
        </figcaption>
      </figure>

      {/* ── Núcleo: situación → respuesta ────────────────────────────────── */}
      <section className="ld-nucleo" id="ayudas">
        <div className="ld-ancho">
          <Revelar>
            <h2 className="ld-h2">Tu situación activa la respuesta.</h2>
            <p className="ld-intro">
              No necesitas saber el nombre de los decretos. Solo qué estás viviendo.
            </p>
          </Revelar>

          <ul className="ld-filas">
            {FILAS.map((f, i) => (
              <li key={f.situacion}>
                <Revelar delay={i * 55}>
                  <button type="button" className="ld-fila" onClick={() => onEntrar(f.ids)}>
                    <span className="ld-fila__situacion">{f.situacion}</span>
                    <span className="ld-fila__flecha" aria-hidden="true" />
                    <span className="ld-fila__respuesta">{f.respuesta}</span>
                  </button>
                </Revelar>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Banda: el daño ───────────────────────────────────────────────── */}
      <figure className="ld-banda ld-banda--angosta">
        <img src={grieta} alt="Grieta atravesando una placa de concreto" />
      </figure>

      {/* ── Cómo funciona ────────────────────────────────────────────────── */}
      <section className="ld-como" id="como">
        <div className="ld-ancho">
          <Revelar>
            <h2 className="ld-h2">Cómo funciona</h2>
            <p className="ld-intro">El primero lo das tú. Los otros tres, nosotros.</p>
          </Revelar>

          <ol className="ld-pasos">
            {PASOS.map((p, i) => (
              <li key={p.titulo}>
                <Revelar delay={i * 70}>
                  <span className="ld-pasos__n">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h3>{p.titulo}</h3>
                    <p>{p.detalle}</p>
                  </div>
                </Revelar>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Lo que sale ──────────────────────────────────────────────────── */}
      <section className="ld-salida" id="documento">
        <div className="ld-ancho ld-salida__grid">
          <Revelar>
            <div>
              <h2 className="ld-h2">Lo que sale es un documento, no un consejo.</h2>
              <p className="ld-intro">
                Un escrito con tus hechos, la norma que lo sustenta y el destinatario
                correcto. Lo revisas, llenas lo que falta y lo radicas a tu nombre.
              </p>
              <p className="ld-intro">
                Desde ahí vigilamos el plazo. Si la entidad no responde dentro del
                término legal, preparamos la tutela con el incumplimiento ya incorporado
                como hecho.
              </p>
            </div>
          </Revelar>

          <Revelar delay={120}>
            <img
              className="ld-salida__foto"
              src={barrioLadera}
              alt="Casas de ladrillo en la ladera de una montaña en Colombia"
            />
          </Revelar>
        </div>
      </section>

      {/* ── Opción libre ─────────────────────────────────────────────────── */}
      <section className="ld-libre">
        <div className="ld-ancho">
          <Revelar>
            <h2 className="ld-h2">¿Demasiado texto para este momento?</h2>
            <p className="ld-intro">Escríbelo o dilo como te salga.</p>

            <blockquote className="ld-cita">
              Se me cayó el techo, perdimos la cédula y mi papá necesita sus medicinas.
            </blockquote>

            <p className="ld-libre__pie">
              Con solo escuchar o leer eso, cruzamos lo que contaste con la ley y armamos
              tu expediente de ayudas al instante.
            </p>
          </Revelar>
        </div>
      </section>

      {/* ── Quiénes somos ────────────────────────────────────────────────── */}
      <section className="ld-equipo" id="quienes">
        <div className="ld-ancho ld-equipo__grid">
          <Revelar>
            <figure className="ld-equipo__figura">
              <img
                src={grupo}
                alt="Tres integrantes del equipo frente a un tablero donde está escrito el problema que originó Resilencia"
              />
              <figcaption>El tablero donde empezó todo.</figcaption>
            </figure>
          </Revelar>

          <Revelar delay={120}>
            <div>
              <p className="ld-equipo__ojo">Quiénes somos</p>
              <h2 className="ld-h2">Somos cuatro y creemos que se puede arreglar.</h2>
              <p className="ld-intro">
                Que nadie tenga que pelear por lo que ya le pertenece. Empezamos por
                Colombia; el problema es de toda Latinoamérica.
              </p>
            </div>
          </Revelar>
        </div>
      </section>

      {/* ── Cierre ───────────────────────────────────────────────────────── */}
      <section className="ld-cierre">
        <div className="ld-ancho">
          <Revelar>
            <h2 className="ld-cierre__h2">Empieza por lo que necesitas resolver hoy.</h2>
            <p className="ld-intro ld-intro--claro">Lo demás lo vemos después.</p>

            <button type="button" className="ld-btn ld-btn--acento" onClick={() => onEntrar()}>
              Ver a qué subsidios tengo derecho
            </button>
          </Revelar>
        </div>
      </section>

      {/* ── Pie ──────────────────────────────────────────────────────────── */}
      <footer className="ld-pie">
        <div className="ld-ancho ld-pie__grid">
          <div className="ld-pie__marca">
            <span className="ld-pie__logos">
              <MarcaR size={28} />
              <BanderaCO size={22} />
            </span>
            <p>
              Acompañamiento gratuito a personas damnificadas para acceder a las ayudas
              que la ley ya les reconoce.
            </p>
          </div>

          <div className="ld-pie__col">
            <h4>Ayudas</h4>
            <button type="button" onClick={() => irA('ayudas')}>
              Qué te corresponde
            </button>
            <button type="button" onClick={() => irA('como')}>
              Cómo funciona
            </button>
          </div>

          <div className="ld-pie__col">
            <h4>Entidades</h4>
            <p>UNGRD</p>
            <p>Alcaldía municipal · CMGRD</p>
            <p>Registraduría Nacional</p>
          </div>
        </div>

        <div className="ld-ancho">
          <p className="ld-pie__legal">
            Resilencia redacta documentos; no presta asesoría jurídica ni reemplaza a un
            abogado. Revisa todo antes de radicarlo.
            <br />
            Fotografías de Unsplash, bajo licencia de uso libre.
          </p>
        </div>
      </footer>

      {/* Fuera del flujo: es fixed y acompaña todo el scroll. La duda no llega
          en un punto concreto de la página, llega cuando llega. */}
      <BurbujaDudas />
    </div>
  );
}
