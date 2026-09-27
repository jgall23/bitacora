-- =========================================================
-- MIGRACIÓN 03 — N° SAP también para Mantenedor y Supervisor
-- Pega este archivo completo en Supabase > SQL Editor > New query > Run
-- Aditiva y segura sobre datos existentes.
-- =========================================================

alter table public.bitacoras add column if not exists numero_sap_mantenedor text;
alter table public.bitacoras add column if not exists numero_sap_supervisor text;

-- =========================================================
-- FIN MIGRACIÓN 03
-- =========================================================
