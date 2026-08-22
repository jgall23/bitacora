import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserAndProfile } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import { EstadoBadge, GrupoBadge, ChecklistBadge } from "@/components/UI";

export const dynamic = "force-dynamic";

export default async function BitacorasPage() {
  const { supabase, user, profile } = await getUserAndProfile();
  if (!user) redirect("/login");

  const isStaff = profile?.rol === "mantenedor" || profile?.rol === "admin";

  let query = supabase
    .from("bitacoras")
    .select("id, fecha, grupo, estado, checklist_despacho, observaciones_operador, equipos(numero_equipo, tipo, modelo)")
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false });

  if (!isStaff) {
    query = query.eq("operador_id", user.id);
  }

  const { data: bitacoras, error } = await query.limit(100);

  return (
    <AppShell profile={profile} active="/bitacoras">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Mis bitácoras</h1>
          <p className="text-sm text-muted">
            Bitácoras registradas para tu equipo mina.
          </p>
        </div>
        <Link
          href="/bitacoras/nueva"
          className="bg-accent text-white font-semibold rounded-xl px-5 py-3 text-sm flex items-center gap-2"
        >
          <i className="fas fa-plus" />
          Nueva bitácora
        </Link>
      </div>

      {error && (
        <div className="bg-bad/10 border border-bad/30 text-bad text-sm rounded-xl p-4">
          Error al cargar bitácoras: {error.message}
        </div>
      )}

      <div className="bg-panel border border-border rounded-xl2 p-5 md:p-6 overflow-x-auto">
        {(!bitacoras || bitacoras.length === 0) && (
          <p className="text-muted text-sm py-8 text-center">
            Aún no tienes bitácoras registradas.
          </p>
        )}

        {bitacoras && bitacoras.length > 0 && (
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-muted border-b border-border">
                <th className="pb-3 font-medium">Equipo</th>
                <th className="pb-3 font-medium">Fecha</th>
                <th className="pb-3 font-medium">Grupo</th>
                <th className="pb-3 font-medium">Check list</th>
                <th className="pb-3 font-medium">Estado</th>
                <th className="pb-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {bitacoras.map((b) => (
                <tr key={b.id} className="border-b border-border/60 last:border-0">
                  <td className="py-3 text-white font-semibold">
                    {b.equipos?.tipo === "pala" ? "Pala" : "Perforadora"}{" "}
                    {b.equipos?.modelo} · N° {b.equipos?.numero_equipo}
                  </td>
                  <td className="py-3 text-white">
                    {new Date(b.fecha + "T00:00:00").toLocaleDateString("es-CL")}
                  </td>
                  <td className="py-3">
                    <GrupoBadge grupo={b.grupo} />
                  </td>
                  <td className="py-3">
                    <ChecklistBadge ok={b.checklist_despacho} />
                  </td>
                  <td className="py-3">
                    <EstadoBadge estado={b.estado} />
                  </td>
                  <td className="py-3 text-right">
                    <Link
                      href={`/bitacoras/${b.id}`}
                      className="text-accent text-sm font-semibold"
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
