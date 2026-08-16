import { Composition } from 'remotion';
import { Demo } from './Demo';
import { Vista } from './Vista';
import { VistaForm, VistaSoportes } from './VistaForm';
import { VistaLanding } from './VistaLanding';

/** 1080×1920 · 30 fps · 450 cuadros = 15 s exactos. */
export function RemotionRoot() {
  return (
    <>
      <Composition
      id="Demo"
      component={Demo}
      durationInFrames={750}
      fps={30}
      width={1080}
      height={1920}
    />
      <Composition
        id="Vista"
        component={Vista}
        durationInFrames={1}
        fps={1}
        width={620}
        height={4620}
      />
      <Composition
        id="VistaForm"
        component={VistaForm}
        durationInFrames={4}
        fps={1}
        width={900}
        height={1400}
      />
      <Composition
        id="VistaSoportes"
        component={VistaSoportes}
        durationInFrames={1}
        fps={1}
        width={900}
        height={1400}
      />
      <Composition
        id="VistaLanding"
        component={VistaLanding}
        durationInFrames={1}
        fps={1}
        width={1200}
        height={9000}
      />
    </>
  );
}
