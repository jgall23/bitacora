-- =========================================================
-- MIGRACIÓN 02 — Requerimientos de reunión con Superintendencia
-- Pega este archivo completo en Supabase > SQL Editor > New query > Run
-- Es seguro correrlo aunque ya tengas datos: usa IF NOT EXISTS / IF EXISTS
-- en todo lo que modifica estructuras existentes.
-- =========================================================

-- ---------------------------------------------------------
-- 1) Rol "supervisor"
-- ---------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_rol_check;
alter table public.profiles add constraint profiles_rol_check
  check (rol in ('operador','mantenedor','supervisor','admin'));

-- es_staff ahora también reconoce a "supervisor"
create or replace function public.es_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and rol in ('mantenedor','supervisor','admin')
  );
$$;

-- Nuevo helper: solo Supervisor / Jefe de Turno (o admin)
create or replace function public.es_supervisor()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and rol in ('supervisor','admin')
  );
$$;

-- ---------------------------------------------------------
-- 2) Bitácoras: N° SAP, estados de 3 etapas, directrices del supervisor
-- ---------------------------------------------------------
alter table public.bitacoras add column if not exists numero_sap text;
alter table public.bitacoras add column if not exists directrices_supervisor text;
alter table public.bitacoras add column if not exists supervisor_id uuid references auth.users (id);
alter table public.bitacoras add column if not exists supervisor_nombre text;
alter table public.bitacoras add column if not exists directrices_at timestamptz;

-- Importante: quitamos la restricción VIEJA antes de tocar los datos,
-- si no, el UPDATE de abajo choca contra la regla anterior (pendiente/revisada).
alter table public.bitacoras drop constraint if exists bitacoras_estado_check;

-- Migra los datos existentes: "revisada" pasa a ser "finalizada"
update public.bitacoras set estado = 'finalizada' where estado = 'revisada';

alter table public.bitacoras drop constraint if exists bitacoras_estado_check;
alter table public.bitacoras add constraint bitacoras_estado_check
  check (estado in ('pendiente','en_proceso','finalizada'));

-- ---------------------------------------------------------
-- 3) Tabla ÓRDENES DE TRABAJO
-- ---------------------------------------------------------
create sequence if not exists public.ordenes_trabajo_codigo_seq;

create table if not exists public.ordenes_trabajo (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique default ('WO-' || lpad(nextval('public.ordenes_trabajo_codigo_seq')::text, 5, '0')),
  equipo_id uuid references public.equipos (id),
  bitacora_id uuid references public.bitacoras (id) on delete set null,
  titulo text not null,
  descripcion text not null default '',
  estado text not null default 'nueva' check (estado in ('nueva','asignada','en_progreso','verificar','cerrada')),
  asignado_id uuid references auth.users (id),
  asignado_nombre text,
  creado_por uuid references auth.users (id),
  creado_por_nombre text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ot_estado on public.ordenes_trabajo (estado);
create index if not exists idx_ot_equipo on public.ordenes_trabajo (equipo_id);

alter table public.ordenes_trabajo enable row level security;

drop policy if exists "ot_select_staff" on public.ordenes_trabajo;
create policy "ot_select_staff"
  on public.ordenes_trabajo for select
  to authenticated
  using (public.es_staff());

drop policy if exists "ot_write_staff" on public.ordenes_trabajo;
create policy "ot_write_staff"
  on public.ordenes_trabajo for all
  to authenticated
  using (public.es_staff())
  with check (public.es_staff());

drop trigger if exists trg_ot_updated_at on public.ordenes_trabajo;
create trigger trg_ot_updated_at
  before update on public.ordenes_trabajo
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------
-- 4) Tabla INVENTARIO DE REPUESTOS
-- ---------------------------------------------------------
create table if not exists public.repuestos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  stock_actual integer not null default 0,
  stock_minimo integer not null default 0,
  unidad text not null default 'unidades',
  estado_compra text not null default 'disponible' check (estado_compra in ('disponible','solicitado','en_compra','comprado')),
  fecha_estimada_llegada date,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_repuestos_estado on public.repuestos (estado_compra);

alter table public.repuestos enable row level security;

drop policy if exists "repuestos_select_staff" on public.repuestos;
create policy "repuestos_select_staff"
  on public.repuestos for select
  to authenticated
  using (public.es_staff());

drop policy if exists "repuestos_write_staff" on public.repuestos;
create policy "repuestos_write_staff"
  on public.repuestos for all
  to authenticated
  using (public.es_staff())
  with check (public.es_staff());

drop trigger if exists trg_repuestos_updated_at on public.repuestos;
create trigger trg_repuestos_updated_at
  before update on public.repuestos
  for each row execute procedure public.set_updated_at();

insert into public.repuestos (nombre, stock_actual, stock_minimo, unidad, estado_compra)
values
  ('Bearing Sets (H-Series)', 2, 5, 'sets', 'solicitado'),
  ('Cooling Fan Assy', 14, 4, 'unidades', 'disponible'),
  ('Hydraulic Filters', 0, 10, 'unidades', 'en_compra')
on conflict do nothing;

-- ---------------------------------------------------------
-- 5) Tiempo real para el Centro de Control
-- ---------------------------------------------------------
do $$
begin
  begin
    alter publication supabase_realtime add table public.ordenes_trabajo;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.repuestos;
  exception when duplicate_object then null;
  end;
end $$;

-- =========================================================
-- FIN MIGRACIÓN 02
-- Para convertir a alguien en Supervisor / Jefe de Turno:
--   update public.profiles set rol = 'supervisor' where id = 'UUID_DEL_USUARIO';
-- =========================================================
