-- =========================================================
-- MIGRACIÓN 04 — Capa "Gold" para Power BI / Data Lake
-- Pega este archivo completo en Supabase > SQL Editor > New query > Run
-- Aditiva y segura: solo crea un esquema nuevo, vistas y un rol de
-- solo lectura. No modifica ninguna tabla ni política existente.
--
-- Qué resuelve:
--   Hoy el sistema vive en Supabase (Postgres) y no en un data lake.
--   En vez de replicar toda la base "cruda" (capa Bronze) a otro sistema,
--   armamos directamente una capa "Gold" (datos listos para reportes:
--   nombres resueltos, tiempos calculados, una fila por hecho) dentro del
--   mismo Postgres, en un esquema separado llamado "gold". Power BI se
--   conecta solo a ese esquema, con un usuario de solo lectura.
--
--   Si en el futuro migran a un data lake real (Azure Data Lake + Fabric/
--   Synapse/Databricks, por ejemplo), estas mismas vistas sirven como
--   referencia de qué columnas y cálculos debe tener la capa Gold allá.
-- =========================================================

create schema if not exists gold;

-- ---------------------------------------------------------
-- 1) gold.dim_equipo — dimensión de equipos
-- ---------------------------------------------------------
create or replace view gold.dim_equipo as
select
  id as equipo_id,
  numero_equipo,
  tipo,
  modelo,
  activo
from public.equipos;

-- ---------------------------------------------------------
-- 2) gold.dim_usuario — dimensión de usuarios (sin datos de auth sensibles)
-- ---------------------------------------------------------
create or replace view gold.dim_usuario as
select
  id as usuario_id,
  nombre_completo,
  rol,
  created_at as fecha_registro
from public.profiles;

-- ---------------------------------------------------------
-- 3) gold.fact_bitacoras — una fila por bitácora, lista para reportes
-- ---------------------------------------------------------
create or replace view gold.fact_bitacoras as
select
  b.id as bitacora_id,
  b.fecha,
  b.grupo,
  b.numero_sap as numero_sap_operador,
  b.operador_nombre,
  b.checklist_despacho,
  b.observaciones_operador,
  b.estado,

  b.mantenedor_nombre,
  b.fecha_revision,
  b.grupo_revision,
  b.numero_sap_mantenedor,
  b.observaciones_mantenedor,
  b.reviewed_at,

  b.supervisor_nombre,
  b.numero_sap_supervisor,
  b.directrices_supervisor,
  b.directrices_at,

  e.numero_equipo,
  e.tipo as equipo_tipo,
  e.modelo as equipo_modelo,

  b.created_at,
  b.updated_at,

  -- Tiempo entre que el operador reporta y el mantenedor revisa, en horas
  case
    when b.reviewed_at is not null
      then round(extract(epoch from (b.reviewed_at - b.created_at)) / 3600.0, 1)
    else null
  end as horas_hasta_revision

from public.bitacoras b
left join public.equipos e on e.id = b.equipo_id;

-- ---------------------------------------------------------
-- 4) gold.fact_ordenes_trabajo — una fila por orden de trabajo
-- ---------------------------------------------------------
create or replace view gold.fact_ordenes_trabajo as
select
  o.id as orden_id,
  o.codigo,
  o.titulo,
  o.descripcion,
  o.estado,
  o.asignado_nombre,
  o.creado_por_nombre,

  e.numero_equipo,
  e.tipo as equipo_tipo,
  e.modelo as equipo_modelo,

  o.created_at,
  o.updated_at,

  case
    when o.estado = 'cerrada'
      then round(extract(epoch from (o.updated_at - o.created_at)) / 3600.0, 1)
    else null
  end as horas_hasta_cierre

from public.ordenes_trabajo o
left join public.equipos e on e.id = o.equipo_id;

-- ---------------------------------------------------------
-- 5) gold.kpi_diario — resumen diario (para gráficos de tendencia)
-- ---------------------------------------------------------
create or replace view gold.kpi_diario as
select
  fecha,
  count(*) as bitacoras_creadas,
  count(*) filter (where checklist_despacho) as con_checklist,
  count(*) filter (where estado = 'pendiente') as pendientes,
  count(*) filter (where estado = 'en_proceso') as en_proceso,
  count(*) filter (where estado = 'finalizada' or estado = 'revisada') as finalizadas
from public.bitacoras
group by fecha;

-- ---------------------------------------------------------
-- 6) Rol de solo lectura para Power BI
-- ---------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'powerbi_reader') then
    create role powerbi_reader login password 'CAMBIA_ESTA_CONTRASENA';
  end if;
end $$;

grant usage on schema gold to powerbi_reader;
grant select on all tables in schema gold to powerbi_reader;
alter default privileges in schema gold grant select on tables to powerbi_reader;

-- =========================================================
-- FIN MIGRACIÓN 04
--
-- IMPORTANTE — pasos manuales después de correr esto:
-- 1) Ve a Supabase > SQL Editor y cambia la contraseña real:
--      alter role powerbi_reader with password 'UNA_CONTRASENA_SEGURA_AQUI';
-- 2) En Supabase > Project Settings > Database, copia el "Connection string"
--    (usa el modo "Session" o "Transaction pooler", puerto 6543 o 5432).
-- 3) En Power BI Desktop: Obtener datos > Base de datos > PostgreSQL.
--    - Servidor: el host que copiaste (termina en .supabase.co o
--      .pooler.supabase.com)
--    - Base de datos: postgres
--    - Usuario: powerbi_reader
--    - Contraseña: la que configuraste en el paso 1
--    - Modo de conectividad de datos: Import (recomendado) o DirectQuery
-- 4) En el navegador de Power BI, abre el esquema "gold" (no "public") y
--    selecciona las tablas/vistas que necesites.
-- =========================================================
