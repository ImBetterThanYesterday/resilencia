import { useRef } from 'react';
import { soportesPara } from '../../../data/soportes';
import { IconCheck, IconClip, IconX } from '../../../components/icons';

export interface Adjuntado {
  nombre: string;
  archivo: string;
  url: string;
  esImagen: boolean;
}

interface Props {
  situaciones: string[];
  subidos: Record<string, Adjuntado>;
  onAdjuntar: (id: string, nombre: string, archivo: File) => void;
  onQuitar: (id: string) => void;
}

/**
 * Anexos del caso, dentro del formulario.
 *
 * Estaban en el chat y ahí sobraban: pedirle archivos a alguien a mitad de una
 * conversación lo obliga a parar, buscar en el celular y volver. Acá van con el
 * resto de lo que se pide una sola vez, antes de que el asistente hable.
 *
 * Solo se piden los documentos que las situaciones marcadas exigen, cada fila
 * dice para qué sirve, y se puede seguir sin tener todo: faltar un papel no
 * puede ser el motivo por el que alguien abandona el trámite.
 */
export function Soportes({ situaciones, subidos, onAdjuntar, onQuitar }: Props) {
  const lista = soportesPara(situaciones);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  const obligatorios = lista.filter((s) => !s.opcional);
  const listos = obligatorios.filter((s) => subidos[s.id]).length;
  const total = obligatorios.length;

  return (
    <div className="rg-sop">
      <header className="rg-sop__cab">
        <span className="rg-sop__cuenta">
          {listos} de {total} listos
        </span>
        <span className="rg-sop__barra">
          <i style={{ width: `${total ? (listos / total) * 100 : 0}%` }} />
        </span>
      </header>

      <ul className="rg-sop__lista">
        {lista.map((s) => {
          const yaEsta = subidos[s.id];
          return (
            <li key={s.id} className={`rg-sop__item ${yaEsta ? 'rg-sop__item--ok' : ''}`}>
              <span className="rg-sop__marca" aria-hidden="true">
                {yaEsta ? <IconCheck size={13} /> : null}
              </span>

              <div className="rg-sop__texto">
                <span className="rg-sop__nombre">
                  {s.nombre}
                  {s.opcional && <em>opcional</em>}
                </span>
                <span className="rg-sop__porque">{s.porQue}</span>

                {yaEsta && (
                  <span className="rg-sop__archivo">
                    {yaEsta.esImagen && <img src={yaEsta.url} alt="" />}
                    <span>{yaEsta.archivo}</span>
                    <button
                      type="button"
                      onClick={() => onQuitar(s.id)}
                      aria-label={`Quitar ${s.nombre}`}
                    >
                      <IconX size={12} />
                    </button>
                  </span>
                )}
              </div>

              {!yaEsta && (
                <>
                  <input
                    ref={(el) => {
                      inputs.current[s.id] = el;
                    }}
                    type="file"
                    accept="image/*,application/pdf"
                    hidden
                    onChange={(e) => {
                      const archivo = e.target.files?.[0];
                      if (archivo) onAdjuntar(s.id, s.nombre, archivo);
                      e.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    className="rg-sop__subir"
                    onClick={() => inputs.current[s.id]?.click()}
                  >
                    <IconClip size={15} />
                    Adjuntar
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
