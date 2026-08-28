export default function AnaliticaPanel({ cerradasPorDia, promedioHoras, totalCerradas30d, otActivas }) {
  const max = Math.max(1, ...cerradasPorDia.map((d) => d.count));

  return (
    <div className="bg-panel border border-border rounded-xl2 p-5 md:p-6">
      <h3 className="text-white font-bold mb-1 flex items-center gap-2">
        <i className="fas fa-chart-column text-accent" />
        Analítica de Mantenimiento
      </h3>
      <p className="text-xs text-muted mb-5">
        Órdenes de trabajo cerradas · últimos 7 días
      </p>

      <div className="flex items-end justify-between gap-2 h-32 mb-2">
        {cerradasPorDia.map((d) => (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex items-end justify-center h-24">
              <div
                className="w-6 rounded-t-md bg-gradient-to-t from-good to-emerald-400"
                style={{ height: `${Math.max(6, (d.count / max) * 100)}%` }}
                title={`${d.count} cerradas`}
              />
            </div>
            <span className="text-[10px] text-muted uppercase">{d.label}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-border pt-4 mt-2 space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">OT activas ahora</span>
          <strong className="text-white">{otActivas}</strong>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Cerradas (últimos 30 días)</span>
          <strong className="text-white">{totalCerradas30d}</strong>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Tiempo prom. de resolución</span>
          <strong className="text-good">
            {promedioHoras != null ? `${promedioHoras} h` : "Sin datos aún"}
          </strong>
        </div>
      </div>
    </div>
  );
}
