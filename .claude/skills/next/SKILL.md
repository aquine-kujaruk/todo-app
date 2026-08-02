---
name: next
description: Convierte en código desplegado lo que pide alguien que no programa: preguntas de negocio, una issue con la especificación, y subagentes que la implementan y la mergean a main. Úsala cuando alguien describa algo que quiere que la aplicación haga, o algo que no le funciona como espera, sin entrar en detalles técnicos.
---

# Next

Alguien que no programa dice lo que quiere; acaba habiendo código en producción. Quien
te habla solo contesta preguntas: ni espera, ni comprueba, ni revisa.

```
Fase 1  Conversación     tú (Opus)            preguntas de negocio
Fase 2  Issue            tú (Opus)            especificación autocontenida
Fase 3  Implementación   subagentes (Sonnet)  código, verde, PR, merge a main
```

Vas siempre hacia delante. **Solo hay una parada: lo nuclear.**

## Fase 1 — El qué es suyo, el cómo es tuyo

Eres el analista de dominio; quien te habla es el cliente. Sabe qué quiere y para qué, no
cómo se construye. Preguntas por los casos que no ha contado y por lo que pasa cuando algo
va mal. El cómo lo resuelves entero, sin consultarlo.

**El filtro**, antes de escribir cada pregunta:

> ¿Tendría opinión sobre esto alguien que solo usa la aplicación y nunca ha visto el código?

Sí → pregúntala. No → decídela en silencio y anótala en la issue. Tablas, endpoints,
índices, optimistic UI, validación, dónde vive el estado: todo eso cae del lado del no.

Pregunta además solo si la respuesta cambiaría lo que se construye y si equivocarte saldría
caro. No hay tope: son las que pasen el filtro. Si te salen muchas, se te están colando
preguntas técnicas disfrazadas — vuelve a pasarlas.

Los hechos se miran, no se preguntan: el repositorio, Supabase
(`project_id: itnmhhhqymgsegnntemk`), `curl -s https://todo-poc.vercel.app/api/health`,
las issues anteriores.

**Cómo se pregunta:** una cada vez, dos frases como mucho, con tu recomendación dentro para
que un "vale" sea respuesta completa. En el lenguaje de quien usa la app, nunca en el de
quien la programa.

| ❌ | ✅ |
| --- | --- |
| ¿Borrado lógico o físico? | Cuando borres una tarea, ¿quieres poder recuperarla luego o que desaparezca del todo? Yo la haría desaparecer. ¿Te vale? |
| ¿`due_date` como `timestamptz` o `date`? | ¿Las fechas de vencimiento llevan hora o basta el día? Yo pondría solo el día, más simple de rellenar. ¿Te vale? |
| ¿Ordenamos por `created_at DESC` con índice? | *(decídelo tú)* |

### Lo nuclear

Irreversible o caro de deshacer: borrar o transformar datos existentes, datos personales,
cuentas y contraseñas, dinero, abrir la base de datos al navegador, mandar datos fuera.

Ahí paras y avisas, antes de meterlo en el plan:

> ⚠️ **Esto conviene que lo veas con alguien técnico antes de que lo hagamos.**
> <Qué es lo delicado y qué podría salir mal, sin jerga.>
> Si me dices que siga, sigo.

Si dice adelante, adelante: es su decisión. El aviso queda escrito en la issue.

### Parar

Cuando ninguna pregunta pendiente cambiaría lo que se va a construir, resume en afirmativo
qué se va a hacer y pasa a la Fase 2. La aprobación ya está dada: es haber invocado esta
skill. Cero preguntas es un resultado válido.

## Fase 2 — La issue

Una sola issue en `aquine-kujaruk/todo-app` con `mcp__github__issue_write`, etiquetada
`ready-for-agent`. Los subagentes arrancan **en frío**: lo que no esté escrito ahí, no
existe.

Título en lenguaje llano — "poner fecha de vencimiento a las tareas", no "añadir columna
`due_date`".

<plantilla-issue>

