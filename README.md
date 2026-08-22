# Bitácoras Pala y Perforadora — Capstone Copper Mantoverde

Sistema web para digitalizar la bitácora en papel de **Operador equipo mina** /
**Mantenedor equipo mina**, con autenticación, roles y un dashboard para el
mantenedor / jefe de terreno o mantenimiento mina.

- **Frontend:** Next.js 14 (App Router) + Tailwind CSS
- **Backend / DB / Auth:** Supabase (Postgres + Auth + Row Level Security)
- **Hosting:** Vercel

---

## 1. Cómo está organizado

- `operador` → crea una bitácora (equipo, fecha, grupo/turno G1-G4, check list
  de despacho, observaciones).
- `mantenedor` (o `admin`) → ve el **Dashboard** con KPIs, filtros y el listado
  de todas las bitácoras; al entrar a una bitácora pendiente puede completar
  el lado "Mantenedor equipo mina" (nombre, fecha, grupo, observaciones), lo
  que la marca como **revisada**.

Cada fila de la tabla `bitacoras` representa una hoja física completa (ambos
lados de la bitácora en un solo registro), tal como en el papel adjunto.

## 2. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Ve a **SQL Editor → New query**, pega el contenido completo de
   [`supabase/schema.sql`](./supabase/schema.sql) y ejecútalo. Esto crea:
   - `profiles` (rol: `operador`, `mantenedor`, `admin`) con un trigger que
     crea el perfil automáticamente al registrarse.
   - `equipos` (palas/perforadoras).
   - `bitacoras` con Row Level Security:
     - Un operador solo ve/edita sus propias bitácoras (y solo mientras estén
       `pendiente`).
     - Un mantenedor/admin ve y edita todas.
3. En **Authentication → Providers**, confirma que **Email** esté habilitado.
   Para pruebas internas, puedes desactivar "Confirm email" en
   **Authentication → Settings** para no depender de SMTP.
4. Copia `Project URL` y `anon public key` desde **Project Settings → API**.

### Primer usuario mantenedor

Cualquiera puede registrarse eligiendo el rol "Mantenedor" en `/register`
(pensado para uso interno). Si prefieres controlarlo tú:

```sql
update public.profiles set rol = 'mantenedor' where id = 'UUID_DEL_USUARIO';
```

## 3. Configurar variables de entorno

Copia `.env.local.example` a `.env.local` y completa con tus datos de
Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_ANON_KEY
```

## 4. Correr en local

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`, crea una cuenta en `/register` (rol operador o
mantenedor) y prueba el flujo.

## 5. Desplegar en Vercel

1. Sube este proyecto a un repositorio de GitHub/GitLab.
2. En [vercel.com](https://vercel.com), **Add New → Project**, importa el
   repo.
3. En **Environment Variables**, agrega:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy. Vercel detecta Next.js automáticamente (no requiere configuración
   adicional).
5. (Opcional) En Supabase, agrega la URL de Vercel a **Authentication → URL
   Configuration → Site URL / Redirect URLs** si más adelante agregas login
   con magic link u OAuth.

## 6. Estructura del proyecto

```
supabase/schema.sql        → esquema completo (tablas + RLS) para pegar en Supabase
middleware.js               → protege rutas y refresca la sesión
src/lib/supabase/           → clientes de Supabase (browser, server, middleware)
src/components/             → AppShell (sidebar responsivo), UI (badges, KPI cards)
src/app/login, /register    → autenticación
src/app/bitacoras           → lista y creación de bitácoras (operador)
src/app/bitacoras/[id]      → detalle + formulario de revisión (mantenedor)
src/app/dashboard           → dashboard con KPIs, alerta de pendiente más antigua, filtros y tabla
src/app/dashboard/equipos   → alta de palas/perforadoras
```

## 7. Personalización rápida

- **Agregar más equipos:** desde `/dashboard/equipos` (rol mantenedor/admin),
  o directamente en la tabla `equipos` en Supabase.
- **Agregar más grupos/turnos:** están fijados a `G1`–`G4` en el `check` de la
  tabla `bitacoras` y en los formularios; edítalos si tu operación usa otra
  nomenclatura.
- **Colores / estilo:** `tailwind.config.js` (paleta `bg`, `panel`, `accent`,
  etc.) — inspirado en el dashboard de referencia entregado.
