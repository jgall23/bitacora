"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DirectrizForm({ bitacoraId, supervisorNombre, initialText }) {
  const router = useRouter();
  const supabase = createClient();

  const [texto, setTexto] = useState(initialText || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase
      .from("bitacoras")
      .update({
        directrices_supervisor: texto,
        supervisor_nombre: supervisorNombre,
        directrices_at: new Date().toISOString(),
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
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        rows={4}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Ej: Priorizar esta bitácora, coordinar con bodega el repuesto X antes del próximo turno..."
      />
      {error && (
        <div role="alert" className="text-sm text-bad bg-bad/10 border border-bad/30 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="bg-accent text-white font-semibold rounded-xl px-5 py-2.5 text-sm disabled:opacity-60"
      >
        {loading ? "Guardando..." : "Guardar directriz"}
      </button>
    </form>
  );
}
