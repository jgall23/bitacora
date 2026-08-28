export function StatCard({ icon, label, value, trend, trendType = "good" }) {
  const trendClass =
    trendType === "danger"
      ? "bg-bad/15 text-bad"
      : trendType === "warning"
      ? "bg-accent2/15 text-accent2"
      : "bg-good/15 text-good";

  return (
    <div className="bg-panel border border-border rounded-xl2 p-5">
      <div className="flex items-center gap-2 text-muted text-sm font-medium mb-2">
        <i className={`fas ${icon}`} />
        {label}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-2xl font-bold text-white">{value}</span>
        {trend && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${trendClass}`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

export function EstadoBadge({ estado }) {
  const map = {
    pendiente: "bg-accent2/15 text-accent2",
    en_proceso: "bg-blue-500/15 text-blue-400",
    revisada: "bg-good/15 text-good", // compatibilidad con datos antiguos
    finalizada: "bg-good/15 text-good",
  };
  const labelMap = {
    pendiente: "Pendiente",
    en_proceso: "En proceso",
    revisada: "Finalizada",
    finalizada: "Finalizada",
  };
  return (
    <span
      className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap ${
        map[estado] || "bg-white/10 text-muted"
      }`}
    >
      {labelMap[estado] || estado}
    </span>
  );
}

export function EstadoOTBadge({ estado }) {
  const map = {
    nueva: "bg-white/10 text-white",
    asignada: "bg-accent2/15 text-accent2",
    en_progreso: "bg-blue-500/15 text-blue-400",
    verificar: "bg-purple-500/15 text-purple-300",
    cerrada: "bg-good/15 text-good",
  };
  const labelMap = {
    nueva: "Nueva",
    asignada: "Asignada",
    en_progreso: "En progreso",
    verificar: "Verificar",
    cerrada: "Cerrada",
  };
  return (
    <span
      className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
        map[estado] || "bg-white/10 text-muted"
      }`}
    >
      {labelMap[estado] || estado}
    </span>
  );
}

export function EstadoCompraBadge({ estado }) {
  const map = {
    disponible: "bg-good/15 text-good",
    solicitado: "bg-accent2/15 text-accent2",
    en_compra: "bg-blue-500/15 text-blue-400",
    comprado: "bg-good/15 text-good",
  };
  const labelMap = {
    disponible: "Disponible",
    solicitado: "Solicitado",
    en_compra: "En compra",
    comprado: "Comprado",
  };
  return (
    <span
      className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
        map[estado] || "bg-white/10 text-muted"
      }`}
    >
      {labelMap[estado] || estado}
    </span>
  );
}

export function GrupoBadge({ grupo }) {
  if (!grupo) return <span className="text-muted text-sm">—</span>;
  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/5 text-white border border-border">
      {grupo}
    </span>
  );
}

export function ChecklistBadge({ ok }) {
  return ok ? (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-good/15 text-good">
      <i className="fas fa-check mr-1" />
      Realizado
    </span>
  ) : (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-bad/15 text-bad">
      <i className="fas fa-xmark mr-1" />
      No realizado
    </span>
  );
}
