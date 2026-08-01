# CLAUDE.md

Contexto para trabajar en este repositorio desde Claude Code. La app se mantiene
desde aquí: los cambios se piden en el chat, se abren como PR y se mergean a
`main`, que es lo que dispara el despliegue.

## Pedir cambios sin saber programar

`/nueva-funcionalidad` (en `.claude/skills/`) cubre ese camino entero para quien no
es técnico: hace unas pocas preguntas en lenguaje llano —solo las que esa persona
puede decidir, nunca las técnicas—, publica una issue con la especificación y el
plan, y despacha subagentes que la implementan, abren la PR y la mergean a `main`.

## Los tres sitios donde vive esto

| | Identificador | Cómo consultarlo |
| --- | --- | --- |
| **GitHub** | `aquine-kujaruk/todo-app`, rama por defecto `main` | herramientas `mcp__github__*` |
| **Supabase** | proyecto `todo-poc`, ref **`itnmhhhqymgsegnntemk`**, región `eu-west-1`, org `crjyxjevreumhokuxvig` | herramientas `mcp__Supabase__*`, pasando ese `project_id` |
| **Vercel** | proyecto `todo-poc`, id **`prj_rtkLNg3dwtHa5lfCfNd4jXwAdC1q`**, equipo **`team_3DUaoBXJoYRInk75ggr2PtDx`** (slug `edgar-aquines-projects`) | herramientas `mcp__Vercel__*`, pasando `teamId` |

- Producción: **https://todo-poc.vercel.app**
- API de Supabase: `https://itnmhhhqymgsegnntemk.supabase.co`

Hay otros dos proyectos en la misma organización de Supabase (`Doc Search`,
`Poc-prisa-backoffice`) que no tienen nada que ver con esto. Confirmar siempre el
ref antes de aplicar una migración.

## Arquitectura: la base de datos solo se toca desde el servidor

```
Navegador ──fetch /api/todos──► Lambda de Vercel ──service_role──► Supabase
(sin claves)                     (Next.js)                          (RLS cerrado)
```

- `components/TodoApp.tsx` — cliente. Solo hace `fetch` al mismo origen. No
  importa el SDK de Supabase ni conoce ninguna clave.
- `app/api/todos/route.ts`, `app/api/todos/[id]/route.ts` — el backend.
- `lib/supabaseServer.ts` — importa `server-only`, así que **el build falla** si
  un componente de cliente lo importa. El cliente se crea perezosamente, de modo
  que el build no necesita variables de entorno.

Ninguna variable lleva prefijo `NEXT_PUBLIC_`, a propósito: Next inlinea esas en
el bundle del navegador. Al añadir una variable nueva, si es una credencial, no
usar ese prefijo.

La tabla `todos` tiene RLS activo, **ninguna política** y sin grants a `anon` ni
`authenticated`. La clave publicable no sirve para nada:

```console
$ curl "https://itnmhhhqymgsegnntemk.supabase.co/rest/v1/todos?select=*" \
    -H "apikey: sb_publishable_EmD-j7cm9koq_TSI97uRPg_DdzrrbY2"
{"code":"42501","message":"permission denied for table todos"}
```

Eso es el diseño, no un fallo. Si algún cambio necesita acceso directo desde el
cliente, hay que replantearlo: rompe la garantía de que todo pasa por el servidor.

## Despliegue

Lo lleva la **integración Git nativa de Vercel**, conectada en el panel. No hay
GitHub Action, ni `VERCEL_TOKEN`, ni secrets en el repositorio.

| Evento | Resultado |
| --- | --- |
| PR contra `main` | deploy de preview |
| Merge a `main` | deploy a producción |

Hubo un workflow que hacía esto con la CLI de Vercel; se eliminó porque exigía un
token para conseguir lo que la integración nativa da sin credenciales. Sigue en
el historial (`git log -- .github/workflows/deploy.yml`) por si algún día hacen
falta pasos propios antes de desplegar: tests, linters o una puerta sobre
`/api/health`.

## Variables de entorno

Viven **solo en Vercel**: proyecto `todo-poc` → Settings → Environment Variables.
No están en el repositorio ni en los secrets de GitHub.

| Variable | Origen |
| --- | --- |
| `SUPABASE_URL` | `https://itnmhhhqymgsegnntemk.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API Keys → `service_role` |

## Lo que los conectores no pueden hacer

Cosas que hay que pedirle al usuario, porque no hay herramienta para ellas:

- **Escribir variables de entorno en Vercel.** Se leen, no se escriben.
- **Crear secrets en GitHub.**
- **Leer la `service_role` key de Supabase.** El conector solo expone las claves
  publicables. Si hace falta, la copia el usuario del panel.
- **Conectar el repositorio a un proyecto de Vercel.**

El conector de Vercel caduca de vez en cuando y hay que reautorizarlo desde los
ajustes de conectores de claude.ai. Si sus herramientas fallan por autorización,
decírselo al usuario en vez de dar por inaccesible el despliegue: `curl` a
`https://todo-poc.vercel.app/api/health` sigue funcionando para comprobar el
estado.

## Comprobar que todo sigue en pie

```bash
# El backend alcanza la base de datos
curl -s https://todo-poc.vercel.app/api/health          # {"ok":true,"todos":N}

# La base de datos sigue cerrada desde fuera
curl -s "https://itnmhhhqymgsegnntemk.supabase.co/rest/v1/todos?select=*" \
  -H "apikey: sb_publishable_EmD-j7cm9koq_TSI97uRPg_DdzrrbY2"   # 42501
```

`/api/health` distingue el caso de "faltan variables de entorno"
(`reason: not_configured`) del de "la base de datos no responde"
(`reason: database_unreachable`).

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # y pegar la service_role key
npm run dev
```

`npm run build` funciona sin variables de entorno: sirve para verificar que
ninguna credencial se ha colado en el bundle del cliente.

## Esquema

```sql
create table public.todos (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 500),
  is_done boolean not null default false,
  created_at timestamptz not null default now()
);
```

Cambios de esquema con `mcp__Supabase__apply_migration` sobre
`project_id: itnmhhhqymgsegnntemk`, no con `execute_sql`: así quedan registrados
como migración.

## Estado de la POC

No hay autenticación de usuarios: cualquiera que abra la web edita la lista,
porque la API no distingue quién llama. Lo que sí está resuelto es que el acceso
pasa por el servidor, que es donde iría el login. Si se añade autenticación, el
sitio natural es la capa `/api`, no devolver el acceso directo al cliente.
