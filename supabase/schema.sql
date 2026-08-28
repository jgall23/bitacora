-- =========================================================
-- Bitácoras Capstone Copper Mantoverde - Esquema Supabase
-- Pega este archivo completo en Supabase > SQL Editor > New query > Run
-- =========================================================

-- Extensión para UUID
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- 1. TABLA DE PERFILES (roles de usuario)
-- ---------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre_completo text not null,
  rol text not null default 'operador' check (rol in ('operador','mantenedor','supervisor','admin')),
  created_at timestamptz not null default now()
);

-- Helper: saber si el usuario actual es staff (mantenedor, supervisor o admin).
-- SECURITY DEFINER es clave: así esta función no vuelve a disparar las
-- políticas RLS de "profiles" al consultarla (evita recursión infinita).
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

-- Helper: saber si el usuario actual es Supervisor / Jefe de Turno (o admin).
-- Se usa para las acciones exclusivas del Centro de Control (órdenes de
-- trabajo, inventario de repuestos y directrices sobre las bitácoras).
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

alter table public.profiles enable row level security;

create policy "profiles_select_own_or_staff"
  on public.profiles for select
  using (
    auth.uid() = id
    or public.es_staff()
  );

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Función/trigger: crea el perfil automáticamente cuando alguien se registra
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nombre_completo, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre_completo', new.email),
    coalesce(new.raw_user_meta_data->>'rol', 'operador')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------
-- 2. TABLA DE EQUIPOS (Pala PC5500, Perforadora, etc.)
-- ---------------------------------------------------------
create table if not exists public.equipos (
  id uuid primary key default gen_random_uuid(),
  numero_equipo text not null unique,
  tipo text not null check (tipo in ('pala','perforadora','otro')),
  modelo text not null default 'PC5500',
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.equipos enable row level security;

create policy "equipos_select_all_authenticated"
  on public.equipos for select
  to authenticated
  using (true);

create policy "equipos_write_staff"
  on public.equipos for all
  to authenticated
  using (public.es_staff())
  with check (public.es_staff());

-- Datos de ejemplo (opcional, puedes borrar estas líneas)
insert into public.equipos (numero_equipo, tipo, modelo)
values
  ('000012', 'pala', 'PC5500'),
  ('000013', 'pala', 'PC5500'),
  ('000021', 'perforadora', 'D245S')
on conflict (numero_equipo) do nothing;

-- ---------------------------------------------------------
-- 3. TABLA BITACORAS (une la hoja del operador + la del mantenedor)
-- ---------------------------------------------------------
create table if not exists public.bitacoras (
  id uuid primary key default gen_random_uuid(),
  equipo_id uuid not null references public.equipos (id),

  -- Lado OPERADOR
  operador_id uuid references auth.users (id),
  operador_nombre text not null,
  fecha date not null default current_date,
  grupo text not null check (grupo in ('G1','G2','G3','G4')),
  checklist_despacho boolean not null default false,
  observaciones_operador text not null default '',
  numero_sap text, -- N° SAP ingresado por el operador; actúa como firma/identificador del envío

  -- Estado / lado MANTENEDOR
  -- pendiente -> en_proceso -> finalizada (controlado por Mantenedor y supervisado por Supervisor/Jefe de Turno)
  estado text not null default 'pendiente' check (estado in ('pendiente','en_proceso','finalizada')),
  mantenedor_id uuid references auth.users (id),
  mantenedor_nombre text,
  fecha_revision date,
  grupo_revision text check (grupo_revision in ('G1','G2','G3','G4')),
  observaciones_mantenedor text,
  reviewed_at timestamptz,

  -- Seguimiento del Supervisor / Jefe de Turno
  directrices_supervisor text,
  supervisor_id uuid references auth.users (id),
  supervisor_nombre text,
  directrices_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_bitacoras_equipo on public.bitacoras (equipo_id);
create index if not exists idx_bitacoras_fecha on public.bitacoras (fecha desc);
create index if not exists idx_bitacoras_estado on public.bitacoras (estado);
create index if not exists idx_bitacoras_operador on public.bitacoras (operador_id);

alter table public.bitacoras enable row level security;

-- Operadores ven las suyas, staff ve todas
create policy "bitacoras_select"
  on public.bitacoras for select
  to authenticated
  using (
    operador_id = auth.uid()
    or public.es_staff()
  );

-- Cualquier usuario autenticado con rol operador (o staff) puede crear su propia bitácora
create policy "bitacoras_insert"
  on public.bitacoras for insert
  to authenticated
  with check (
    operador_id = auth.uid()
  );

-- El operador puede editar SOLO su propia bitácora mientras siga 'pendiente'
-- El staff (mantenedor/admin) puede editar cualquiera (para completar la revisión)
create policy "bitacoras_update"
  on public.bitacoras for update
  to authenticated
  using (
    (operador_id = auth.uid() and estado = 'pendiente')
    or public.es_staff()
  )
  with check (
    (operador_id = auth.uid())
    or public.es_staff()
  );

create policy "bitacoras_delete_staff"
  on public.bitacoras for delete
  to authenticated
  using (public.es_staff());

-- Trigger: mantener updated_at al día
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_bitacoras_updated_at on public.bitacoras;
create trigger trg_bitacoras_updated_at
  before update on public.bitacoras
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------
-- 4. ÓRDENES DE TRABAJO (Centro de Control Supervisor / Jefe de Turno)
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

create policy "ot_select_staff"
  on public.ordenes_trabajo for select
  to authenticated
  using (public.es_staff());

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
-- 5. INVENTARIO DE REPUESTOS (Spare Parts)
-- ---------------------------------------------------------
create table if not exists public.repuestos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  stock_actual integer not null default 0,
  stock_minimo integer not null default 0,
  unidad text not null default 'unidades',
  -- disponible -> solicitado -> en_compra -> comprado (llegó a bodega)
  estado_compra text not null default 'disponible' check (estado_compra in ('disponible','solicitado','en_compra','comprado')),
  fecha_estimada_llegada date,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_repuestos_estado on public.repuestos (estado_compra);

alter table public.repuestos enable row level security;

create policy "repuestos_select_staff"
  on public.repuestos for select
  to authenticated
  using (public.es_staff());

create policy "repuestos_write_staff"
  on public.repuestos for all
  to authenticated
  using (public.es_staff())
  with check (public.es_staff());

drop trigger if exists trg_repuestos_updated_at on public.repuestos;
create trigger trg_repuestos_updated_at
  before update on public.repuestos
  for each row execute procedure public.set_updated_at();

-- Datos de ejemplo (opcional, puedes borrar estas líneas)
insert into public.repuestos (nombre, stock_actual, stock_minimo, unidad, estado_compra)
values
  ('Bearing Sets (H-Series)', 2, 5, 'sets', 'solicitado'),
  ('Cooling Fan Assy', 14, 4, 'unidades', 'disponible'),
  ('Hydraulic Filters', 0, 10, 'unidades', 'en_compra')
on conflict do nothing;

-- Habilita actualizaciones en tiempo real para el Centro de Control
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
-- FIN DEL ESQUEMA
-- Después de correr esto:
-- 1) Ve a Authentication > Providers y confirma que Email esté habilitado.
-- 2) (Opcional) En Authentication > Settings desactiva "Confirm email" para
--    pruebas internas más rápidas, o configura el SMTP para producción.
-- 3) El primer usuario que quieras que sea "mantenedor", "supervisor" o
--    "admin" debe actualizarse manualmente una vez registrado:
--       update public.profiles set rol = 'supervisor' where id = 'UUID_DEL_USUARIO';
-- =========================================================
