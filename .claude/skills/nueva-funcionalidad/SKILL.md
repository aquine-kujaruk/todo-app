---
name: nueva-funcionalidad
description: Convierte lo que pide una persona no técnica en código desplegado. Pregunta solo lo que esa persona puede decidir, resuelve tú todo lo técnico, publica una issue con la especificación y despacha subagentes que la implementan, abren la PR y la mergean. Úsala cuando alguien describa algo que quiere que la aplicación haga o deje de hacer —"quiero que…", "estaría bien poder…", "me gustaría que la app…", "esto no me funciona como espero"— sin entrar en detalles técnicos.
---

# Nueva funcionalidad

Alguien que no programa describe lo que quiere. Al final hay código en producción.
Entre esas dos cosas hay tres fases, y **tú solo ejecutas la primera y la segunda**.

```
Fase 1  Interrogatorio     tú (Opus)          pocas preguntas, ninguna técnica
Fase 2  Issue              tú (Opus)          especificación + plan, autocontenida
Fase 3  Implementación     subagentes (Sonnet) código, PR, merge a main
```

La persona con la que hablas solo hace una cosa en todo el proceso: contestar las
preguntas de la Fase 1. Todo lo demás es tuyo o de los subagentes.

## Fase 1 — Interrogatorio

Tienes contexto de sobra y puede ser una conversación larga, pero **quien te lee no
es técnico y se abruma rápido**. El objetivo no es entenderlo todo: es enterarte de
lo poco que solo esa persona puede decidir, y resolver el resto tú.

### El filtro: qué preguntas y qué decides

Antes de escribir una pregunta, pásala por esto:

> **¿Tendría opinión sobre esto alguien que solo usa la aplicación y nunca ha visto
> el código?**

- **Sí** → es su decisión. Pregúntala.
- **No** → es tu decisión. Tómala en silencio y anótala en la issue.

Casi todo cae en el segundo grupo. Nombres de tablas, forma de los endpoints, si se
añade una columna o se calcula al vuelo, optimistic UI, índices, orden de los
`useEffect`, cómo se valida, dónde vive el estado: **nada de eso se pregunta jamás.**
Lo decides tú, y si te equivocas se arregla en otra iteración.

Dos filtros más, para que el bucle sea corto:

1. **¿Cambiaría la respuesta lo que se construye?** Si las dos respuestas posibles
   acaban en lo mismo, no es una pregunta.
2. **¿Puedes acertar tú, y equivocarte saldría barato?** Entonces acierta tú.

**Excepción — esto se pregunta siempre**, por técnico que parezca el mecanismo, porque
la consecuencia no lo es:

- Se pierden o cambian datos que ya existen ("esto borraría las tareas de antes").
- Cambia lo que la gente ya ve o ya sabe hacer.
- Se abre al público algo que estaba cerrado. En esta app el acceso a la base de datos
  pasa entero por el servidor (ver `CLAUDE.md`); si lo que piden lo rompería, dilo en
  llano y pregunta, no lo decidas tú.

### Los hechos se buscan, no se preguntan

Si la respuesta está en algún sitio, ve a por ella. No preguntes nunca algo que puedas
mirar:

- El repositorio: `app/`, `components/`, `lib/`.
- La base de datos: herramientas `mcp__Supabase__*` con `project_id: itnmhhhqymgsegnntemk`.
- Producción: `curl -s https://todo-poc.vercel.app/api/health`.
- Lo que ya se pidió antes: issues y PRs con `mcp__github__*`.

Las herramientas MCP y `WebFetch` están diferidas: cárgalas con `ToolSearch`
(`select:mcp__github__issue_write`, etc.) antes de llamarlas.

### Cómo se pregunta

- **Una pregunta cada vez.** Varias a la vez desconciertan.
- **Cero jerga.** Prohibidas en el texto de una pregunta: endpoint, esquema, migración,
  componente, estado, caché, API, RLS, deploy, campo, tabla, tipo, build, commit.
- **Con recomendación**, siempre, y formulada para que un "vale" sea una respuesta
  completa. Quien contesta no debería tener que redactar nada.
- **Dos frases como mucho.**
- **Máximo 5 preguntas en total.** Si llegas a 5 y sigues con dudas, decide tú lo que
  quede y déjalo escrito en la issue como suposición.

Ejemplos, con este repositorio delante:

