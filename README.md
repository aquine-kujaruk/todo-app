# Todo POC — Next.js + Supabase + Vercel

Prueba de concepto: un todo list sencillo, sin autenticación de usuarios, donde
**el navegador nunca habla con Supabase**. Toda la base de datos queda detrás de
las rutas de servidor de la propia app.

## Arquitectura

```
Navegador  ──fetch /api/todos──►  Lambda de Vercel  ──service_role key──►  Supabase
(no tiene claves)                 (Next.js Route Handler)                  (RLS cerrado)
```

- `components/TodoApp.tsx` — cliente. Solo hace `fetch` al mismo origen. No
  importa el SDK de Supabase ni conoce ninguna clave.
- `app/api/todos/route.ts` y `app/api/todos/[id]/route.ts` — el backend. Validan
  la entrada y hablan con Supabase.
- `lib/supabaseServer.ts` — importa `server-only`, así que **el build falla** si
  alguien intenta usarlo desde un componente de cliente.

Las variables no llevan prefijo `NEXT_PUBLIC_`, de modo que Next no las inlinea
en el bundle: solo existen en el proceso del servidor.

## Por qué la base de datos está realmente cerrada

La tabla `todos` tiene RLS activo y **ninguna política**, y se han revocado los
permisos de los roles `anon` y `authenticated`. Con eso, la clave pública no
sirve para nada:

```console
$ curl "$SUPABASE_URL/rest/v1/todos?select=*" -H "apikey: <clave pública>"
{"code":"42501","message":"permission denied for table todos"}
```

La `service_role` key se salta RLS, y solo vive en el servidor. El único camino
a los datos es pasar por `/api`.

## Dónde van las claves

**En Vercel**, no en el repositorio ni en GitHub: Project `todo-poc` → Settings →
Environment Variables.

| Variable | Valor |
| --- | --- |
| `SUPABASE_URL` | `https://itnmhhhqymgsegnntemk.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API Keys → `service_role` |

En GitHub solo hace falta un secret, `VERCEL_TOKEN`, para que la Action pueda
desplegar. Las credenciales de la base de datos nunca pasan por GitHub: el
workflow hace `vercel pull` y es Vercel quien las inyecta.

## Despliegue

`.github/workflows/deploy.yml`:

| Evento | Resultado |
| --- | --- |
| PR contra `main` | deploy de preview + comentario con la URL en el PR |
| Merge a `main` | deploy a producción |
| `workflow_dispatch` | deploy manual |

Tras desplegar, el workflow llama a `/api/health` y falla el run si el backend no
alcanza la base de datos, distinguiendo el caso de "faltan variables de entorno".

## API

| Método | Ruta | Cuerpo |
| --- | --- | --- |
| `GET` | `/api/todos` | — |
| `POST` | `/api/todos` | `{ "title": "…" }` |
| `PATCH` | `/api/todos/:id` | `{ "is_done": true }` |
| `DELETE` | `/api/todos/:id` | — |
| `GET` | `/api/health` | — |

## Esquema

```sql
create table public.todos (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 500),
  is_done boolean not null default false,
  created_at timestamptz not null default now()
);
```

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # y pega la service_role key
npm run dev
```

## Lo que esta POC sigue sin resolver

No hay autenticación de usuarios: cualquiera que abra la web puede modificar la
lista, porque la API no distingue quién llama. La diferencia con la versión
anterior es que ahora el acceso pasa por tu servidor, que es donde podrías poner
login, permisos o rate limiting. La base de datos ya no está expuesta.
