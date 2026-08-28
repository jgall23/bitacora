import { redirect } from "next/navigation";
import { getUserAndProfile } from "@/lib/supabase/server";
import { isStaff as isStaffRole } from "@/lib/roles";
import AppShell from "@/components/AppShell";
import EquiposManager from "./EquiposManager";

export const dynamic = "force-dynamic";

export default async function EquiposPage() {
  const { supabase, user, profile } = await getUserAndProfile();
  if (!user) redirect("/login");

  const isStaff = isStaffRole(profile?.rol);
  if (!isStaff) redirect("/bitacoras");

  const { data: equipos } = await supabase
    .from("equipos")
    .select("id, numero_equipo, tipo, modelo, activo")
    .order("numero_equipo");

  return (
    <AppShell profile={profile} active="/dashboard/equipos">
      <div>
        <h1 className="text-xl font-bold text-white">Equipos</h1>
        <p className="text-sm text-muted">
          Palas y perforadoras disponibles para registrar bitácoras.
        </p>
      </div>

      <EquiposManager equipos={equipos || []} />
    </AppShell>
  );
}
