"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { EstadoOTBadge } from "@/components/UI";

const COLUMNAS = [
  { estado: "nueva", label: "Nueva" },
  { estado: "asignada", label: "Asignada" },
  { estado: "en_progreso", label: "En progreso" },
  { estado: "verificar", label: "Verificar" },
];

const SIGUIENTE = {
  nueva: "asignada",
  asignada: "en_progreso",
  en_progreso: "verificar",
  verificar: "cerrada",
};

const SIGUIENTE_LABEL = {
  nueva: "Asignar",
  asignada: "Iniciar",
  en_progreso: "Enviar a verificar",
  verificar: "Cerrar orden",
};

export default function OrdenesKanban({
  initialOrdenes,
  equipos,
  userId,
  nombreUsuario,
}) {
  const supabase = createClient();
  const [ordenes, setOrdenes] = useState(initialOrdenes);
  const [showForm, setShowForm] = useState(false);

  // --- Formulario nueva orden ---
  const [titulo, setTitulo] = useState("");
  const [equipoId, setEquipoId] = useState(equipos[0]?.id || "");
  const [descripcion, setDescripcion] = useState("");
  const [asignado, setAsignado] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // --- Suscripción en tiempo real ---
  useEffect(() => {
    const channel = supabase
      .channel("ordenes_trabajo_control")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ordenes_trabajo" },
        (payload) => {
          setOrdenes((prev) => {
            if (payload.eventType === "DELETE") {
              return prev.filter((o) => o.id !== payload.old.id);
            }
            const row = payload.new;
            if (row.estado === "cerrada") {
              return prev.filter((o) => o.id !== row.id);
            }
            const exists = prev.some((o) => o.id === row.id);
            if (exists) {
              return prev.map((o) =>
                o.id === row.id ? { ...o, ...row } : o
              );
            }
            return [row, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function avanzar(orden) {
    const nuevoEstado = SIGUIENTE[orden.estado];
    if (!nuevoEstado) return;

    setOrdenes((prev) =>
      nuevoEstado === "cerrada"
        ? prev.filter((o) => o.id !== orden.id)
        : prev.map((o) =>
            o.id === orden.id ? { ...o, estado: nuevoEstado } : o
          )
    );

    await supabase
      .from("ordenes_trabajo")
      .update({ estado: nuevoEstado })
      .eq("id", orden.id);
  }

  async function handleCrear(e) {
    e.preventDefault();
    setError("");

    if (!titulo.trim()) {
      setError("Ingresa un título para la orden.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("ordenes_trabajo")
      .insert({
        titulo: titulo.trim(),
        equipo_id: equipoId || null,
        descripcion: descripcion.trim(),
        asignado_nombre: asignado.trim() || null,
        estado: asignado.trim() ? "asignada" : "nueva",
        creado_por: userId,
        creado_por_nombre: nombreUsuario,
      })
      .select("id, codigo, titulo, descripcion, estado, asignado_nombre, created_at, equipos(numero_equipo, tipo, modelo)")
      .single();

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setOrdenes((prev) => [data, ...prev]);
    setTitulo("");
    setDescripcion("");
    setAsignado("");
    setShowForm(false);
  }

  return (
    <div className="bg-panel border border-border rounded-xl2 p-5 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold flex items-center gap-2">
          <i className="fas fa-diagram-project text-accent" />
          Flujo de Órdenes de Trabajo
        </h3>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-sm bg-accent text-white font-semibold rounded-xl px-4 py-2 flex items-center gap-2"
        >
          <i className="fas fa-plus" />
          Nueva orden
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCrear}
          className="bg-bg border border-border rounded-xl2 p-4 mb-5 space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label>Título</label>
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej: Cambio de filtros hidráulicos"
                required
              />
            </div>
            <div>
              <label>Equipo</label>
              <select
                value={equipoId}
                onChange={(e) => setEquipoId(e.target.value)}
              >
                <option value="">Sin equipo asociado</option>
                {equipos.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.tipo === "pala" ? "Pala" : "Perforadora"} N°{" "}
                    {eq.numero_equipo}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label>Descripción</label>
            <textarea
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Detalle del trabajo a realizar"
            />
          </div>
          <div>
            <label>Asignar a (opcional)</label>
            <input
              value={asignado}
              onChange={(e) => setAsignado(e.target.value)}
              placeholder="Nombre del técnico/mantenedor"
            />
          </div>
          {error && (
            <div className="text-sm text-bad bg-bad/10 border border-bad/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="bg-accent text-white font-semibold rounded-xl px-5 py-2.5 text-sm disabled:opacity-60"
          >
            {loading ? "Creando..." : "Crear orden"}
          </button>
        </form>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNAS.map((col) => {
          const items = ordenes.filter((o) => o.estado === col.estado);
          return (
            <div key={col.estado} className="min-w-0">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wide text-muted">
                  {col.label}
                </span>
                <span className="text-xs font-semibold bg-white/10 text-white rounded-full px-2 py-0.5">
                  {items.length}
                </span>
              </div>
              <div className="space-y-3">
                {items.length === 0 && (
                  <div className="text-xs text-muted/60 text-center py-6 border border-dashed border-border rounded-xl">
                    Sin órdenes
                  </div>
                )}
                {items.map((o) => (
                  <div
                    key={o.id}
                    className="bg-bg border border-border rounded-xl p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-accent2">
                        {o.codigo}
                      </span>
                      <EstadoOTBadge estado={o.estado} />
                    </div>
                    <div className="text-sm text-white font-semibold leading-snug">
                      {o.titulo}
                    </div>
                    {o.equipos && (
                      <div className="text-xs text-muted">
                        {o.equipos.tipo === "pala" ? "Pala" : "Perforadora"} N°{" "}
                        {o.equipos.numero_equipo}
                      </div>
                    )}
                    {o.asignado_nombre && (
                      <div className="text-xs text-muted">
                        <i className="fas fa-user mr-1" />
                        {o.asignado_nombre}
                      </div>
                    )}
                    <button
                      onClick={() => avanzar(o)}
                      className="w-full text-xs font-semibold bg-white/5 hover:bg-accent hover:text-white text-muted rounded-lg py-2 transition"
                    >
                      {SIGUIENTE_LABEL[o.estado]}{" "}
                      <i className="fas fa-arrow-right ml-1" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
