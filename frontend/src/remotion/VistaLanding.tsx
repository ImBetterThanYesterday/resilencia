import '../index.css';
import { AbsoluteFill } from 'remotion';
import { LandingPage } from '../features/landing/LandingPage';

/**
 * Vista de revisión de la landing. No entra en ningún video.
 *
 * Las secciones aparecen con IntersectionObserver, que nunca dispara en un
 * render de un solo cuadro: se fuerzan visibles para poder mirarlas.
 */
export function VistaLanding() {
  return (
    <AbsoluteFill style={{ background: '#f8faf9', overflow: 'hidden' }}>
      <style>{`
        .ld *, .ld *::before, .ld *::after {
          animation: none !important;
          transition: none !important;
          opacity: 1 !important;
          transform: none !important;
        }
      `}</style>
      <div style={{ width: 1200 }}>
        <LandingPage onEntrar={() => {}} />
      </div>
    </AbsoluteFill>
  );
}
