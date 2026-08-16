# Radica — Prompts y llamadas al modelo (listos para pegar)

Modelo: `claude-opus-5`. SDK: `@anthropic-ai/sdk`.
En Opus 5 el thinking está **encendido por defecto**. No lo desactives — controlá costo
y latencia con `output_config.effort`. Desactivarlo tiene modos de falla feos
(fugas de `<thinking>` en el texto visible).

---

## 1. Clasificador — `src/ai/clasificar.ts`

Un solo llamado. Structured output garantizado por schema, no por prompt.
`effort: "low"` porque es una tarea de extracción, no de razonamiento profundo.

```ts
import Anthropic from "@anthropic-ai/sdk";
const client = new Anthropic();

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "instrumento", "justificacionInstrumento", "entidadAccionada", "tipoEntidad",
    "derechosInvocados", "hechos", "peticionConcreta", "urgencia",
    "requiereMedidaProvisional", "datosFaltantes", "confianza"
  ],
  properties: {
    instrumento: {
      type: "string",
      enum: ["DERECHO_PETICION", "TUTELA", "QUEJA_SUPERSALUD", "PQRS"],
      description: "El instrumento jurídico correcto para ESTE momento del caso."
    },
    justificacionInstrumento: {
      type: "string",
      description: "Una frase: por qué este instrumento y no otro. Se le muestra a la persona."
    },
    entidadAccionada: {
      type: "string",
      description: "Nombre de la entidad tal como la nombró la persona. Si no la nombró, 'NO_IDENTIFICADA'."
    },
    tipoEntidad: {
      type: "string",
      enum: ["EPS", "IPS", "ENTIDAD_PUBLICA", "EMPRESA_SERVICIOS_PUBLICOS", "OTRO", "NO_IDENTIFICADA"]
    },
    derechosInvocados: {
      type: "array",
      items: { type: "string" },
      description: "Derechos fundamentales en juego. Ej: 'salud', 'vida digna', 'seguridad social', 'petición'."
    },
    hechos: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["orden", "hecho", "fecha"],
        properties: {
          orden: { type: "integer" },
          hecho: { type: "string", description: "Un hecho por entrada, en tercera persona, sin adjetivos." },
          fecha: { type: "string", description: "Fecha o periodo si la persona lo dijo; 'NO_INDICADA' si no." }
        }
      }
    },
    peticionConcreta: {
      type: "string",
      description: "Qué se le pide exactamente a la entidad. Verbo + objeto + plazo. Sin retórica."
    },
    urgencia: { type: "string", enum: ["ALTA", "MEDIA", "BAJA"] },
    requiereMedidaProvisional: {
      type: "boolean",
      description: "true solo si hay riesgo inminente para la vida o la integridad."
    },
    datosFaltantes: {
      type: "array",
      items: { type: "string" },
      description: "Datos que hay que preguntarle a la persona antes de radicar. Ej: 'número de cédula del paciente'."
    },
    confianza: { type: "number", description: "0 a 1. Bajá de 0.6 si el relato es ambiguo." }
  }
} as const;

const SYSTEM_CLASIFICADOR = `
Sos un clasificador de reclamos ciudadanos en Colombia, especializado en salud.
Recibís la transcripción literal de alguien contando un problema en lenguaje coloquial,
con muletillas, sin términos jurídicos y muchas veces sin orden cronológico.

Tu trabajo es UNO: convertir ese relato en datos estructurados. No redactás documentos,
no das consejos, no consolás, no opinás sobre el fondo.

## Cómo elegir el instrumento

La mayoría de la gente pierde su caso por usar el instrumento equivocado en el orden
equivocado. Elegís el que corresponde a ESTE punto del proceso, no el más contundente:

- DERECHO_PETICION — la persona todavía no le ha pedido formalmente nada a la entidad,
  o pidió de palabra. Es el primer paso casi siempre. Crea el plazo que después sostiene la tutela.
- TUTELA — hay un derecho fundamental afectado Y una de estas: ya hubo petición sin respuesta
  en término, hay negativa expresa, o el riesgo es tan inminente que esperar el plazo agrava el daño.
- QUEJA_SUPERSALUD — inconformidad con una EPS o IPS que no requiere orden judicial,
  o cuando la persona quiere el trámite ante la Superintendencia.
