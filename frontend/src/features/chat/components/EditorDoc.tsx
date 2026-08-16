import { useEffect, useRef, useState } from 'react';
import type { Documento } from '../../../types';
import { huecos } from '../../../lib/documento';
import { IconAlert, IconX } from '../../../components/icons';

/**
 * «Revisar y editar».
 *
 * El escrito sale a nombre de la persona y lo firma ella, así que tiene que
 * poder cambiar cada palabra antes de radicarlo. Un documento generado que no
 * se deja corregir obliga a lo peor: copiar el texto a Word, perder el formato
 * y radicar algo que ya nadie revisó.
 *
 * Un textarea y no un editor rico a propósito. Lo que se radica es texto
 * corrido; negritas y viñetas solo darían formas de romper la maquetación del
 * PDF sin agregar nada que el escrito necesite.
 */

interface Props {
  doc: Documento;
  cuerpo: string;
  onGuardar: (cuerpo: string) => void;
  onCerrar: () => void;
}

export function EditorDoc({ doc, cuerpo, onGuardar, onCerrar }: Props) {
  const [texto, setTexto] = useState(cuerpo);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const faltantes = huecos(texto);
  const sucio = texto !== cuerpo;

  useEffect(() => {
    areaRef.current?.focus();
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar();
    };
    // El fondo no debe seguir haciendo scroll detrás del panel.
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', alTeclear);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', alTeclear);
    };
  }, [onCerrar]);

  return (
    <div
      className="rd-editor"
      role="dialog"
      aria-modal="true"
      aria-label={`Editar ${doc.titulo}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
    >
      <div className="rd-editor__panel">
        <header className="rd-editor__cab">
          <div>
            <p className="rd-editor__ojo">Revisar y editar</p>
            <h3 className="rd-editor__titulo">{doc.titulo}</h3>
          </div>
          <button
            type="button"
            className="rd-editor__cerrar"
            onClick={onCerrar}
            aria-label="Cerrar el editor"
          >
            <IconX size={16} />
          </button>
        </header>

        <p className="rd-editor__nota">
          El encabezado, el fundamento legal y tu firma se arman solos con tus datos.
          Acá editas lo que le pides a la entidad.
        </p>

        <textarea
          ref={areaRef}
          className="rd-editor__area"
          value={texto}
          spellCheck
          onChange={(e) => setTexto(e.target.value)}
        />

        {faltantes.length > 0 && (
          <p className="rd-editor__alerta">
            <IconAlert size={14} />
            <span>
              Queda sin llenar: {faltantes.join(', ')}. Si lo radicas así, la entidad
              puede devolverlo.
            </span>
          </p>
        )}

        <footer className="rd-editor__pie">
          <button type="button" className="rd-btn rd-btn--plano" onClick={onCerrar}>
            Cancelar
          </button>
          <button
            type="button"
            className="rd-btn rd-btn--solido"
            onClick={() => onGuardar(texto)}
            disabled={!sucio}
          >
            Guardar cambios
          </button>
        </footer>
      </div>
    </div>
  );
}
