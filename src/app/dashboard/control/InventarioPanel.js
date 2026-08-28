"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { EstadoCompraBadge } from "@/components/UI";

const SIGUIENTE = {
  disponible: "solicitado",
  solicitado: "en_compra",
  en_compra: "comprado",
  comprado: "disponible",
};

const SIGUIENTE_LABEL = {
  disponible: "Solicitar",
  solicitado: "Marcar en compra",
  en_compra: "Marcar comprado",
  comprado: "Marcar disponible",
};

export default function InventarioPanel({ initialRepuestos }) {
  const supabase = createClient();
  const [repuestos, setRepuestos] = useState(initialRepuestos);
  const [showForm, setShowForm] = useState(false);

  const [nombre, setNombre] = useState("");
  const [stockActual, setStockActual] = useState(0);
  const [stockMinimo, setStockMinimo] = useState(1);
  const [unidad, setUnidad] = useState("unidades");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel("repuestos_control")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "repuestos" },
        (payload) => {
          setRepuestos((prev) => {
            if (payload.eventType === "DELETE") {
              return prev.filter((r) => r.id !== payload.old.id);
            }
            const row = payload.new;
            const exists = prev.some((r) => r.id === row.id);
            if (exists) {
              return prev
                .map((r) => (r.id === row.id ? { ...r, ...row } : r))
                .sort((a, b) => a.nombre.localeCompare(b.nombre));
            }
            return [...prev, row].sort((a, b) =>
              a.nombre.localeCompare(b.nombre)
            );
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function avanzar(r) {
    const nuevoEstado = SIGUIENTE[r.estado_compra];
    setRepuestos((prev) =>
      prev.map((x) =>
        x.id === r.id ? { ...x, estado_compra: nuevoEstado } : x
      )
    );
    await supabase
      .from("repuestos")
      .update({ estado_compra: nuevoEstado })
      .eq("id", r.id);
  }

  async function actualizarFecha(r, fecha) {
    setRepuestos((prev) =>
      prev.map((x) =>
        x.id === r.id ? { ...x, fecha_estimada_llegada: fecha } : x
      )
    );
    await supabase
      .from("repuestos")
      .update({ fecha_estimada_llegada: fecha || null })
      .eq("id", r.id);
  }

  async function handleCrear(e) {
    e.preventDefault();
    setError("");

    if (!nombre.trim()) {
      setError("Ingresa el nombre del repuesto.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("repuestos")
      .insert({
        nombre: nombre.trim(),
        stock_actual: Number(stockActual) || 0,
        stock_minimo: Number(stockMinimo) || 0,
        unidad: unidad.trim() || "unidades",
      })
      .select("*")
      .single();

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setRepuestos((prev) =>
      [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre))
    );
    setNombre("");
    setStockActual(0);
    setStockMinimo(1);
    setShowForm(false);
  }

  return (
    <div className="bg-panel border border-border rounded-xl2 p-5 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold flex items-center gap-2">
          <i className="fas fa-boxes-stacked text-accent" />
          Inventario y Repuestos
        </h3>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-muted hover:text-white text-sm"
          title="Agregar repuesto"
        >
          <i className="fas fa-plus" />
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCrear}
          className="bg-bg border border-border rounded-xl2 p-4 space-y-3"
        >
          <div>
            <label>Nombre</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Bearing Sets (H-Series)"
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label>Stock actual</label>
              <input
                type="number"
                min={0}
                value={stockActual}
                onChange={(e) => setStockActual(e.target.value)}
              />
            </div>
            <div>
              <label>Stock mínimo</label>
              <input
                type="number"
                min={0}
                value={stockMinimo}
                onChange={(e) => setStockMinimo(e.target.value)}
              />
            </div>
            <div>
              <label>Unidad</label>
              <input
                value={unidad}
                onChange={(e) => setUnidad(e.target.value)}
                placeholder="unidades"
              />
            </div>
          </div>
          {error && (
            <div className="text-sm text-bad bg-bad/10 border border-bad/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-white font-semibold rounded-xl px-4 py-2.5 text-sm disabled:opacity-60"
          >
            {loading ? "Agregando..." : "Agregar repuesto"}
          </button>
        </form>
      )}

      <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
        {repuestos.length === 0 && (
          <p className="text-muted text-sm text-center py-6">
            Sin repuestos registrados.
          </p>
        )}

        {repuestos.map((r) => {
          const bajoStock = r.stock_actual < r.stock_minimo;
          return (
            <div
              key={r.id}
              className={
                "border rounded-xl p-3 space-y-2 " +
                (bajoStock
                  ? "bg-bad/10 border-bad/40"
                  : "bg-bg border-border")
              }
            >
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm text-white font-semibold leading-snug">
                  {r.nombre}
                </div>
                <EstadoCompraBadge estado={r.estado_compra} />
              </div>

              <div className="text-xs text-muted flex items-center gap-1.5">
                {bajoStock && (
                  <i className="fas fa-triangle-exclamation text-bad" />
                )}
                <span className={bajoStock ? "text-bad font-semibold" : ""}>
                  {r.stock_actual} {r.unidad} en stock
                </span>
                <span>· mínimo {r.stock_minimo}</span>
              </div>

              {r.estado_compra !== "disponible" && (
                <div className="flex items-center gap-2">
                  <label className="!mb-0 text-xs shrink-0">Llegada:</label>
                  <input
                    type="date"
                    value={r.fecha_estimada_llegada || ""}
                    onChange={(e) => actualizarFecha(r, e.target.value)}
                    className="!py-1 text-xs"
                  />
                </div>
              )}

              <button
                onClick={() => avanzar(r)}
                className="w-full text-xs font-semibold bg-white/5 hover:bg-accent hover:text-white text-muted rounded-lg py-2 transition"
              >
                {SIGUIENTE_LABEL[r.estado_compra]}{" "}
                <i className="fas fa-arrow-right ml-1" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
