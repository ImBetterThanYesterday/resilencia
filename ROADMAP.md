# Radica — Roadmap de ejecución 24h

**Supuesto:** el reloj arranca 10:00 y la entrega es 10:00 del día siguiente.
Si el horario real es otro, corré todo el grid con el mismo offset.

---

## 0. Decisiones cerradas (no se discuten a las 10:00)

| Decisión | Elegido | Por qué |
|---|---|---|
| Backend | **Express + TypeScript + Prisma** | Es exactamente Plaxp Invoice. Cero curva. |
| DB | **SQLite** (`provider = "sqlite"` en Prisma) | Sin servidor, sin Docker, sin puertos. Un archivo. |
| Frontend | **React 19 + Vite + CSS plano (tokens + BEM)** — copiado de Plaxp ERP | ERP **no usa Tailwind**. Copiás `tokens.css` y `shared/components/ui/` y tenés la identidad visual resuelta en 20 minutos. |
| Voz | **Whisper local** (`~/whisper-models/medium.pt`) detrás de un micro-servicio Python que carga el modelo **una vez** | Sin API key, sin red, sin cuota. Cargar el modelo por request son 15s muertos. |
| LLM | **`claude-opus-5`** vía `@anthropic-ai/sdk` | Structured outputs nativos, 1M de contexto, prompt caching. |
| Recuperación jurídica | **Corpus completo en el system prompt con prompt caching** — NO vector DB | 30–40 fichas = ~16k tokens. Cabe entero. Cache read = 0.1x. Un pgvector a las 3am es cómo se pierde un hackathon. |
| PDF | **jspdf + jspdf-autotable** | Ya lo usás en Plaxp ERP. No aprendas pdfmake un día de hackathon. |
| Canal | **Botón de micrófono en web** | WhatsApp Business API es un pantano de verificación. |
| Reloj | Campo `fechaLimite` en DB + endpoint `POST /api/tick` que el demo dispara | El cron real no aporta puntos y sí riesgo. |

**Regla de oro del día:** si algo no aparece en los 60 segundos del video, no se construye.

---

## 1. Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (Vite :5173)                                      │
│  ┌───────────┐  ┌────────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Micrófono │→ │Transcripción│→│ Documento│→ │ El Reloj │  │
│  │  (1 botón)│  │  en vivo   │  │  + PDF   │  │  (T-10d) │  │
│  └───────────┘  └────────────┘  └──────────┘  └──────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │ REST
┌───────────────────────────▼─────────────────────────────────┐
│  Backend (Express :3000)                                     │
│                                                              │
│  POST /api/casos          audio → transcribir → clasificar   │
│  POST /api/casos/:id/doc  clasificación → redactar → PDF     │
│  POST /api/casos/:id/radicar   fija fechaRadicacion + límite │
│  POST /api/tick           evalúa vencidos → genera escalado  │
│  GET  /api/casos/:id                                         │
│                                                              │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────────────┐   │
│  │ transcribe │  │ clasificar  │  │ redactar             │   │
│  │  → :8000   │  │ Opus 5      │  │ Opus 5 + corpus      │   │
│  │            │  │ +schema     │  │ cacheado + streaming │   │
│  └─────┬──────┘  └──────┬──────┘  └──────────┬───────────┘   │
│        │                │                     │              │
│  ┌─────▼──────┐  ┌──────▼───────┐  ┌──────────▼───────────┐  │
│  │ plazos.ts  │  │ verificador  │  │ pdf.ts (pdfmake)     │  │
│  │ días hábil.│  │ de citas     │  │                      │  │
│  └────────────┘  └──────────────┘  └──────────────────────┘  │
└───────────────────┬──────────────────────┬───────────────────┘
                    │                      │
        ┌───────────▼────────┐   ┌─────────▼──────────┐
        │ whisper-svc :8000  │   │ corpus/fichas.json │
        │ Python, modelo     │   │ 30-40 sentencias   │
        │ cargado 1 sola vez │   │ VERIFICADAS        │
        └────────────────────┘   └────────────────────┘