| ❌ No | ✅ Sí |
| --- | --- |
| ¿Borrado lógico o físico? | Cuando borres una tarea, ¿quieres poder recuperarla luego, o que desaparezca del todo? Yo la haría desaparecer, que es lo que espera la gente. ¿Te vale? |
| ¿Añadimos `due_date` como `timestamptz` o `date`? | ¿Las fechas de vencimiento llevan hora, o basta con el día? Yo pondría solo el día, es más simple de rellenar. ¿Te vale? |
| ¿Ordenamos por `created_at DESC` con índice? | *(no se pregunta — decides tú)* |
| ¿Quieres paginación? | Si algún día hay cientos de tareas, ¿prefieres verlas todas de una o de poco en poco? Yo las dejaría todas, que ahora mismo son pocas. ¿Te vale? |

### Cuándo parar

Cuando ninguna pregunta pendiente cambiaría lo que se va a construir, **para y sigue
adelante**. No pidas permiso. No preguntes "¿procedo?", "¿lo hago?" ni "¿te parece
bien?". La aprobación ya está dada: es esta skill.

Cero preguntas es un resultado perfectamente válido cuando lo que piden está claro.

Antes de pasar a la Fase 2, escribe un resumen corto **en afirmativo, no en pregunta**:
qué se va a hacer, en dos o tres frases llanas, para que quien lee sepa qué acaba de
poner en marcha. Y sigue sin esperar respuesta.

## Fase 2 — La issue

Publica **una sola issue** en `aquine-kujaruk/todo-app` con `mcp__github__issue_write`.
Esa issue es todo lo que van a ver los subagentes.

> **Escríbela como si nadie hubiera leído la conversación, porque nadie la habrá
> leído.** Los subagentes arrancan en frío. Si un acuerdo, una suposición o un
> descarte no está en la issue, no existe.

Título: en lenguaje llano, lo que gana quien usa la app. No "añadir columna `due_date`"
sino "poner fecha de vencimiento a las tareas".

Etiqueta `ready-for-agent` si existe en el repositorio; si no, créala y sigue. No
bloquees por una etiqueta.

<plantilla-issue>

## Qué se pidió

Lo que pidió la persona, en sus palabras.

## Qué acordamos

Las decisiones de la Fase 1, en lenguaje llano, una por línea. Aquí van también las
suposiciones que tomaste tú sin preguntar y que podrían ser discutibles, marcadas como
tales, para que se puedan corregir después.

## Historias de usuario

Lista numerada y **larga**, en formato:

1. Como <actor>, quiero <capacidad>, para <beneficio>

Que cubra todos los recovecos de la funcionalidad, incluidos los casos raros: qué pasa
si está vacío, si falla, si el dato no existe, si se hace dos veces.

## Decisiones de implementación

La parte técnica, para quien va a escribir el código: módulos que se tocan, contratos
de la API, cambios de esquema, interacciones concretas, y las restricciones de este
repositorio que hay que respetar (nada de `NEXT_PUBLIC_`, el cliente no importa
`lib/supabaseServer.ts`, los cambios de esquema con `mcp__Supabase__apply_migration`
sobre `project_id: itnmhhhqymgsegnntemk`).

Sin rutas de fichero concretas ni fragmentos de código: envejecen mal. Excepción: si un
esquema, un tipo o una máquina de estados expresa la decisión mejor que la prosa,
inclúyelo recortado a lo esencial.

## Cómo se comprueba

En qué costura se verifica esto, prefiriendo las que ya existen a inventar nuevas, y lo
más arriba posible. Cuantas menos costuras, mejor. Como mínimo: `npm run build` pasa, y
`/api/health` sigue devolviendo `{"ok":true}` después del despliegue.

## Criterios de aceptación

- [ ] Criterio 1
- [ ] Criterio 2

## Plan de trabajo

Los cortes en los que se parte el trabajo, numerados en orden de dependencia. Cada corte
es una **bala trazadora**: atraviesa todas las capas (base de datos, API, interfaz) y se
puede enseñar funcionando por sí solo. No son capas horizontales — "primero la base de
datos, luego la API" está mal.

1. **<Título del corte>** — qué queda funcionando de punta a punta cuando esté.
   Bloqueado por: ninguno.
2. **<Título del corte>** — …
   Bloqueado por: 1.

Si el trabajo cabe en un solo corte, un solo corte. Es lo normal en esta app.

## Fuera de alcance

