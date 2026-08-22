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
    revisada: "bg-good/15 text-good",
  };
  const labelMap = {
    pendiente: "Pendiente revisión",
    revisada: "Revisada",
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
