# Bitácoras Pala y Perforadora — Capstone Copper Mantoverde

Sistema web para digitalizar la bitácora en papel de **Operador equipo mina** /
**Mantenedor equipo mina**, con autenticación, roles, un dashboard de
seguimiento y un **Centro de Control** para el Supervisor / Jefe de Turno.

- **Frontend:** Next.js 14 (App Router) + Tailwind CSS
- **Backend / DB / Auth:** Supabase (Postgres + Auth + Row Level Security + Realtime)
- **Hosting:** Vercel

---

## 1. Roles del sistema

- **Operador equipo mina** → crea una bitácora por turno: equipo, fecha,
  grupo (G1–G4), **N° SAP** (actúa como firma/identificador del envío),
  check list de despacho y observaciones.
- **Mantenedor equipo mina** → ve el Dashboard con KPIs, filtros y el listado
  de bitácoras; entra a una bitácora y la avanza de estado: **Pendiente →
  En proceso → Finalizada**, dejando sus observaciones técnicas.
- **Supervisor / Jefe de Turno** → todo lo del Mantenedor, más:
  - Puede dejar **directrices** sobre cualquier bitácora (sección dedicada en
    el detalle).
  - Tiene acceso al **Centro de Control** (`/dashboard/control`): un tablero
    tipo Kanban con el flujo de **Órdenes de Trabajo** (Nueva → Asignada → En
    progreso → Verificar → Cerrada) y un panel de **Inventario / Spare
    Parts** con alerta de stock bajo y seguimiento de compra (Disponible →
    Solicitado → En compra → Comprado), actualizado **en tiempo real** entre
    todos los que tengan la pantalla abierta.
- **admin** → mismo acceso que Supervisor (rol de respaldo/soporte).

Cada fila de la tabla `bitacoras` representa una hoja física completa (lado
operador + lado mantenedor + directrices del supervisor en un solo registro).

## 2. Configurar Supabase

### Proyecto nuevo (primera vez)

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Ve a **SQL Editor → New query**, pega el contenido completo de
   [`supabase/schema.sql`](./supabase/schema.sql) y ejecútalo.
3. En **Authentication → Providers**, confirma que **Email** esté habilitado.
   Para pruebas internas, puedes desactivar "Confirm email" en
   **Authentication → Settings** para no depender de SMTP.
4. Copia `Project URL` y `anon public key` desde **Project Settings → API**.

### Proyecto que ya tenías corriendo (actualización)

Si ya tenías el sistema desplegado antes de los roles Supervisor / N° SAP /
Centro de Control, **no vuelvas a correr `schema.sql`** (fallaría por
políticas duplicadas). En vez de eso, corre una sola vez:
[`supabase/migration_02_supervisor.sql`](./supabase/migration_02_supervisor.sql)

Esta migración es aditiva y segura sobre datos existentes: agrega el rol
`supervisor`, la columna `numero_sap`, cambia los estados de bitácora
(`revisada` pasa a `finalizada` automáticamente) y crea las tablas
`ordenes_trabajo` y `repuestos`.

### Primer usuario Supervisor / Mantenedor

Cualquiera puede registrarse eligiendo su rol en `/register` (pensado para
uso interno). Si prefieres controlarlo tú:

```sql
update public.profiles set rol = 'supervisor' where id = 'UUID_DEL_USUARIO';
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

Abre `http://localhost:3000`, crea una cuenta en `/register` (Operador,
Mantenedor o Supervisor) y prueba el flujo.

## 5. Desplegar en Vercel

1. Sube este proyecto a un repositorio de GitHub/GitLab.
2. En [vercel.com](https://vercel.com), **Add New → Project**, importa el
   repo.
3. En **Environment Variables**, agrega:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy. Vercel detecta Next.js automáticamente (no requiere configuración
   adicional).

## 6. Estructura del proyecto

```
supabase/schema.sql                  → esquema completo (instalación nueva)
supabase/migration_02_supervisor.sql → migración aditiva (proyecto ya existente)
public/logo-capstone.png             → logo de la empresa, usado en sidebar/login/registro
middleware.js                        → protege rutas y refresca la sesión
src/lib/roles.js                     → helper de roles (isStaff / isSupervisor)
src/lib/supabase/                    → clientes de Supabase (browser, server, middleware)
src/components/                      → AppShell (sidebar + logo), UI (badges, KPI cards)
src/app/login, /register             → autenticación (con selector de rol)
src/app/bitacoras                    → lista y creación de bitácoras (operador, incluye N° SAP)
src/app/bitacoras/[id]                → detalle: revisión del mantenedor + directrices del supervisor
src/app/dashboard                     → dashboard con KPIs, alerta de pendiente más antigua, filtros y tabla
src/app/dashboard/equipos            → alta de palas/perforadoras
src/app/dashboard/control            → Centro de Control: Kanban de OT + inventario (Supervisor)
```

## 7. Personalización rápida

- **Agregar más equipos:** desde `/dashboard/equipos`, o directamente en la
  tabla `equipos` en Supabase.
- **Agregar más grupos/turnos:** fijados a `G1`–`G4` en el `check` de la
  tabla `bitacoras` y en los formularios.
- **Etapas de las órdenes de trabajo:** `nueva, asignada, en_progreso,
  verificar, cerrada` — editables en el `check` de `ordenes_trabajo` y en
  `OrdenesKanban.js`.
- **Cambiar el logo:** reemplaza `public/logo-capstone.png` por otro archivo
  con el mismo nombre.
- **Colores / estilo:** `tailwind.config.js` (paleta `bg`, `panel`, `accent`,
  etc.).
