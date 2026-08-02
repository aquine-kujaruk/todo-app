---
name: next
description: Convierte en código desplegado lo que pide alguien que no programa: una entrevista de negocio a fondo, una issue con la especificación, y agentes que la implementan, pasan CI y la mergean a main. Úsala cuando alguien describa algo que quiere que la aplicación haga, o algo que no le funciona como espera, sin entrar en detalles técnicos.
---

# Next

Alguien que no programa dice lo que quiere; acaba habiendo código en producción. Quien te
habla solo contesta preguntas: ni espera, ni comprueba, ni revisa.

```
Fase 1  Conversación   tú (Opus)         el árbol de producto, entero
Fase 2  Issue          tú (Opus)         el handoff: especificación + implementación
Fase 3  Entrega        Opus orquesta,    código, CI, merge, aviso
                       Sonnet implementa
```

Vas siempre hacia delante. **Solo hay una parada: lo nuclear.**

## Fase 1 — El qué es suyo, el cómo es tuyo

Eres el analista de dominio; quien te habla es el cliente. Sabe qué quiere y para qué, no
cómo se construye.

**El filtro**, antes de escribir cada pregunta:

> ¿Tendría opinión sobre esto alguien que solo usa la aplicación y nunca ha visto el código?

Sí → pregúntala. No → decídela en silencio y anótala en la issue. Tablas, endpoints,
índices, optimistic UI, validación, dónde vive el estado: todo eso cae del lado del no.

Los hechos se miran, no se preguntan: el repositorio, Supabase
(`project_id: itnmhhhqymgsegnntemk`), `curl -s https://todo-poc.vercel.app/api/health`,
las issues anteriores.

### El árbol

**El filtro elige qué árbol recorres, no hasta dónde.** El de producto lo recorres entero,
rama por rama, resolviendo las dependencias entre decisiones una a una. Cada respuesta
abre ramas nuevas — síguelas hasta el final.

Interroga sin piedad los sitios donde la gente da cosas por supuestas: qué pasa cuando eso
está vacío, cuando falla, cuando ya existe, cuando se hace dos veces, cuando lo hacen dos
personas a la vez, quién debería verlo y quién no, qué espera ver justo después de hacerlo.
El cliente sabe la respuesta a todo eso; simplemente no sabía que hacía falta contarlo.

**Terminas cuando toda rama abierta está cerrada** y ninguna pregunta pendiente cambiaría
lo que se va a construir. Si te salen muchas preguntas técnicas, es que se están colando
disfrazadas — vuelve a pasarlas por el filtro; que sean muchas de producto es buena señal.

**Cómo se pregunta:** una cada vez, dos frases como mucho, con tu recomendación dentro para
que un "vale" sea respuesta completa. En el lenguaje de quien usa la app, nunca en el de
quien la programa. Lo largo es la entrevista, no cada pregunta.

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

### Cerrar

Resume en afirmativo qué se va a hacer y pasa a la Fase 2. La aprobación ya está dada: es
haber invocado esta skill.

## Fase 2 — La issue

Una sola issue en `aquine-kujaruk/todo-app` con `mcp__github__issue_write`, etiquetada
`ready-for-agent`. Es el **handoff**: nadie más leerá esta conversación, así que lo que no
esté escrito ahí no existe.

Título en lenguaje llano — "poner fecha de vencimiento a las tareas", no "añadir columna
`due_date`".

<plantilla-issue>

## Qué se pidió

En sus palabras.

## Qué acordamos

Todo lo que salió de la entrevista, en lenguaje llano, una decisión por línea. Incluye las
suposiciones que tomaste sin preguntar, marcadas como tales, y cualquier ⚠️ aviso y cómo se
resolvió.

## Historias de usuario

Lista numerada y larga — "Como <actor>, quiero <capacidad>, para <beneficio>" — que cubra
también los casos raros que cerraste en la entrevista: vacío, fallo, dato inexistente,
hecho dos veces, dos personas a la vez.

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

## Fase 3 — Entrega

Despachas **un solo subagente Opus** que orquesta el resto, con
`subagent_type: general-purpose`, `model: opus` y `run_in_background: false`. Arranca **en
frío**, con la referencia de la issue y nada más — por eso la Fase 2 es autocontenida.

Opus orquesta porque reparte trabajo y juzga resultados sin nadie que le revise; Sonnet
implementa cada corte, que es trabajo acotado y ya especificado.

<prompt-orquestador>

Entrega la issue #<número> de `aquine-kujaruk/todo-app`, entera.

Léela con `mcp__github__issue_read`: es tu única fuente, no hay conversación previa que
consultar. Lee también `CLAUDE.md`, que trae restricciones de arquitectura obligatorias.

Tú no escribes código. Reparte, esperas, juzgas y arreglas repartiendo otra vez.

1. Trabaja sobre `feature/<slug>` desde `main`. Todos los cortes van a esa rama.
2. Por cada corte del plan, en orden de dependencia, despacha un subagente con
   `subagent_type: general-purpose` y `model: sonnet`, pasándole el número de issue, su
   corte y qué dejaron hechos los cortes anteriores. De uno en uno; dos a la vez solo si no
   se bloquean y tocan ficheros distintos, con `isolation: "worktree"`.
3. Cuando estén todos, abre la PR contra `main` con `Closes #<número>`.
4. **Espera al check de CI.** Sondea con `mcp__github__pull_request_read` hasta que
   concluya. No mergees por tu cuenta ni des por bueno lo que no ha concluido.
5. Si sale en rojo, lee el fallo con `mcp__github__get_job_logs`, despacha un Sonnet con
   ese diagnóstico y vuelve al paso 4. Si el mismo fallo sobrevive a dos intentos, para e
   informa.
6. En verde, mergea con `mcp__github__merge_pull_request`.
7. Comprueba `curl -s https://todo-poc.vercel.app/api/health` hasta que responda
   `{"ok":true}`.

Informa de: qué hace ahora la app que antes no podía, el estado final del check, y
cualquier criterio de aceptación que quedara sin cubrir.

</prompt-orquestador>

### La puerta es el check, no el modelo

`lint` y `build` corren en GitHub Actions (`.github/workflows/ci.yml`) contra la rama. Un
modelo que dice "el lint pasó" es una promesa; **verde** es el check de GitHub, que es un
hecho y no depende de que nadie se acuerde de mirarlo. Los agentes pueden correr
`npm run lint` mientras trabajan, pero lo que abre el merge es el check.

### Cerrar con el usuario

Cuando el orquestador vuelva, avisa con `PushNotification` — probablemente se haya ido a
otra cosa, que es justo el objetivo — y cuenta en dos o tres frases llanas qué puede hacer
ahora la app que antes no podía, con el enlace a la issue. Su informe no lo ve nadie más
que tú.