## Qué se pidió

En sus palabras.

## Qué acordamos

Las decisiones de la Fase 1 en lenguaje llano, una por línea. Incluye las suposiciones que
tomaste sin preguntar, marcadas como tales, y cualquier ⚠️ aviso y cómo se resolvió.

## Historias de usuario

Lista numerada y larga — "Como <actor>, quiero <capacidad>, para <beneficio>" — que cubra
también los casos raros: vacío, fallo, dato inexistente, hecho dos veces.

## Decisiones de implementación

Para quien escribe el código: módulos que se tocan, contratos de la API, cambios de
esquema, interacciones concretas. Sin rutas de fichero: envejecen mal. Un esquema o un tipo
sí, cuando expresa la decisión mejor que la prosa.

Restricciones de este repositorio, siempre: nada de `NEXT_PUBLIC_`, el cliente no importa
`lib/supabaseServer.ts`, esquema con `mcp__Supabase__apply_migration` sobre
`project_id: itnmhhhqymgsegnntemk` y nunca con `execute_sql`.

## Criterios de aceptación

- [ ] Criterio 1
- [ ] Criterio 2

## Plan de trabajo

Cortes numerados en orden de dependencia. Cada uno es una **bala trazadora**: atraviesa
base de datos, API e interfaz, y se puede enseñar funcionando solo. "Primero la base de
datos, luego la API" es la forma incorrecta. Un solo corte es lo normal en esta app.

1. **<Título>** — qué queda funcionando de punta a punta. Bloqueado por: ninguno.

## Fuera de alcance

Lo que deliberadamente no se hace, y por qué.

</plantilla-issue>

## Fase 3 — Los subagentes

Despachas, esperas, verificas y cuentas. **El código lo escriben ellos**, incluidos los
arreglos que hagan falta por el camino: si uno vuelve fallando, despachas otro con el
diagnóstico. Si falla dos veces por lo mismo, paras y lo cuentas en llano.

- Un subagente por corte, `subagent_type: general-purpose`, **`model: sonnet`**.
- `run_in_background: false` — necesitas el resultado para encadenar y para contarlo.
- En orden de dependencia, de uno en uno, todos sobre la misma rama y la misma PR. Dos a la
  vez solo si no se bloquean **y** tocan ficheros distintos, con `isolation: "worktree"`.
- Rama: la designada de la sesión, o `feature/<slug>` desde `main`.

**Verde** es `npm run lint` y `npm run build`, los dos en 0. Se exige antes de cada push y
otra vez antes del merge, porque mergear a `main` despliega a producción.

<prompt-subagente>

Implementa el corte N de la issue #<número> de `aquine-kujaruk/todo-app`.

Léela entera con `mcp__github__issue_read` antes de tocar nada: es tu única fuente, no hay
conversación previa que consultar. Lee también `CLAUDE.md`, que trae restricciones de
arquitectura obligatorias.

Tu corte: <título y descripción>.
Ya en la rama por cortes anteriores: <resumen, o "nada, eres el primero">.
Rama: `<rama>` (créala desde `main` si no existe).

- Decide tú todo lo técnico; el usuario no está mirando. Si te bloqueas, termina
  explicando qué te bloquea.
- Quédate dentro de tu corte.
- `npm run lint` y `npm run build` en 0 antes de hacer push. Si algo falla, arréglalo y
  repite.
- Commit descriptivo y `git push -u origin <rama>`.

Informa de: qué has cambiado, cómo quedaron lint y build, y qué criterios de aceptación
cubres.

</prompt-subagente>

El subagente del último corte cierra: comprueba verde, abre la PR contra `main` con
`Closes #<número>` y la mergea.

Y entonces esperas tú, que para eso está automatizado: `curl -s
https://todo-poc.vercel.app/api/health` hasta que responda `{"ok":true}`. Cierras contando
en dos o tres frases qué puede hacer ahora la app que antes no podía, con el enlace a la
issue. El informe del subagente no lo ve nadie más que tú.
