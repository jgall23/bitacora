import { redirect } from "next/navigation";
import { getUserAndProfile } from "@/lib/supabase/server";
import { isSupervisor as isSupervisorRole } from "@/lib/roles";
import AppShell from "@/components/AppShell";
import OrdenesKanban from "./OrdenesKanban";
import InventarioPanel from "./InventarioPanel";

export const dynamic = "force-dynamic";

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

  const { data: ordenes } = await supabase
    .from("ordenes_trabajo")
    .select(
      "id, codigo, titulo, descripcion, estado, asignado_nombre, created_at, equipos(numero_equipo, tipo, modelo)"
    )
    .neq("estado", "cerrada")
    .order("created_at", { ascending: false });

  const { data: repuestos } = await supabase
    .from("repuestos")
    .select("*")
    .order("nombre");

  return (
    <AppShell profile={profile} active="/dashboard/control">
      <div>
        <h1 className="text-xl font-bold text-white">Centro de Control</h1>
        <p className="text-sm text-muted">
          Flujo de órdenes de trabajo e inventario de repuestos en tiempo
          real · Supervisor / Jefe de Turno
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5 items-start">
        <OrdenesKanban
          initialOrdenes={ordenes || []}
          equipos={equipos || []}
          userId={user.id}
          nombreUsuario={profile?.nombre_completo || user.email}
        />
        <InventarioPanel initialRepuestos={repuestos || []} />
      </div>
    </AppShell>
  );
}