```

### El verificador de citas es el diferenciador técnico

El LLM **solo puede citar sentencias que existan en `fichas.json`**. Antes de que un `radicado` llegue al PDF:

```ts
const idsValidos = new Set(fichas.map(f => f.id));   // "T-760/2008", ...
const invalidas = doc.citas.filter(c => !idsValidos.has(c.sentencia));
if (invalidas.length) {
  // se eliminan del documento y se registra el intento
  doc.citas = doc.citas.filter(c => idsValidos.has(c.sentencia));
}
```

Esto es lo que decís en el pitch: **"no alucinamos jurisprudencia: el corpus es cerrado y cada cita se valida contra el índice antes de imprimirse."** Un jurado con formación jurídica te va a buscar exactamente esa falla.

---

## 2. Modelo de datos (Prisma, completo)

```prisma
datasource db { provider = "sqlite"; url = "file:./radica.db" }
generator client { provider = "prisma-client-js" }

model Caso {
  id              String   @id @default(cuid())
  createdAt       DateTime @default(now())

  // entrada
  audioPath       String?
  transcripcion   String

  // clasificación (JSON string; SQLite no tiene Json nativo)
  clasificacion   String
  instrumento     String   // DERECHO_PETICION | TUTELA | QUEJA_SUPERSALUD | PQRS
  entidad         String
  derechos        String   // "salud,vida digna,seguridad social"
  urgencia        String   // ALTA | MEDIA | BAJA
  medidaProv      Boolean  @default(false)

  // documento
  documentoMd     String?
  pdfPath         String?
  citas           String?  // JSON: [{sentencia, ratio}]

  // el reloj
  estado          String   @default("BORRADOR")
  // BORRADOR | RADICADO | VENCIDO | ESCALADO
  fechaRadicacion DateTime?
  fechaLimite     DateTime?
  diasPlazo       Int?
  siguientePaso   String?  // TUTELA | INCIDENTE_DESACATO | null

  casoPadreId     String?  // el escalado apunta al original
  casoPadre       Caso?    @relation("Escalada", fields: [casoPadreId], references: [id])
  escalados       Caso[]   @relation("Escalada")
}
```

---

## 3. Tabla de plazos (`src/plazos.ts`)

> ⚠️ **VERIFICAR CADA FILA CONTRA LA NORMA ANTES DE QUE SALGA EN UN PDF.**
> Esto es de memoria. Es el trabajo del H+1 de quien no esté codeando.
> Un plazo mal puesto en el demo es peor que no tener el reloj.

| Instrumento | Plazo | Norma (verificar) | Si vence |
|---|---|---|---|
| Derecho de petición — general | 15 días hábiles | Ley 1755/2015, art. 14 | → Tutela por violación al art. 23 CP |
| Derecho de petición — documentos/información | 10 días hábiles | Ley 1755/2015, art. 14 | → Tutela |
| Derecho de petición — consultas | 30 días hábiles | Ley 1755/2015, art. 14 | → Tutela |
| Petición ante particular (EPS) | mismo régimen | Ley 1755/2015, art. 32 | → Tutela |
| Tutela — fallo | 10 días (corridos) | Decreto 2591/1991, art. 29 | → Impugnación / desacato |
| Tutela — cumplimiento del fallo | 48 horas | Decreto 2591/1991, art. 27 | → Incidente de desacato |
| Incidente de desacato | — | Decreto 2591/1991, art. 52 | Arresto ≤6 meses + multa ≤20 SMLMV |
| Medida provisional | inmediata | Decreto 2591/1991, art. 7 | (se pide con la tutela) |

**Función de días hábiles:** necesitás excluir sábados, domingos y festivos de Colombia. No busqués una librería a las 2am — hardcodeá el array de festivos 2026 en un `festivos.ts` (18 fechas). 10 minutos.

```ts
export function diasHabiles(desde: Date, n: number): Date {
  let d = new Date(desde), contados = 0;
  while (contados < n) {
    d.setDate(d.getDate() + 1);
    const dia = d.getDay();
    if (dia !== 0 && dia !== 6 && !FESTIVOS_2026.has(iso(d))) contados++;
  }
  return d;
}
```

---

## 4. Contratos de API

```
POST /api/casos
  multipart: audio (webm/wav)  |  o { texto: string } para debug sin micrófono
  → 200 { id, transcripcion, clasificacion }

