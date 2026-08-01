# Todo POC — Next.js + Supabase + Vercel

Prueba de concepto para validar que el flujo **Claude → GitHub → Vercel → Supabase**
es suficiente para crear, desplegar y mantener una app sin salir del chat.

## Qué hace

Un todo list sencillo: crear, marcar como hecha y borrar tareas. Sin autenticación.
La data se persiste en Postgres (Supabase).

## Stack

- **Next.js 15** (App Router, TypeScript) — frontend y backend en el mismo deploy
- **Supabase** — proyecto `todo-poc` (`itnmhhhqymgsegnntemk`, región `eu-west-1`)
- **Vercel** — proyecto `todo-poc`, desplegado desde GitHub Actions
- **GitHub Actions** — CI/CD: preview en cada PR, producción al mergear a `main`

## Despliegue

Todo pasa por `.github/workflows/deploy.yml`. No hay integración Git nativa de
Vercel configurada: el workflow usa la CLI de Vercel con un token.

| Evento | Qué hace |
| --- | --- |
| PR contra `main` | build + deploy de **preview**, comenta la URL en el PR |
| Push/merge a `main` | build + deploy a **producción** |
| `workflow_dispatch` | deploy manual a producción |

El workflow, en orden: comprueba que existen los secrets, hace `vercel pull`,
**genera `.env.production.local` a partir de los secrets del repositorio**,
ejecuta `vercel build`, despliega con `vercel deploy --prebuilt` y verifica
`/api/health` antes de dar el run por bueno.

### Secrets necesarios

En **Settings → Secrets and variables → Actions**:

| Secret | De dónde sale |
| --- | --- |
| `VERCEL_TOKEN` | vercel.com/account/tokens |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | idem |

`VERCEL_ORG_ID` y `VERCEL_PROJECT_ID` van en claro en el workflow: son
identificadores, no credenciales, y sin `VERCEL_TOKEN` no sirven de nada.

Si falta alguno, el run falla en el primer paso con un mensaje explícito en vez
de romper a mitad del build.

## Frontend y backend

Son el mismo despliegue. Vercel empaqueta las rutas de servidor como funciones:

- `app/page.tsx` + `components/TodoApp.tsx` — cliente, habla directo con Supabase
- `app/api/health/route.ts` — ruta de servidor, consulta Supabase desde la lambda
  y devuelve `{ ok, database, todos }`

## Esquema

```sql
create table public.todos (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 500),
  is_done boolean not null default false,
  created_at timestamptz not null default now()
);
```

RLS está activado con una única política que da acceso total al rol `anon`.

## Desarrollo local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Sin `.env.local` la app falla al arrancar con un error explícito: no hay claves
hardcodeadas en el código.

## Aviso de seguridad

Dos cosas que esta POC no resuelve y que no debes arrastrar a producción:

1. **La tabla `todos` está abierta.** Sin autenticación, la política de RLS
   permite lectura y escritura a cualquiera que conozca la URL.
2. **`NEXT_PUBLIC_*` no es secreto.** Guardar estas variables en los secrets de
   GitHub evita tenerlas en el repositorio, pero Next.js las inlinea en el bundle
   del navegador, así que acaban siendo públicas de todos modos. Es inherente a
   la anon key de Supabase, que está diseñada para ser pública y protegida por
   RLS. El pipeline sí protege de verdad cualquier variable **sin** el prefijo
   `NEXT_PUBLIC_` (por ejemplo una `SUPABASE_SERVICE_ROLE_KEY`), que solo existe
   en el servidor.
