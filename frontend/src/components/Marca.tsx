/**
 * Marca de Resilencia — la R dentro de un círculo.
 *
 * El círculo no es decoración: un radicado es un sello redondo. La marca es
 * el sello que la persona no consigue en la ventanilla.
 *
 * Dos gestos sacan la R de la forma común:
 *   · el bowl no cierra contra el asta — queda un aire, el trámite abierto;
 *   · la pierna termina en un punto de azul vivo, la tinta del sello.
 *
 * Los colores van en hex y no en var(): las custom properties no resuelven
 * de forma confiable dentro de atributos de presentación SVG.
 */

const AZUL = '#1E3A5F';
const ACENTO = '#1B6AC9';

export function MarcaR({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label="Resilencia"
    >
      <circle cx="16" cy="16" r="16" fill={AZUL} />

      {/* asta */}
      <path d="M12.4 9.4v13.2" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />

      {/* bowl, con aire antes de cerrar */}
      <path
        d="M12.4 9.4h4.3a3.75 3.75 0 0 1 0 7.5h-2.4"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* pierna */}
      <path d="m16.5 16.9 3.8 5.1" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />

      {/* tinta del sello */}
      <circle cx="21.4" cy="22.7" r="1.6" fill={ACENTO} />
    </svg>
  );
}