POST /api/casos/:id/doc
  → 200 (stream de texto)  luego  { documentoMd, citas, pdfUrl }

POST /api/casos/:id/radicar
  body { canal: "PRESENCIAL"|"EMAIL"|"WEB" }
  → 200 { fechaRadicacion, fechaLimite, diasPlazo, siguientePaso }

POST /api/tick
  body { fechaSimulada?: string }   // ← el demo salta 16 días con esto
  → 200 { vencidos: [{casoId, escaladoId, instrumento}] }

GET /api/casos/:id  → todo el caso + escalados
```

`POST /api/tick` es el truco del demo: en vez de esperar 15 días, mandás `fechaSimulada`. El jurado ve el escalamiento automático en 3 segundos. **Decilo explícitamente en el video** ("simulamos el paso del tiempo") — que te vean honesto suma más de lo que resta.

---

## 5. Corpus jurídico — el cuello de botella real

**No es código, es curaduría. Empezalo a las 10:00, no a las 20:00.**

- **Objetivo:** 30 fichas. **Mínimo aceptable: 12.** Menos que eso y el drafter no tiene de dónde citar.
- **Fuente:** relatoría de la Corte Constitucional, filtro derecho a la salud.
- **Ancla estructural:** T-760/2008 (la sentencia estructural de salud). Desde ahí, bajá las de los últimos 3 años.
- **Formato de cada ficha** (`corpus/fichas.json`):

```json
{
  "id": "T-760/2008",
  "año": 2008,
  "tema": "acceso a servicios no incluidos en el plan de beneficios",
  "supuesto": "La EPS niega un servicio alegando que no está en el PBS y el usuario no puede pagarlo",
  "ratio": "Texto literal o parafraseado fiel de la regla que fija la Corte. 2-4 líneas.",
  "aplicaSi": ["negacion_no_pbs", "capacidad_pago_insuficiente"],
  "verificadaPor": "nombre",
  "verificadaEl": "2026-08-15"
}
```

**Regla dura:** una ficha sin `verificadaPor` **no entra al corpus**. Que alguien haya abierto la sentencia y leído la ratio. Si nadie la verificó, se queda afuera aunque tengas 8 fichas. Ocho citas reales le ganan a treinta inventadas — y la diferencia es que a las inventadas te las cachan.

---

## 6. Grid hora por hora

### Bloque 1 — Andamiaje (10:00–14:00)

| Hora | Trabajo | Entregable verificable |
|---|---|---|
| 10:00–10:30 | `git init`, scaffolding, `.env`, `prisma migrate dev` **+ trasplante visual del ERP** (ver §11) | `npm run dev` levanta ambos, DB creada, un `<Button>` morado en pantalla |
| 10:30–11:15 | `whisper-svc`: FastAPI que carga `medium.pt` al arrancar, `POST /transcribe` | `curl` con un .wav devuelve texto en <5s |
| 10:30–13:00 | **(paralelo)** Curaduría del corpus: 12 fichas verificadas | `fichas.json` con 12 entradas y `verificadaPor` |
| 11:15–12:00 | `POST /api/casos` con `{texto}` (sin audio todavía) + clasificador con structured output | Postman: texto → JSON de clasificación correcta |
| 12:00–13:00 | `plazos.ts` + `festivos.ts` + tests de días hábiles | 3 casos de prueba pasan (incluido uno que cruza festivo) |
| 13:00–14:00 | Redactor: clasificación + corpus cacheado → markdown del documento | Se imprime en consola un derecho de petición coherente |

**🚩 GATE 14:00 — texto → documento funciona de punta a punta.** Si no, cortá la voz del scope y hacé el demo con teclado. El pitch sobrevive; un pipeline roto no.

### Bloque 2 — El producto (14:00–20:00)

| Hora | Trabajo | Entregable |
|---|---|---|
| 14:00–15:00 | Verificador de citas + `pdf.ts` con pdfmake | Se abre un PDF con encabezado, hechos, petición, fundamento, firma |
| 15:00–16:00 | Frontend: botón mic → `MediaRecorder` → POST → transcripción en pantalla | La voz aparece como texto en el navegador |
| 16:00–17:00 | Conectar el pipeline completo en la UI (voz → clasif → doc → PDF) | Un clic, un PDF descargado |
| 17:00–18:00 | **El Reloj**: `/radicar`, `/tick`, componente de cuenta regresiva | Radicás, saltás la fecha, aparece el escalamiento |
| 18:00–19:00 | Disclaimer legal + paso de revisión humana + pulido de la pantalla del reloj | El aviso "redacta, no asesora" es visible sin scroll |
| 19:00–20:00 | **Congelar features.** Ensayo completo del flujo, 5 veces seguidas | 5/5 sin errores en consola |

**🚩 GATE 20:00 — feature freeze.** A partir de acá solo se arreglan bugs que rompen el demo.

### Bloque 3 — Lo que puntúa (20:00–02:00)

| Hora | Trabajo |
|---|---|
| 20:00–22:00 | **Grabar el video.** Sí, ahora. Con 10 horas de colchón, no con una. |
| 22:00–23:00 | Editar. Si sale mal, tenés tiempo de regrabar — ese es el punto de hacerlo temprano. |
| 23:00–00:00 | README + arquitectura + cómo correrlo. El jurado lee esto. |
| 00:00–01:00 | Slides del modelo de negocio (las 3 capas + escala global) |
| 01:00–02:00 | Ampliar corpus de 12 → 30 fichas si el tiempo alcanzó (esto sí escala linealmente) |

### Bloque 4 — Colchón (02:00–10:00)

| Hora | Trabajo |
|---|---|
| 02:00–06:00 | Dormir. En serio. El bloque 3 ya te dejó entregable. |
| 06:00–08:00 | Bugs, regrabar el video si algo quedó flojo |
| 08:00–09:00 | Ensayo final ×3, screenshots, verificar que el .zip/repo abre limpio en otra máquina |
| 09:00–10:00 | Entregar. **No tocar código.** |

---

## 7. Plan de video (grabar 20:00, no 08:00)

| Tiempo | Pantalla | Audio |
|---|---|---|
| 0:00–0:10 | Botón de micrófono, onda de audio real | Voz real: *"Mi mamá lleva tres meses esperando que le autoricen la cirugía."* |
| 0:10–0:20 | Transcripción apareciendo palabra por palabra | silencio o música baja |
| 0:20–0:35 | Panel de clasificación: `TUTELA · derecho a la salud · EPS Sanitas · urgencia ALTA` + la cita con su número de sentencia + el PDF abriéndose | — |
| 0:35–0:50 | El reloj: `10 días hábiles · vence 29 de agosto`. Salto de fecha. Aparece solo: *incidente de desacato generado* | — |
| 0:50–1:00 | Negro. Un número: **1.202.436** — luego, chico: *tutelas radicadas en Colombia en 2025* | — |

**Grabá en 1080p, sin cursor errático, sin DevTools abierto.** Ensayá el clic 3 veces antes de grabar.

---

## 8. Riesgo regulatorio (esto vale puntos)

Poné en el producto, visible, no en un footer:

> **Radica redacta documentos; no presta asesoría jurídica ni sustituye a un abogado.**
> Todo documento debe ser revisado por la persona antes de radicarse.

Y agregá un paso literal de "Revisar y editar" antes del PDF. Es una pantalla de 20 minutos que te separa del proyecto de hackathon: DoNotPay fue sancionado por la FTC por venderse como abogado, y podés decirlo en el video.

---

## 9. Economía unitaria (número para el pitch)

Con el corpus cacheado (~16k tokens, `ttl: "1h"`):

- Entrada cacheada: 16.000 × 0,1 × $5/1M ≈ **$0,008**
- Salida (~2.500 tokens de documento): 2.500 × $25/1M ≈ **$0,063**
- **Costo de IA por documento: ~$0,07 USD ≈ COP 280**

Contra un precio de COP 25.000 por caso con seguimiento: **margen bruto >98% en el costo de inferencia.** Eso es una línea de slide, no una nota al pie.

---

## 10. Recorte de emergencia (si vas solo o te atrasás)

Cortá en este orden, sin dudar:

1. Corpus de 30 → 12 fichas
2. Multi-instrumento → solo derecho de petición + tutela (matá queja y PQRS)
3. Voz → botón de "usar audio de ejemplo" pregrabado
4. PDF bonito → PDF feo pero radicable
5. **Nunca cortes:** el reloj. Es el diferenciador. Sin reloj sos DoNotPay en español.

---

## 11. Trasplante visual desde Plaxp ERP (20 minutos, 10:00–10:20)

Origen: `~/Desktop/Plaxp/Plaxp ERP/Frontend`

### Qué copiar tal cual

```bash
SRC="/Users/yeslerlorio/Desktop/Plaxp/Plaxp ERP/Frontend/src"
DST="./src"

