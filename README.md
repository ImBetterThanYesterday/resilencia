# Resilencia

**Democratización de los subsidios en caso de desastres.**

Tras un desastre, la ayuda existe pero está dispersa en decretos, entidades y plazos que nadie explica. Quien no puede pagar un abogado termina perdiendo lo que la ley ya le reconoce. Resilencia centraliza en un solo lugar todos los subsidios y ayudas disponibles, le dice a cada persona a cuáles tiene derecho según lo que vivió y, con IA entrenada por abogados expertos, le redacta el derecho de petición o la tutela, vigila los plazos legales y la acompaña hasta que se los entreguen. Gratis.

| | |
|---|---|
| **Sitio** | https://www.resilencia.org |
| **Pitch / demo** | https://www.youtube.com/shorts/-LGAWLvDtRA |
| **Reto** | Democratización de los Subsidios en Caso de Desastres |
| **Track** | 02 · Justicia — *acceso a asesoría legal para quien no puede pagar un abogado* |
| **Equipo** | ResilencIA · CTW/2026 |

> El nombre se escribe sin la segunda **i**, igual que el dominio. No es un error de tipeo: nos falta una i, no la resiliencia.

---

## El problema

Cuando un sismo tumba una casa en Colombia, el Estado tiene respuestas: ayuda humanitaria de emergencia, alojamiento temporal, apoyo de arriendo, auxilio funerario, reposición gratuita de documentos, subsidio de vivienda. Están en la Ley 1523 de 2012, en decretos municipales y en las resoluciones de la UNGRD.

El subsidio no se pierde porque no exista. Se pierde porque:

1. **Nadie sabe cuáles le corresponden.** Son ayudas repartidas entre ocho entidades distintas, cada una con su requisito y su ventanilla.
2. **Nadie sabe pedirlas.** Un derecho de petición mal escrito, o dirigido a la entidad equivocada, se devuelve.
3. **Cuando las niegan, se acabó.** Reclamar exige un abogado. Quien acaba de perder la casa no tiene con qué pagarlo.
4. **Los plazos corren en silencio.** La entidad tiene 15 días hábiles para responder un derecho de petición. Si vencen sin respuesta, se abre la puerta a la tutela — pero solo para quien sabe que ese reloj existía.

El resultado es una desigualdad silenciosa: la ayuda llega a quien tiene capital social o dinero para asesorarse, no a quien más la necesita.

## Qué hace Resilencia

**Un solo lugar.** La persona cuenta qué le pasó —escribiendo, hablándole al micrófono o marcando su situación en una lista— y recibe el mapa completo de a qué tiene derecho, con la entidad y el monto de cada ayuda.

**Un documento, no un consejo.** Si le corresponde algo que no le han dado, la IA redacta el escrito con sus hechos, la norma que lo sustenta y el destinatario correcto. Sale en PDF, listo para radicar, a nombre de la persona y firmado por ella.

**Acompañamiento hasta el final.** Desde que radica, el plazo legal queda vigilado. Si la entidad no responde dentro del término, se prepara el siguiente paso con el incumplimiento ya incorporado como hecho.

**Gratis y sin intermediarios.** No hay registro, no hay costo, no hay tramitador de por medio.

### El recorrido

| | |
|---|---|
| **1. Cuentas qué te pasó** | Marcas tu situación, la escribes o mandas un audio. También puedes subir fotos. |
| **2. Te decimos a qué tienes derecho** | Qué te corresponde, qué requisitos te faltan y dónde se pide. |
| **3. Si te lo niegan, redactamos el reclamo** | Derecho de petición primero; tutela solo si corresponde. |
| **4. Vigilamos el plazo por ti** | Si se vence sin respuesta, preparamos el siguiente paso sin que lo pidas. |

---

## Estado actual

Lo que está construido y desplegado en producción:

- **Landing y registro** — el formulario que levanta el caso (situación, estado del trámite, datos personales, soportes).
- **Motor de elegibilidad** — 10 ayudas de 8 entidades (UNGRD, CMGRD, Alcaldía, Registraduría, Minvivienda/Fonvivienda, DPS, ICBF, Secretaría de Salud/EPS), con reglas que cruzan la situación de la persona contra el catálogo.
- **Redacción del escrito** — derecho de petición y acción de tutela, con los datos del caso ya insertados y el fundamento legal citado.
- **PDF radicable** — el escrito completo con lugar y fecha, destinatario, petición, fundamento de derecho, notificaciones y firma. Se genera en el navegador.
- **Editor del escrito** — la persona corrige el texto antes de descargarlo, y avisa si quedan campos sin llenar.
- **Agente de dudas** — burbuja en la landing conectada a un agente RAG (n8n) para las preguntas de antes de empezar.
- **Dictado por voz** — transcripción en el propio navegador (Web Speech API), sin backend ni servicio de pago. El texto cae en el campo para que la persona lo corrija antes de enviar.

