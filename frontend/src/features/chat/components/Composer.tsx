import { useEffect, useRef, useState } from 'react';
import type { Adjunto } from '../../../types';
import { IconClip, IconDoc, IconMic, IconSend, IconStop, IconX } from '../../../components/icons';

interface Props {
  sugerencias: string[];
  pensando: boolean;
  onEnviar: (texto: string, adjuntos: Adjunto[]) => void;
  /** Texto que "transcribe" el micrófono en el demo. */
  textoDemoAudio?: string;
}

const MAX_ARCHIVOS = 6;
const MAX_MB = 10;

function pesoLegible(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

let seq = 0;

export function Composer({ sugerencias, pensando, onEnviar, textoDemoAudio }: Props) {
  const [texto, setTexto] = useState('');
  const [adjuntos, setAdjuntos] = useState<Adjunto[]>([]);
  const [grabando, setGrabando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [transcribiendo, setTranscribiendo] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const areaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, [texto]);

  useEffect(() => {
    if (!grabando) return;
    const t = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [grabando]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 3500);
    return () => clearTimeout(t);
  }, [aviso]);

  function agregarArchivos(lista: FileList | null) {
    if (!lista?.length) return;
    const nuevos: Adjunto[] = [];

    for (const f of Array.from(lista)) {
      if (adjuntos.length + nuevos.length >= MAX_ARCHIVOS) {
        setAviso(`Máximo ${MAX_ARCHIVOS} archivos por mensaje.`);
        break;
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        setAviso(`"${f.name}" pesa más de ${MAX_MB} MB.`);
        continue;
      }
      nuevos.push({
        id: `adj${++seq}`,
        nombre: f.name,
        url: URL.createObjectURL(f),
        esImagen: f.type.startsWith('image/'),
        peso: pesoLegible(f.size),
      });
    }
    if (nuevos.length) setAdjuntos((prev) => [...prev, ...nuevos]);
  }

  function quitar(id: string) {
    setAdjuntos((prev) => {
      const fuera = prev.find((a) => a.id === id);
      if (fuera) URL.revokeObjectURL(fuera.url);
      return prev.filter((a) => a.id !== id);
    });
  }

  function enviar() {
    const t = texto.trim();
    if ((!t && adjuntos.length === 0) || pensando) return;
    onEnviar(t, adjuntos);
    setTexto('');
    setAdjuntos([]);
  }

  async function alternarGrabacion() {
    if (grabando) {
      recRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      recRef.current = rec;

      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setGrabando(false);
        setSegundos(0);
        setTranscribiendo(true);
        // TODO: POST /transcribe (whisper-svc :8000) con el Blob real.
        setTimeout(() => {
          setTranscribiendo(false);
          setTexto(textoDemoAudio ?? '');
          areaRef.current?.focus();
        }, 900);
      };

      rec.start();
      setGrabando(true);
    } catch {
      setTranscribiendo(true);
      setTimeout(() => {
        setTranscribiendo(false);
        setTexto(textoDemoAudio ?? '');
      }, 600);
    }
  }

  const mmss = `${String(Math.floor(segundos / 60)).padStart(2, '0')}:${String(
    segundos % 60,
  ).padStart(2, '0')}`;

  const puedeEnviar = (texto.trim().length > 0 || adjuntos.length > 0) && !pensando && !grabando;

  return (
    <div
      className="rd-composer"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        agregarArchivos(e.dataTransfer.files);
      }}
    >
      {sugerencias.length > 0 && !pensando && (
        <div className="rd-sugerencias">
          {sugerencias.map((s, i) => (
            <button key={i} type="button" className="rd-sugerencia" onClick={() => onEnviar(s, [])}>
              {s}
            </button>
          ))}
        </div>
      )}

      {aviso && <p className="rd-aviso-archivo">{aviso}</p>}

      {adjuntos.length > 0 && (
        <ul className="rd-adjuntos rd-adjuntos--previa">
          {adjuntos.map((a) => (
            <li key={a.id} className="rd-adj">
              {a.esImagen ? (
                <img className="rd-adj__mini" src={a.url} alt="" />
              ) : (
                <span className="rd-adj__mini rd-adj__mini--doc">
                  <IconDoc size={16} />
                </span>
              )}
              <span className="rd-adj__info">
                <span className="rd-adj__nombre">{a.nombre}</span>
                <span className="rd-adj__peso">{a.peso}</span>
              </span>
              <button
                type="button"
                className="rd-adj__quitar"
                onClick={() => quitar(a.id)}
                aria-label={`Quitar ${a.nombre}`}
              >
                <IconX size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className={`rd-composer__caja ${grabando ? 'rd-composer__caja--grabando' : ''}`}>
        {grabando ? (
          <div className="rd-grabando">
            <span className="rd-grabando__punto" />
            <span className="rd-grabando__texto">Grabando…</span>
            <span className="rd-grabando__tiempo">{mmss}</span>
            <div className="rd-onda">
              {Array.from({ length: 14 }).map((_, i) => (
                <span key={i} style={{ animationDelay: `${i * 70}ms` }} />
              ))}
            </div>
          </div>
        ) : (
          <textarea
            ref={areaRef}
            className="rd-composer__area"
            rows={1}
            value={transcribiendo ? 'Transcribiendo el audio…' : texto}
            disabled={transcribiendo}
            placeholder="Escribe, manda un audio o sube una foto…"
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                enviar();
              }
            }}
          />
        )}

        <div className="rd-composer__acciones">
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,application/pdf"
            hidden
            onChange={(e) => {
              agregarArchivos(e.target.files);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            className="rd-icon-btn"
            onClick={() => fileRef.current?.click()}
            disabled={pensando || grabando || transcribiendo}
            aria-label="Adjuntar foto o documento"
          >
            <IconClip size={20} />
          </button>

          <button
            type="button"
            className={`rd-icon-btn ${grabando ? 'rd-icon-btn--rec' : ''}`}
            onClick={alternarGrabacion}
            disabled={pensando || transcribiendo}
            aria-label={grabando ? 'Detener grabación' : 'Grabar audio'}
          >
            {grabando ? <IconStop size={18} /> : <IconMic size={20} />}
          </button>

          <button
            type="button"
            className="rd-icon-btn rd-icon-btn--enviar"
            onClick={enviar}
            disabled={!puedeEnviar}
            aria-label="Enviar"
          >
            <IconSend size={20} />
          </button>
        </div>
      </div>

      <p className="rd-disclaimer">
        Resilencia redacta documentos; no presta asesoría jurídica ni reemplaza a un abogado.
        Revisa todo antes de radicarlo.
      </p>
    </div>
  );
}