# 1. Los tokens = la identidad visual entera (3 archivos)
cp -r "$SRC/shared/styles" "$DST/shared/styles"
#   tokens.css  → --color-primary #6a48bf, --color-card #1a1f27, radios, sombras, motion
#   reset.css
#   globals.css

# 2. Solo los componentes que Radica usa de verdad
mkdir -p "$DST/shared/components/ui"
for c in Button Input Select Modal Badge Toast EmptyState ContentLoader SearchInput Money; do
  cp -r "$SRC/shared/components/ui/$c" "$DST/shared/components/ui/"
done
```

**No copies** `DataTable`, `ImageCropper`, `LocationPickerModal`, `RichTextEditor`,
`VariacionesModal`, `ExportDropdown`. Arrastran `konva`, `zxing`, `tiptap`, `dnd-kit`
y `google-maps` — media hora de `npm install` para nada.

### Dependencias reales de Radica

El `package.json` del ERP tiene ~30 dependencias (remotion, tesseract, socket.io,
papaparse, exceljs…). Copiarlo entero es autosabotaje. Instalá solo:

```
react react-dom react-router-dom
@phosphor-icons/react     ← el ERP migró a Phosphor, no a lucide
framer-motion             ← para la animación del reloj
jspdf jspdf-autotable     ← ya sabés usarlo
```

### Convención de nombres (respetala, es la del ERP)

```
.ui-*            → componentes de shared/ui        (copiados, no los toques)
.app-*           → layout                          (AppLayout, Sidebar)
.ft-radica-*     → todo lo nuevo de este proyecto
```

BEM estricto: `.ft-radica-reloj`, `.ft-radica-reloj__dias`, `.ft-radica-reloj--vencido`.

### Ojo: **no existe un componente `Card` en el ERP**

Las cards son clases BEM por feature (`dashboard-card`, `compra-detail__card`,
`venta-detail__card`), no un componente compartido. Para Radica escribís la tuya
una vez, sobre los tokens:

```css
/* src/features/casos/css/casos.css */
.ft-radica-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-soft);
  padding: var(--space-5);
  transition: box-shadow var(--dur-base) var(--ease-out);
}
.ft-radica-card:hover { box-shadow: var(--shadow-medium); }
.ft-radica-card__title {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-2);
}
```

### La ventaja no es estética, es de tiempo

La rúbrica dice que la estética no puntúa. El trasplante no se hace para verse lindo:
se hace para que **no gastes ni un minuto decidiendo colores, radios o espaciados**
un día que tenés 24 horas. Tema oscuro + morado #6a48bf ya resuelto, y de paso el
demo se ve como un producto y no como un `create-vite-app`.

### Estructura de carpetas (la misma del ERP, feature-sliced)

```
src/
  shared/
    components/ui/      ← copiado
    styles/             ← copiado
    lib/api.ts
  features/
    casos/
      api/  hooks/  components/  pages/  css/
  app/
    layouts/  router/
```

