import { redirect, notFound } from "next/navigation";
import { getUserAndProfile } from "@/lib/supabase/server";
import { isStaff as isStaffRole, isSupervisor as isSupervisorRole } from "@/lib/roles";
import AppShell from "@/components/AppShell";
import { EstadoBadge, GrupoBadge, ChecklistBadge } from "@/components/UI";
import RevisionForm from "./RevisionForm";
import DirectrizForm from "./DirectrizForm";

export const dynamic = "force-dynamic";

export default async function BitacoraDetallePage({ params }) {
  const { supabase, user, profile } = await getUserAndProfile();
  if (!user) redirect("/login");

  const isStaff = isStaffRole(profile?.rol);
  const isSupervisor = isSupervisorRole(profile?.rol);

  const { data: b, error } = await supabase
    .from("bitacoras")
    .select(
      "*, equipos(numero_equipo, tipo, modelo)"
    )
    .eq("id", params.id)
    .single();

  if (error || !b) notFound();

  const finalizada = b.estado === "finalizada" || b.estado === "revisada";
  const tieneSeguimiento = !!b.mantenedor_nombre;

  return (
    <AppShell
      profile={profile}
      active={isStaff ? "/dashboard" : "/bitacoras"}
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">
            {b.equipos?.tipo === "pala" ? "Pala" : "Perforadora"}{" "}
            {b.equipos?.modelo} · N° {b.equipos?.numero_equipo}
          </h1>
          <p className="text-sm text-muted">
            Bitácora del{" "}
            {new Date(b.fecha + "T00:00:00").toLocaleDateString("es-CL")}
            {b.numero_sap && (
              <>
                {" "}
                · N° SAP <span className="text-white font-medium">{b.numero_sap}</span>
              </>
            )}
          </p>
        </div>
        <EstadoBadge estado={b.estado} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* LADO OPERADOR */}
        <div className="bg-panel border border-border rounded-xl2 p-5 md:p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-accent">
            Operador equipo mina
          </h2>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted mb-1">Operador</div>
              <div className="text-white font-medium">{b.operador_nombre}</div>
            </div>
            <div>
              <div className="text-muted mb-1">Grupo</div>
              <GrupoBadge grupo={b.grupo} />
            </div>
            <div>
              <div className="text-muted mb-1">Fecha</div>
              <div className="text-white font-medium">
                {new Date(b.fecha + "T00:00:00").toLocaleDateString("es-CL")}
              </div>
            </div>
            <div>
              <div className="text-muted mb-1">N° SAP</div>
              <div className="text-white font-medium">
                {b.numero_sap || "—"}
              </div>
            </div>
            <div className="col-span-2">
              <div className="text-muted mb-1">Check list despacho</div>
              <ChecklistBadge ok={b.checklist_despacho} />
            </div>
          </div>

          <div>
            <div className="text-muted text-sm mb-1">
              Observaciones del operador
            </div>
            <p className="text-white text-sm whitespace-pre-wrap leading-relaxed">
              {b.observaciones_operador || "Sin observaciones."}
            </p>
          </div>
        </div>

        {/* LADO MANTENEDOR */}
        <div className="bg-panel border border-border rounded-xl2 p-5 md:p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-accent">
            Mantenedor equipo mina
          </h2>

          {isStaff && !finalizada ? (
            <RevisionForm
              bitacoraId={b.id}
              mantenedorNombre={profile?.nombre_completo || user.email}
              estadoActual={b.estado}
              initial={{
                fecha_revision: b.fecha_revision,
                grupo_revision: b.grupo_revision,
                observaciones_mantenedor: b.observaciones_mantenedor,
              }}
            />
          ) : tieneSeguimiento ? (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted mb-1">Mantenedor</div>
                  <div className="text-white font-medium">
                    {b.mantenedor_nombre}
                  </div>
                </div>
                <div>
                  <div className="text-muted mb-1">Grupo</div>
                  <GrupoBadge grupo={b.grupo_revision} />
                </div>
                <div>
                  <div className="text-muted mb-1">Fecha</div>
                  <div className="text-white font-medium">
                    {b.fecha_revision
                      ? new Date(
                          b.fecha_revision + "T00:00:00"
                        ).toLocaleDateString("es-CL")
                      : "—"}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-muted text-sm mb-1">
                  Observaciones del mantenedor
                </div>
                <p className="text-white text-sm whitespace-pre-wrap leading-relaxed">
                  {b.observaciones_mantenedor}
                </p>
              </div>
            </>
          ) : (
            <p className="text-muted text-sm py-6 text-center">
              Aún no ha sido revisada por mantenimiento.
            </p>
          )}
        </div>
      </div>

      {/* SEGUIMIENTO SUPERVISOR / JEFE DE TURNO */}
      <div className="bg-panel border border-border rounded-xl2 p-5 md:p-6 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-accent flex items-center gap-2">
          <i className="fas fa-user-tie" />
          Directrices — Supervisor / Jefe de Turno
        </h2>

        {isSupervisor ? (
          <DirectrizForm
            bitacoraId={b.id}
            supervisorNombre={profile?.nombre_completo || user.email}
            initialText={b.directrices_supervisor}
          />
        ) : b.directrices_supervisor ? (
          <div>
            <p className="text-white text-sm whitespace-pre-wrap leading-relaxed mb-2">
              {b.directrices_supervisor}
            </p>
            <p className="text-xs text-muted">
              {b.supervisor_nombre}
              {b.directrices_at &&
                ` · ${new Date(b.directrices_at).toLocaleDateString("es-CL")}`}
            </p>
          </div>
        ) : (
          <p className="text-muted text-sm py-2">
            Sin directrices del supervisor por ahora.
          </p>
        )}
      </div>
    </AppShell>
  );
}
