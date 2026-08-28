const ESTADO_LABEL = {
  asignada: "Asignada",
  en_progreso: "En progreso",
  verificar: "Por verificar",
};

const ESTADO_COLOR = {
  asignada: "text-accent2",
  en_progreso: "text-blue-400",
  verificar: "text-purple-300",
};

function iniciales(nombre) {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function TecnicosActivos({ tecnicos }) {
  if (!tecnicos || tecnicos.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {tecnicos.map((t) => (
        <div
          key={t.asignado_nombre}
          className="bg-panel border border-border rounded-xl2 p-5 flex gap-4"
        >
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-white to-slate-400 text-bg font-extrabold flex items-center justify-center text-lg shrink-0">
            {iniciales(t.asignado_nombre)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="text-white font-bold truncate">
                {t.asignado_nombre}
              </div>
              <span
                className={`text-xs font-bold shrink-0 ${
                  ESTADO_COLOR[t.estado] || "text-muted"
                }`}
              >
                {ESTADO_LABEL[t.estado] || t.estado}
              </span>
            </div>
            <div className="text-xs text-muted mt-1 mb-2">
              {t.codigo}
              {t.equipos &&
                ` · ${t.equipos.tipo === "pala" ? "Pala" : "Perforadora"} N° ${
                  t.equipos.numero_equipo
                }`}
            </div>
            <div className="text-sm text-white/90 leading-snug line-clamp-2">
              {t.titulo}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
