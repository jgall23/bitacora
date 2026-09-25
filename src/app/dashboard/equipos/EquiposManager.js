"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function EquiposManager({ equipos }) {
  const router = useRouter();
  const supabase = createClient();

  const [numero, setNumero] = useState("");
  const [tipo, setTipo] = useState("pala");
  const [modelo, setModelo] = useState("PC5500");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAdd(e) {
    e.preventDefault();
    setError("");

    if (!numero.trim()) {
      setError("Ingresa el N° de equipo.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("equipos").insert({
      numero_equipo: numero.trim(),
      tipo,
      modelo: modelo.trim() || "PC5500",
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setNumero("");
    router.refresh();
  }

  async function toggleActivo(id, activo) {
    await supabase.from("equipos").update({ activo: !activo }).eq("id", id);
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5">
      <form
        onSubmit={handleAdd}
        className="bg-panel border border-border rounded-xl2 p-5 md:p-6 space-y-4 h-fit"
      >
        <h3 className="text-white font-bold">Agregar equipo</h3>

        <div>
          <label>N° de equipo</label>
          <input
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="Ej: 000014"
            required
          />
        </div>
        <div>
          <label>Tipo</label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="pala">Pala</option>
            <option value="perforadora">Perforadora</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        <div>
          <label>Modelo</label>
          <input value={modelo} onChange={(e) => setModelo(e.target.value)} />
        </div>

        {error && (
          <div role="alert" className="text-sm text-bad bg-bad/10 border border-bad/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-accent text-white font-semibold rounded-xl px-5 py-3 text-sm w-full disabled:opacity-60"
        >
          {loading ? "Agregando..." : "Agregar equipo"}
        </button>
      </form>

      <div className="bg-panel border border-border rounded-xl2 p-5 md:p-6 overflow-x-auto">
        <h3 className="text-white font-bold mb-4">Listado de equipos</h3>
        <table className="w-full text-sm min-w-[480px]">
          <thead>
            <tr className="text-left text-muted border-b border-border">
              <th className="pb-3 font-medium">N° equipo</th>
              <th className="pb-3 font-medium">Tipo</th>
              <th className="pb-3 font-medium">Modelo</th>
              <th className="pb-3 font-medium">Estado</th>
              <th className="pb-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {equipos.map((eq) => (
              <tr key={eq.id} className="border-b border-border/60 last:border-0">
                <td className="py-3 text-white font-semibold">
                  {eq.numero_equipo}
                </td>
                <td className="py-3 text-white capitalize">{eq.tipo}</td>
                <td className="py-3 text-white">{eq.modelo}</td>
                <td className="py-3">
                  <span
                    className={
                      "text-xs font-semibold px-2.5 py-1 rounded-full " +
                      (eq.activo
                        ? "bg-good/15 text-good"
                        : "bg-white/10 text-muted")
                    }
                  >
                    {eq.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="py-3 text-right">
                  <button
                    onClick={() => toggleActivo(eq.id, eq.activo)}
                    className="text-accent text-sm font-semibold"
                  >
                    {eq.activo ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
            {equipos.length === 0 && (
              <tr>
                <td colSpan={5} className="text-muted text-center py-8">
                  No hay equipos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
