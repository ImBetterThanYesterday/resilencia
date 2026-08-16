/**
 * Bandera de Colombia.
 *
 * Proporción oficial 2:3, con el amarillo ocupando la mitad superior y el azul
 * y el rojo un cuarto cada uno. Va en SVG y no como emoji: el emoji se ve
 * distinto en cada sistema operativo y en Windows ni siquiera se renderiza.
 */

const AMARILLO = '#FCD116';
const AZUL = '#003893';
const ROJO = '#CE1126';

export function BanderaCO({ size = 18 }: { size?: number }) {
  const alto = (size * 2) / 3;
  return (
    <svg
      width={size}
      height={alto}
      viewBox="0 0 30 20"
      role="img"
      aria-label="Colombia"
      className="bandera-co"
    >
      <rect width="30" height="10" fill={AMARILLO} />
      <rect y="10" width="30" height="5" fill={AZUL} />
      <rect y="15" width="30" height="5" fill={ROJO} />
      {/* filete tenue: sin él, el amarillo se desangra contra fondos claros */}
      <rect
        width="30"
        height="20"
        fill="none"
        stroke="rgba(30,58,95,0.16)"
        strokeWidth="1"
      />
    </svg>
  );
}
