# TutoMatch UPTC · React + TypeScript + Supabase

Aplicación full-stack para registrar tutorías, administrar el catálogo de asignaturas y gestionar PQRS en tiempo real.

## Ejecutar

```bash
npm install
cp .env.example .env
npm run dev
```

Configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`. El frontend usa exclusivamente el cliente oficial `@supabase/supabase-js` para sus operaciones de base de datos.

## Migraciones

Ejecuta en Supabase SQL Editor, en este orden:

1. `supabase/migrations/schema.sql`
2. `supabase/migrations/policies.sql`

El esquema crea `solicitudes_tutoria`, `materias` y `pqrs`, sus índices, datos iniciales y las tres tablas en `supabase_realtime`.

## Administrador

Crea un usuario en Supabase Auth y asigna su rol en `app_metadata` desde un entorno seguro de administración:

```ts
await supabase.auth.admin.updateUserById(userId, { app_metadata: { role: 'admin' } });
```

No uses `user_metadata` para autorización. El dashboard consulta y modifica únicamente si el JWT contiene `app_metadata.role = admin`; las políticas RLS cubren select/update/delete.

## Funciones

- Landing responsive con modo claro/oscuro y fondo oscuro `#131314`.
- Logo UPTC real reutilizado desde el ZIP como `public/uptc-logo.svg` y `public/uptc-logo.jpg`.
- Typewriting, skeleton de catálogo, glowing validation y selección animada.
- Catálogo por Licenciaturas, Ingenierías y Arquitectura.
- Alta de solicitudes con validación y unicidad por `codigo_est`.
- Dashboard con Auth, métricas, gráfico por área, tabla filtrable, CRUD de asignaturas y vista PQRS.
- Suscripciones Realtime para materias, solicitudes y PQRS.
- Footer con PQRS, política de privacidad y política de uso.