- PQRS — reclamo ordinario ante un particular sin derecho fundamental en juego.

Ante la duda entre DERECHO_PETICION y TUTELA, elegí DERECHO_PETICION y bajá la confianza.
Radicar una tutela prematura hace perder tiempo; un derecho de petición nunca hace daño.

## Cómo extraer los hechos

- Un hecho por entrada, en tercera persona, en orden cronológico.
- Solo lo que la persona dijo. Si dijo "como tres meses", el hecho dice "aproximadamente tres meses".
- Prohibido completar: si no dijo el nombre de la EPS, el campo va 'NO_IDENTIFICADA'.
  Inventar un dato en un documento que se va a radicar es el peor error posible acá.
- Todo lo que falte y sea necesario, va en datosFaltantes.

## Urgencia

ALTA: riesgo para la vida, la integridad, un tratamiento oncológico, alguien hospitalizado,
un menor, un adulto mayor sin cuidador.
MEDIA: afectación sostenida de la salud sin riesgo inmediato.
BAJA: trámite, información, demora administrativa sin daño.
`.trim();

export async function clasificar(transcripcion: string) {
  const res = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 4000,
    system: SYSTEM_CLASIFICADOR,
    output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
    messages: [{
      role: "user",
      content: `Transcripción del reclamo:\n\n"""${transcripcion}"""`
    }],
  });

  const texto = res.content.find(b => b.type === "text");
  return JSON.parse(texto!.text);
}
```

**Por qué structured output y no "respondé en JSON":** el schema se valida del lado del
servidor. No vas a estar debuggeando `JSON.parse` a las 3am por una coma.

---

## 2. Redactor — `src/ai/redactar.ts`

El corpus va en el **primer bloque del system**, con `cache_control`. Todo lo que cambia
por request va después. Un solo byte movido arriba invalida el cache entero.

```ts
import fichas from "../../corpus/fichas.json";

const CORPUS = fichas
  .map(f => `### ${f.id} (${f.año}) — ${f.tema}
Supuesto: ${f.supuesto}
Regla: ${f.ratio}`)
  .join("\n\n");

const SYSTEM_REDACTOR_ESTABLE = `
Sos un redactor de documentos jurídicos colombianos en materia de salud.
Producís el documento; no asesorás a la persona ni opinás sobre sus probabilidades.

## Corpus de jurisprudencia disponible

Estas son las ÚNICAS sentencias que podés citar. No existe ninguna otra para vos.
Si ninguna aplica al caso, redactá el documento sin cita jurisprudencial y decilo
en el campo correspondiente. Citar una sentencia que no esté en esta lista —
o atribuirle a una de estas una regla que no dice — invalida todo el documento.

${CORPUS}

## Estructura del documento

1. Encabezado: destinatario, ciudad, fecha
2. Identificación del solicitante (usá los marcadores [NOMBRE], [CÉDULA] cuando falte el dato)
3. HECHOS, numerados, en orden cronológico
4. FUNDAMENTOS DE DERECHO: norma aplicable + jurisprudencia del corpus si aplica
5. PETICIÓN, numerada y concreta
6. NOTIFICACIONES
7. Firma

## Cómo escribir

- Español jurídico colombiano estándar. Formal pero legible: quien lo radica es la persona, no un abogado.
- Cada hecho afirmado tiene que venir de la clasificación. No agregues hechos.
- Donde falte un dato, dejá el marcador entre corchetes en MAYÚSCULAS. Nunca inventes cédulas,
  direcciones, nombres de médicos ni fechas.
- Ninguna frase que prometa un resultado ("la tutela será concedida").
- Sin emojis, sin negritas decorativas, sin lenguaje de marketing.
`.trim();

export async function redactar(clasificacion: any) {
  const stream = client.messages.stream({
    model: "claude-opus-5",
    max_tokens: 8000,
    output_config: { effort: "high" },
    system: [{
      type: "text",
      text: SYSTEM_REDACTOR_ESTABLE,
      cache_control: { type: "ephemeral", ttl: "1h" },   // ← el corte del cache va acá
    }],
    messages: [{
      role: "user",
      content: `Redactá el documento con estos datos:\n\n${JSON.stringify(clasificacion, null, 2)}

