import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserAndProfile } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import { StatCard, EstadoBadge, GrupoBadge, ChecklistBadge } from "@/components/UI";
import DashboardFilters from "./DashboardFilters";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }) {
  const { supabase, user, profile } = await getUserAndProfile();
  if (!user) redirect("/login");

  const isStaff = profile?.rol === "mantenedor" || profile?.rol === "admin";
  if (!isStaff) redirect("/bitacoras");

  const { equipo, grupo, estado, fecha_desde, fecha_hasta } = searchParams || {};

  // --- KPIs generales (sobre todas las bitácoras) ---
  const { count: totalBitacoras } = await supabase
    .from("bitacoras")
    .select("id", { count: "exact", head: true });

  const { count: pendientes } = await supabase
    .from("bitacoras")
    .select("id", { count: "exact", head: true })
    .eq("estado", "pendiente");

  const { count: sinChecklist } = await supabase
    .from("bitacoras")
    .select("id", { count: "exact", head: true })
    .eq("checklist_despacho", false);

  const hoy = new Date().toISOString().slice(0, 10);
  const { count: hoyCount } = await supabase
    .from("bitacoras")
    .select("id", { count: "exact", head: true })
    .eq("fecha", hoy);

  const { data: equipos } = await supabase
    .from("equipos")
    .select("id, numero_equipo, tipo, modelo")
    .order("numero_equipo");

  // --- Listado filtrado ---
  let query = supabase
    .from("bitacoras")
    .select(
      "id, fecha, grupo, estado, checklist_despacho, operador_nombre, observaciones_operador, equipos(numero_equipo, tipo, modelo)"
    )
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  if (equipo) query = query.eq("equipo_id", equipo);
  if (grupo) query = query.eq("grupo", grupo);
  if (estado) query = query.eq("estado", estado);
  if (fecha_desde) query = query.gte("fecha", fecha_desde);
  if (fecha_hasta) query = query.lte("fecha", fecha_hasta);

  const { data: bitacoras } = await query;

  // --- Bitácora pendiente más urgente (más antigua sin revisar) ---
  const { data: urgente } = await supabase
    .from("bitacoras")
    .select(
      "id, fecha, grupo, operador_nombre, observaciones_operador, checklist_despacho, equipos(numero_equipo, tipo, modelo)"
    )
    .eq("estado", "pendiente")
    .order("fecha", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (
    <AppShell profile={profile} active="/dashboard">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">
            Dashboard de bitácoras
          </h1>
          <p className="text-sm text-muted">
            Pala y Perforadora · Capstone Copper Mantoverde
          </p>
        </div>
        <Link
          href="/dashboard/equipos"
          className="text-sm text-muted hover:text-white border border-border rounded-xl px-4 py-2.5 flex items-center gap-2"
        >
          <i className="fas fa-truck-monster" />
          Gestionar equipos
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <StatCard
          icon="fa-book"
          label="Bitácoras totales"
          value={totalBitacoras ?? 0}
        />
        <StatCard
          icon="fa-hourglass-half"
          label="Pendientes de revisión"
          value={pendientes ?? 0}
          trend={pendientes > 0 ? `${pendientes} por revisar` : "al día"}
          trendType={pendientes > 0 ? "warning" : "good"}
        />
        <StatCard
          icon="fa-clipboard-check"
          label="Sin check list despacho"
          value={sinChecklist ?? 0}
          trend={sinChecklist > 0 ? "revisar" : "OK"}
          trendType={sinChecklist > 0 ? "danger" : "good"}
        />
        <StatCard
          icon="fa-calendar-day"
          label="Registradas hoy"
          value={hoyCount ?? 0}
        />
      </div>

      {/* Alerta bitácora pendiente más urgente */}
      {urgente && (
        <div className="bg-gradient-to-br from-[#2d1f1f] to-[#241a1a] border-l-4 border-bad rounded-xl2 p-5 md:p-6">
          <div className="flex items-center gap-2 text-bad font-bold mb-3">
            <i className="fas fa-exclamation-circle" />
            BITÁCORA PENDIENTE MÁS ANTIGUA
          </div>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="text-lg font-extrabold text-accent2 bg-black/30 rounded-xl px-3 py-1.5">
              N° {urgente.equipos?.numero_equipo}
            </span>
            <span className="text-white text-sm">
              {urgente.equipos?.tipo === "pala" ? "Pala" : "Perforadora"}{" "}
              {urgente.equipos?.modelo}
            </span>
            <GrupoBadge grupo={urgente.grupo} />
            <ChecklistBadge ok={urgente.checklist_despacho} />
          </div>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1 text-sm mb-3">
            <div className="flex justify-between border-b border-white/10 py-2">
              <span className="text-muted">Fecha:</span>
              <span className="text-white font-semibold">
                {new Date(urgente.fecha + "T00:00:00").toLocaleDateString(
                  "es-CL"
                )}
              </span>
            </div>
            <div className="flex justify-between border-b border-white/10 py-2">
              <span className="text-muted">Operador:</span>
              <span className="text-white font-semibold">
                {urgente.operador_nombre}
              </span>
            </div>
          </div>
          <p className="text-sm text-white/90 mb-4 line-clamp-3">
            {urgente.observaciones_operador || "Sin observaciones."}
          </p>
          <Link
            href={`/bitacoras/${urgente.id}`}
            className="inline-block bg-bad text-white text-sm font-semibold rounded-full px-4 py-2"
          >
            Revisar ahora
          </Link>
        </div>
      )}

      {/* Filtros */}
      <DashboardFilters
        equipos={equipos || []}
        current={{ equipo, grupo, estado, fecha_desde, fecha_hasta }}
      />

      {/* Tabla */}
      <div className="bg-panel border border-border rounded-xl2 p-5 md:p-6 overflow-x-auto">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <i className="fas fa-list text-accent" />
          Bitácoras
        </h3>

        {(!bitacoras || bitacoras.length === 0) && (
          <p className="text-muted text-sm py-8 text-center">
            No hay bitácoras que coincidan con los filtros.
          </p>
        )}

        {bitacoras && bitacoras.length > 0 && (
          <table className="w-full text-sm min-w-[820px]">
            <thead>
              <tr className="text-left text-muted border-b border-border">
                <th className="pb-3 font-medium">Equipo</th>
                <th className="pb-3 font-medium">Fecha</th>
                <th className="pb-3 font-medium">Grupo</th>
                <th className="pb-3 font-medium">Operador</th>
                <th className="pb-3 font-medium">Check list</th>
                <th className="pb-3 font-medium">Estado</th>
                <th className="pb-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {bitacoras.map((b) => (
                <tr
                  key={b.id}
                  className="border-b border-border/60 last:border-0"
                >
                  <td className="py-3 text-white font-semibold whitespace-nowrap">
                    {b.equipos?.tipo === "pala" ? "Pala" : "Perforadora"}{" "}
                    N° {b.equipos?.numero_equipo}
                  </td>
                  <td className="py-3 text-white whitespace-nowrap">
                    {new Date(b.fecha + "T00:00:00").toLocaleDateString(
                      "es-CL"
                    )}
                  </td>
                  <td className="py-3">
                    <GrupoBadge grupo={b.grupo} />
                  </td>
                  <td className="py-3 text-white">{b.operador_nombre}</td>
                  <td className="py-3">
                    <ChecklistBadge ok={b.checklist_despacho} />
                  </td>
                  <td className="py-3">
                    <EstadoBadge estado={b.estado} />
                  </td>
                  <td className="py-3 text-right">
                    <Link
                      href={`/bitacoras/${b.id}`}
                      className="text-accent text-sm font-semibold whitespace-nowrap"
                    >
                      Ver <i className="fas fa-chevron-right text-xs ml-1" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}
