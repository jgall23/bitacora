"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

const GRUPOS = ["G1", "G2", "G3", "G4"];

export default function DashboardFilters({ equipos, current }) {
  const router = useRouter();
  const pathname = usePathname();

  const [equipo, setEquipo] = useState(current.equipo || "");
  const [grupo, setGrupo] = useState(current.grupo || "");
  const [estado, setEstado] = useState(current.estado || "");
  const [fechaDesde, setFechaDesde] = useState(current.fecha_desde || "");
  const [fechaHasta, setFechaHasta] = useState(current.fecha_hasta || "");

  function aplicar() {
    const params = new URLSearchParams();
    if (equipo) params.set("equipo", equipo);
    if (grupo) params.set("grupo", grupo);
    if (estado) params.set("estado", estado);
    if (fechaDesde) params.set("fecha_desde", fechaDesde);
    if (fechaHasta) params.set("fecha_hasta", fechaHasta);
    router.push(`${pathname}?${params.toString()}`);
  }

  function limpiar() {
    setEquipo("");
    setGrupo("");
    setEstado("");
    setFechaDesde("");
    setFechaHasta("");
    router.push(pathname);
  }

  return (
    <div className="bg-panel border border-border rounded-xl2 p-5 md:p-6">
      <h3 className="text-white font-bold mb-4 flex items-center gap-2">
        <i className="fas fa-filter text-accent" />
        Filtros
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div>
          <label>Equipo</label>
          <select value={equipo} onChange={(e) => setEquipo(e.target.value)}>
            <option value="">Todos</option>
            {equipos.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.tipo === "pala" ? "Pala" : "Perf."} N° {eq.numero_equipo}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Grupo</label>
          <select value={grupo} onChange={(e) => setGrupo(e.target.value)}>
            <option value="">Todos</option>
            {GRUPOS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Estado</label>
          <select value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="en_proceso">En proceso</option>
            <option value="finalizada">Finalizada</option>
          </select>
        </div>
        <div>
          <label>Desde</label>
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
          />
        </div>
        <div>
          <label>Hasta</label>
          <input
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
          />
        </div>
      </div>
      <div className="flex gap-3 mt-4">
        <button
          onClick={aplicar}
          className="bg-accent text-white text-sm font-semibold rounded-xl px-5 py-2.5"
        >
          Aplicar filtros
        </button>
        <button
          onClick={limpiar}
          className="text-muted text-sm font-semibold rounded-xl px-5 py-2.5 border border-border"
        >
          Limpiar
        </button>
      </div>
    </div>
  );
}
