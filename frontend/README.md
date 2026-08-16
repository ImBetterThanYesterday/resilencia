# Resilencia — frontend

React 19 + Vite 8 + TypeScript. El contexto del proyecto, el problema que resuelve y las decisiones de arquitectura están en el [README de la raíz](../README.md).

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # tsc -b && vite build
npm run lint         # oxlint
npm run video        # Remotion Studio
npm run video:render # renderiza el demo a out/resiliencia.mp4
```

## Notas para trabajar acá

**El Root Directory de Vercel es esta carpeta**, no la raíz del repo. `vercel.json` reescribe todas las rutas a `index.html` porque el enrutado es del lado del cliente (`src/lib/rutas.ts`, sobre la History API).

**CSS plano, sin Tailwind.** Los tokens están en `src/styles/tokens.css` y cada feature trae su hoja en `css/`. El acento de la marca es `--ld-acento` / `--rd-acento` / `--rg-acento` según la feature; se cambia en un solo lugar por hoja.

**jsPDF entra por `import()` dinámico** en `src/lib/pdf.ts`. Si lo pasás a import estático, el bundle inicial pasa de ~80 KB a ~210 KB gzip para todo el mundo.

**`VITE_AGENTE_URL`** apunta al webhook del agente de dudas. Lo que lleve prefijo `VITE_` termina en el bundle y es público: nunca metas una API key ahí.