Lo que deliberadamente no se hace, y por qué.

</plantilla-issue>

## Fase 3 — Los subagentes

**Tú no escribes código. Nunca.** Ni una línea, ni un arreglo rápido, ni "ya que estoy".
No llames a `Edit` ni a `Write` sobre ficheros de la aplicación. Tu trabajo aquí es
despachar, verificar y contar el resultado.

Despacha en cuanto la issue esté publicada, sin preguntar.

### Reglas de despacho

- **Un subagente por corte**, con `subagent_type: general-purpose` y **`model: sonnet`**.
  Opus es para el interrogatorio; la implementación es de Sonnet.
- **`run_in_background: false`.** Necesitas el resultado para encadenar el siguiente
  corte y para poder contar cómo fue.
- **En orden de dependencia y de uno en uno**, todos sobre la misma rama. Solo lanza dos
  a la vez si los cortes no se bloquean entre sí **y** tocan ficheros distintos, y en ese
  caso usa `isolation: "worktree"`.
- **Rama:** si la sesión tiene una rama designada, esa. Si no, `feature/<slug>` a partir
  de `main`. Todos los cortes van a la misma rama y a la misma PR.
- **Si un subagente falla o vuelve bloqueado**, despacha otro con el diagnóstico añadido.
  No lo arregles tú. Si falla dos veces por lo mismo, para y cuéntaselo a la persona en
  llano, sin volcarle el error.

### Prompt del subagente

Cada subagente arranca en frío. Dale la issue completa, no un resumen:

<prompt-subagente>

Implementa el corte N de la issue #<número> de `aquine-kujaruk/todo-app`.

Lee la issue entera con `mcp__github__issue_read` antes de tocar nada — es tu única
fuente, no hay conversación previa que puedas consultar. Lee también `CLAUDE.md`:
recoge restricciones de arquitectura que son obligatorias.

Tu corte: <título y descripción del corte>.
Ya implementado en la rama por cortes anteriores: <resumen, o "nada, eres el primero">.

Trabaja sobre la rama `<rama>` (créala desde `main` si no existe).

Reglas:
- Decide tú todo lo técnico. **No preguntes nada al usuario**: no está mirando. Si te
  bloqueas de verdad, termina explicando qué te bloquea en vez de preguntar.
- No te salgas de tu corte. Lo que esté fuera del alcance de la issue, no se toca.
- Antes de dar nada por terminado: `npm run build` tiene que pasar. Es lo que verifica
  que no se ha colado ninguna credencial en el bundle del navegador.
- Cambios de esquema con `mcp__Supabase__apply_migration` sobre
  `project_id: itnmhhhqymgsegnntemk`, nunca con `execute_sql`.
- Haz commit con un mensaje descriptivo y haz push con `git push -u origin <rama>`.

Al terminar informa de: qué has cambiado, si el build pasa, y qué criterios de
aceptación de la issue quedan cubiertos.

</prompt-subagente>

### Cierre

Cuando el último corte esté verde, el subagente final —no tú— hace el cierre:

1. Abre la PR contra `main` con `mcp__github__create_pull_request`, enlazando
   `Closes #<número>` para que la issue se cierre sola.
2. Comprueba que `npm run build` pasa en la rama. **Es la puerta: sin build verde no se
   mergea.** Mergear a `main` despliega a producción a través de la integración nativa
   de Vercel, así que esto no se salta.
3. Mergea la PR con `mcp__github__merge_pull_request`.

Tras el merge, verifica tú el despliegue:

```bash
curl -s https://todo-poc.vercel.app/api/health   # {"ok":true,"todos":N}
```

Y cuenta el resultado en dos o tres frases llanas: qué puede hacer ahora la app que
antes no podía, y el enlace a la issue. El informe del subagente no lo ve nadie más que
tú — si no lo cuentas tú, no se ha contado.

Si el despliegue tarda, dilo y vuelve a comprobarlo; no des por bueno lo que no has
visto.

## Lo que nunca haces

- Preguntar algo técnico. Si dudas de si lo es, aplica el filtro: ¿tendría opinión quien
  solo usa la app?
- Preguntar un hecho que podías haber mirado.
- Encadenar preguntas sin recomendación, o más de 5 en total.
- Pedir permiso para crear la issue o para despachar.
- Escribir código de la aplicación.
- Mergear sin build verde.
- Volcar errores, trazas o jerga a quien te está hablando.
