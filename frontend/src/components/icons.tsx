// SVG inline: cero dependencias de íconos.
// Si después querés unificar con el ERP, se reemplazan por @phosphor-icons/react.

interface P {
  size?: number;
  className?: string;
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export const IconMic = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="9" y="2" width="6" height="12" rx="3" />
    <path d="M5 10a7 7 0 0 0 14 0" />
    <path d="M12 17v5" />
  </svg>
);

export const IconSend = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M4 12 20 4l-8 16-2-7-6-1Z" />
  </svg>
);

export const IconStop = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none" />
  </svg>
);

export const IconCheck = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="m4 12.5 5 5L20 6.5" />
  </svg>
);

export const IconX = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const IconHelp = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.2 2.4c-.6.2-.7.7-.7 1.3" />
    <path d="M12 17h.01" />
  </svg>
);

export const IconDoc = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M14 3v5h5" />
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
    <path d="M9 13h6M9 17h4" />
  </svg>
);

export const IconDownload = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3v12" />
    <path d="m7 11 5 5 5-5" />
    <path d="M4 20h16" />
  </svg>
);

export const IconClock = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5.5l3.5 2" />
  </svg>
);

export const IconAlert = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 4 2.5 20h19L12 4Z" />
    <path d="M12 10v4M12 17.5h.01" />
  </svg>
);

export const IconClip = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M20 11.5 12.3 19a4.6 4.6 0 0 1-6.5-6.5l7.9-7.9a3 3 0 0 1 4.3 4.3l-7.8 7.9a1.5 1.5 0 0 1-2.2-2.1l7.1-7.2" />
  </svg>
);

export const IconImagen = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="8.5" cy="9.5" r="1.5" />
    <path d="m4 17 4.5-4.5 3 3L15 12l5 5" />
  </svg>
);

export const IconGratis = ({ size = 22, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M15 9.2A3.2 3.2 0 0 0 12 7.5c-1.5 0-2.6.8-2.6 2s1 1.7 2.6 2 2.8.9 2.8 2.1-1.2 2.1-2.8 2.1a3.3 3.3 0 0 1-3-1.7" />
    <path d="M12 6v12" />
  </svg>
);

export const IconPersona = ({ size = 22, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </svg>
);

export const IconSello = ({ size = 22, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M14 3v5h5" />
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
    <path d="m9 14 2 2 4-4" />
  </svg>
);

export const IconShield = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" />
  </svg>
);
