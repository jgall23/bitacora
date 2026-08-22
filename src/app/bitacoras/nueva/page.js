import { redirect } from "next/navigation";
import { getUserAndProfile } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import NuevaBitacoraForm from "./NuevaBitacoraForm";

export const dynamic = "force-dynamic";

export default async function NuevaBitacoraPage() {
  const { supabase, user, profile } = await getUserAndProfile();
  if (!user) redirect("/login");

  const { data: equipos } = await supabase
    .from("equipos")
    .select("id, numero_equipo, tipo, modelo")
    .eq("activo", true)
    .order("numero_equipo");

  return (
    <AppShell profile={profile} active="/bitacoras/nueva">
      <div>
        <h1 className="text-xl font-bold text-white">Nueva bitácora</h1>
        <p className="text-sm text-muted">
          Registra las observaciones del turno para el equipo mina.
        </p>
      </div>

      <NuevaBitacoraForm
        equipos={equipos || []}
        userId={user.id}
        nombreOperador={profile?.nombre_completo || user.email}
      />
    </AppShell>
  );
}
