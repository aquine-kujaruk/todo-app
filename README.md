# Todo POC — Next.js + Supabase + Vercel

Prueba de concepto para validar que el flujo **Claude → GitHub → Vercel → Supabase**
es suficiente para crear y desplegar una app sin salir del chat.

## Qué hace

Un todo list sencillo: crear, marcar como hecha y borrar tareas. Sin autenticación.
La data se persiste en Postgres (Supabase).

## Stack

- **Next.js 15** (App Router, TypeScript), cliente React que habla directo con Supabase
- **Supabase** — proyecto `todo-poc` (`itnmhhhqymgsegnntemk`, región `eu-west-1`)
- **Vercel** — despliegue en producción

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
cp .env.example .env.local   # opcional: el código ya trae los valores por defecto
npm run dev
```

## Configuración

`lib/supabase.ts` lee `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
y si no están definidas usa los valores del proyecto POC como fallback. Esto permite
desplegar sin tocar el panel de Vercel. Ambos valores son públicos por diseño: en
cualquier app cliente de Supabase viajan al navegador.

## Aviso de seguridad

Al no haber autenticación, la política de RLS deja la tabla `todos` abierta en
lectura y escritura para cualquiera que conozca la URL. Es aceptable para una POC
desechable; para algo real hace falta auth y políticas por usuario.
