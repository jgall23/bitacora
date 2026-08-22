"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const GRUPOS = ["G1", "G2", "G3", "G4"];

export default function NuevaBitacoraForm({ equipos, userId, nombreOperador }) {
  const router = useRouter();
  const supabase = createClient();

  const [equipoId, setEquipoId] = useState(equipos[0]?.id || "");
  const [fecha, setFecha] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [grupo, setGrupo] = useState("G1");
  const [checklist, setChecklist] = useState(false);
  const [observaciones, setObservaciones] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!equipoId) {
      setError("Selecciona un equipo.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("bitacoras")
      .insert({
        equipo_id: equipoId,
        operador_id: userId,
        operador_nombre: nombreOperador,
        fecha,
        grupo,
        checklist_despacho: checklist,
        observaciones_operador: observaciones,
      })
      .select("id")
      .single();

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push(`/bitacoras/${data.id}`);
    router.refresh();
  }

  if (equipos.length === 0) {
    return (
      <div className="bg-panel border border-border rounded-xl2 p-6 text-muted text-sm">
        No hay equipos registrados aún. Pide a un mantenedor que agregue el
        equipo en la sección Equipos del dashboard.
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-panel border border-border rounded-xl2 p-5 md:p-6 space-y-5 max-w-2xl"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label>Equipo</label>
          <select value={equipoId} onChange={(e) => setEquipoId(e.target.value)}>
            {equipos.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.tipo === "pala" ? "Pala" : "Perforadora"} {eq.modelo} · N°{" "}
                {eq.numero_equipo}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Grupo (turno)</label>
          <select value={grupo} onChange={(e) => setGrupo(e.target.value)}>
            {GRUPOS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label>Fecha</label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          required
        />
      </div>

      <div>
        <label>Operador</label>
        <input value={nombreOperador} disabled className="opacity-70" />
      </div>

      <label className="flex items-center gap-3 !mb-0 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={checklist}
          onChange={(e) => setChecklist(e.target.checked)}
          className="w-5 h-5 accent-orange-500 !p-0"
          style={{ width: 20, height: 20 }}
        />
        <span className="text-sm text-white font-medium">
          Realicé Check List de Despacho
        </span>
      </label>

      <div>
        <label>Observaciones del operador</label>
        <textarea
          rows={6}
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          placeholder="Ej: Fuga de aceite cilindro boom, desplazamiento riel de estopa..."
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
        className="bg-accent text-white font-semibold rounded-xl px-6 py-3 text-sm disabled:opacity-60"
      >
        {loading ? "Guardando..." : "Guardar bitácora"}
      </button>
    </form>
  );
}
