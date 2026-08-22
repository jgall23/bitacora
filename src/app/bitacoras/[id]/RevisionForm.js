"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const GRUPOS = ["G1", "G2", "G3", "G4"];

export default function RevisionForm({ bitacoraId, mantenedorNombre }) {
  const router = useRouter();
  const supabase = createClient();

  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [grupo, setGrupo] = useState("G1");
  const [observaciones, setObservaciones] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase
      .from("bitacoras")
      .update({
        estado: "revisada",
        mantenedor_nombre: mantenedorNombre,
        fecha_revision: fecha,
        grupo_revision: grupo,
        observaciones_mantenedor: observaciones,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", bitacoraId);

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label>Fecha revisión</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Grupo</label>
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
        <label>Observaciones del mantenedor</label>
        <textarea
          rows={6}
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          placeholder="Ej: Se encontró nivel de aceite desplazado, se realizó reapriete de abrazaderas..."
          required
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
        {loading ? "Guardando..." : "Marcar como revisada"}
      </button>
    </form>
  );
}