Lo que todavía no lo está, y conviene decirlo con claridad:

- El **chat de seguimiento** de `/chat` responde con reglas locales, no con el LLM. El agente entrenado por abogados vive hoy detrás del webhook de n8n y alimenta la burbuja de la landing.
- **El reloj de plazos** se muestra en la interfaz, pero no hay todavía un backend que lo haga correr solo ni que notifique al vencimiento.
- **No hay persistencia de servidor.** Todo vive en `sessionStorage` / `localStorage` del navegador. Nada del caso sale del dispositivo de la persona.
- El **corpus jurídico** que sustenta las citas está en revisión: las sentencias marcadas como pendientes no se imprimen en el PDF hasta validarlas contra la relatoría.

---

## Stack y decisiones

| Pieza | Elegido | Por qué |
|---|---|---|
| Frontend | React 19 + Vite 8 + TypeScript | — |
| Estilos | CSS plano, tokens + BEM | Sin Tailwind. El diseño es tipográfico y la hoja de estilos se lee como el argumento visual. |
| Enrutado | History API, ~15 líneas | Son tres vistas. React Router traería un contexto y un árbol de rutas para resolver eso. |
| PDF | jsPDF, por `import()` dinámico | 130 KB que solo descarga quien pulsa el botón, no el 100 % de las visitas. |
| Voz | Web Speech API del navegador | Sin API key, sin cuota, sin enviar el audio a ningún lado. |
| Agente | Webhook n8n (RAG) | Configurable con `VITE_AGENTE_URL`. |
| Video del pitch | Remotion | El demo se renderiza desde el mismo repo. |
| Hosting | Vercel + dominio en Namecheap | — |

Dos criterios que explican casi todo el código:

**Cero dependencias que no ganen su peso.** Cada librería que entra tiene que resolver algo que no se resuelve en cincuenta líneas. Por eso no hay router, ni librería de iconos, ni framework de CSS.

**Nada del caso sale del dispositivo.** Quien usa esto acaba de perder la casa y está entregando su cédula, su dirección y su situación familiar. Mientras no haya una razón funcional para guardarlo en un servidor, se queda en el navegador.

---

## Estructura

```
Resilencia/
├── README.md            ← este archivo
├── ROADMAP.md           plan de ejecución y arquitectura objetivo
├── PROMPTS.md           prompts del sistema y notas de la capa de IA
└── frontend/
    ├── src/
    │   ├── features/
    │   │   ├── landing/     portada + burbuja del agente de dudas
    │   │   ├── registro/    formulario que levanta el caso
    │   │   └── chat/        respuesta, documento, plazos y editor
    │   ├── data/            catálogo de subsidios, reglas y guion
    │   ├── lib/             agente (n8n), voz, documento y PDF
    │   ├── components/      marca, bandera, iconos
    │   ├── styles/          tokens y reset
    │   └── remotion/        video del pitch
    └── vercel.json          rewrite SPA
```

## Correr en local

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

Otros comandos:

```bash
npm run build        # tsc -b && vite build
npm run lint         # oxlint
npm run video        # Remotion Studio
npm run video:render # renderiza el demo a out/resiliencia.mp4
```

### Variables de entorno

| Variable | Por defecto | Para qué |
|---|---|---|
| `VITE_AGENTE_URL` | el webhook de n8n del proyecto | Endpoint del agente de dudas. |

Las variables con prefijo `VITE_` **viajan al bundle y son visibles en el navegador**. Sirven para URLs públicas. Una API key nunca puede ir ahí: tiene que quedar detrás de una función de servidor.

## Despliegue

Vercel, conectado a `main`. Cada push redespliega.

La única configuración que no es la de por defecto es el **Root Directory**, que tiene que ser `frontend` — el `package.json` no está en la raíz del repo.

`frontend/vercel.json` reescribe todas las rutas a `index.html`. Sin eso, recargar en `/registro` o `/chat` devuelve 404, porque el enrutado es del lado del cliente.

---

## Contacto

- **Web** — https://www.resilencia.org
- **WhatsApp** — [+57 312 839 1981](https://wa.me/573128391981)

---

## Aviso

Resilencia orienta y redacta documentos. **No presta asesoría jurídica ni reemplaza a un abogado.** Todo escrito debe revisarse antes de radicarlo.

Fotografías de Unsplash, bajo licencia de uso libre.