Devolvé:
1. El documento completo en markdown.
2. Al final, separado por la línea "---CITAS---", un JSON con las sentencias que citaste:
   [{"sentencia": "T-XXX/AAAA", "usadaPara": "qué punto sostiene"}]
   Si no citaste ninguna, devolvé [].`
    }],
  });

  for await (const ev of stream) {
    if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
      process.stdout.write(ev.delta.text);   // o mandalo al SSE del frontend
    }
  }
  const final = await stream.finalMessage();
  console.log("cache leído:", final.usage.cache_read_input_tokens);  // debe ser >0 desde el 2do request
  return final;
}
```

**Verificá el cache:** si `cache_read_input_tokens` es 0 en el segundo request, algo
volátil se te coló arriba del `cache_control` (una fecha, un UUID, un `Date.now()`).

---

## 3. Verificador de citas — `src/ai/verificar.ts`

Sin LLM. Código plano. Es la garantía, no una sugerencia.

```ts
const IDS_VALIDOS = new Set(fichas.map(f => f.id));

export function verificarCitas(md: string, citas: {sentencia: string}[]) {
  const validas   = citas.filter(c => IDS_VALIDOS.has(c.sentencia));
  const inventadas = citas.filter(c => !IDS_VALIDOS.has(c.sentencia));

  let limpio = md;
  for (const c of inventadas) {
    // sacá la mención del cuerpo del documento antes de generar el PDF
    limpio = limpio.replaceAll(c.sentencia, "[CITA REMOVIDA — no verificada]");
  }
  return { md: limpio, citas: validas, removidas: inventadas.length };
}
```

Si `removidas > 0`, logueálo. Si en el ensayo del demo te da >0 seguido, el problema
está en el corpus (fichas ambiguas), no en el prompt.

---

## 4. Escalamiento — `src/ai/escalar.ts`

Cuando vence el plazo, no se redacta desde cero: se reusa la clasificación del caso padre
y se cambia el instrumento.

```ts
export async function escalar(casoPadre: Caso) {
  const clasif = JSON.parse(casoPadre.clasificacion);

  const nuevoInstrumento =
    casoPadre.instrumento === "DERECHO_PETICION" ? "TUTELA" : "INCIDENTE_DESACATO";

  return redactar({
    ...clasif,
    instrumento: nuevoInstrumento,
    antecedente: {
      instrumento: casoPadre.instrumento,
      fechaRadicacion: casoPadre.fechaRadicacion,
      fechaLimite: casoPadre.fechaLimite,
      diasTranscurridos: casoPadre.diasPlazo,
      hecho: `La entidad no dio respuesta dentro del término legal de ${casoPadre.diasPlazo} días hábiles.`
    },
  });
}
```

El `antecedente` es lo que hace fuerte a la tutela: el incumplimiento del plazo **es** el
hecho que la sostiene. Asegurate de que el redactor lo incluya como hecho numerado.

---

## 5. Transcripción — `whisper-svc/main.py`

El modelo se carga **una vez** al arrancar. Cargarlo por request son 15 segundos muertos
en cada demo.

```python
from fastapi import FastAPI, UploadFile
import whisper, tempfile, os

app = FastAPI()
model = whisper.load_model("/Users/yeslerlorio/whisper-models/medium.pt")  # ← una vez

@app.post("/transcribe")
async def transcribe(audio: UploadFile):
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as f:
        f.write(await audio.read())
        path = f.name
    try:
        r = model.transcribe(path, language="es", fp16=False)
        return {"texto": r["text"].strip()}
    finally:
        os.unlink(path)
```

`uvicorn main:app --port 8000`. Si `medium` te queda lento en la Mac, bajá a `tiny.pt`
para el desarrollo y volvé a `medium` para grabar el video.

---

## 6. Checklist de prompts antes de grabar

- [ ] `cache_read_input_tokens > 0` en el segundo request (el cache está vivo)
- [ ] Clasificador acierta el instrumento en 5 relatos distintos escritos por vos
- [ ] Un relato sin nombre de EPS devuelve `NO_IDENTIFICADA`, no una EPS inventada
- [ ] `verificarCitas` devuelve `removidas: 0` en los 5 casos
- [ ] Ningún documento contiene una cédula, dirección o fecha que no dijo la persona
- [ ] El disclaimer aparece en el PDF y en la pantalla
