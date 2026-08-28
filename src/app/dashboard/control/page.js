import { redirect } from "next/navigation";
import { getUserAndProfile } from "@/lib/supabase/server";
import { isSupervisor as isSupervisorRole } from "@/lib/roles";
import AppShell from "@/components/AppShell";
import OrdenesKanban from "./OrdenesKanban";
import TecnicosActivos from "./TecnicosActivos";
import AnaliticaPanel from "./AnaliticaPanel";

export const dynamic = "force-dynamic";

function ultimosNDias(n) {
  const dias = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    dias.push(d);
  }
  return dias;
}

export default async function ControlPage() {
  const { supabase, user, profile } = await getUserAndProfile();
  if (!user) redirect("/login");

  const isSupervisor = isSupervisorRole(profile?.rol);
  if (!isSupervisor) redirect("/dashboard");

  const { data: equipos } = await supabase
    .from("equipos")
    .select("id, numero_equipo, tipo, modelo")
    .eq("activo", true)
    .order("numero_equipo");

  const { data: usuarios } = await supabase
    .from("profiles")
    .select("id, nombre_completo, rol")
    .in("rol", ["operador", "mantenedor"])
    .order("nombre_completo");

  const { data: ordenes } = await supabase
    .from("ordenes_trabajo")
    .select(
      "id, codigo, titulo, descripcion, estado, asignado_nombre, created_at, equipos(numero_equipo, tipo, modelo)"
    )
    .neq("estado", "cerrada")
    .order("created_at", { ascending: false });

  // --- Técnicos activos: última orden asignada/en curso por persona ---
  const activasAsignadas = (ordenes || []).filter(
    (o) => o.asignado_nombre && (o.estado === "asignada" || o.estado === "en_progreso" || o.estado === "verificar")
  );
  const tecnicosMap = new Map();
  for (const o of activasAsignadas) {
    if (!tecnicosMap.has(o.asignado_nombre)) {
      tecnicosMap.set(o.asignado_nombre, o);
    }
  }
  const tecnicos = Array.from(tecnicosMap.values());

  // --- Analítica: OT cerradas últimos 30 días (para promedio y total) ---
  const hace30dias = new Date();
  hace30dias.setDate(hace30dias.getDate() - 30);

  const { data: cerradas30d } = await supabase
    .from("ordenes_trabajo")
    .select("created_at, updated_at")
    .eq("estado", "cerrada")
    .gte("updated_at", hace30dias.toISOString());

  let promedioHoras = null;
  if (cerradas30d && cerradas30d.length > 0) {
    const totalHoras = cerradas30d.reduce((sum, o) => {
      const horas =
        (new Date(o.updated_at) - new Date(o.created_at)) / (1000 * 60 * 60);
      return sum + horas;
    }, 0);
    promedioHoras = Math.round((totalHoras / cerradas30d.length) * 10) / 10;
  }

  // --- Analítica: OT cerradas por día, últimos 7 días ---
  const dias = ultimosNDias(7);
  const cerradasPorDia = dias.map((d) => {
    const diaStr = d.toISOString().slice(0, 10);
    const count = (cerradas30d || []).filter(
      (o) => o.updated_at.slice(0, 10) === diaStr
    ).length;
    return {
      label: d.toLocaleDateString("es-CL", { weekday: "short" }).replace(".", ""),
      count,
    };
  });

  const { count: otActivasCount } = await supabase
    .from("ordenes_trabajo")
    .select("id", { count: "exact", head: true })
    .neq("estado", "cerrada");

  return (
    <AppShell profile={profile} active="/dashboard/control">
      <div>
        <h1 className="text-xl font-bold text-white">Centro de Control</h1>
        <p className="text-sm text-muted">
          Flujo de órdenes de trabajo y analítica de mantenimiento ·
          Supervisor / Jefe de Turno
        </p>
      </div>

      {tecnicos.length > 0 && (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted mb-3">
            Técnicos en terreno
          </h2>
          <TecnicosActivos tecnicos={tecnicos} />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5 items-start">
        <OrdenesKanban
          initialOrdenes={ordenes || []}
          equipos={equipos || []}
          usuarios={usuarios || []}
          userId={user.id}
          nombreUsuario={profile?.nombre_completo || user.email}
        />
        <AnaliticaPanel
          cerradasPorDia={cerradasPorDia}
          promedioHoras={promedioHoras}
          totalCerradas30d={cerradas30d?.length ?? 0}
          otActivas={otActivasCount ?? 0}
        />
      </div>
    </AppShell>
  );
}
