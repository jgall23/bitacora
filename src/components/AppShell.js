import Link from "next/link";
import LogoutButton from "./LogoutButton";

const NAV = {
  operador: [
    { href: "/bitacoras", icon: "fa-book", label: "Mis bitácoras" },
    { href: "/bitacoras/nueva", icon: "fa-plus", label: "Nueva bitácora" },
  ],
  staff: [
    { href: "/dashboard", icon: "fa-gauge-high", label: "Dashboard" },
    { href: "/dashboard/equipos", icon: "fa-truck-monster", label: "Equipos" },
  ],
};

export default function AppShell({ profile, active, children }) {
  const isStaff = profile?.rol === "mantenedor" || profile?.rol === "admin";
  const items = isStaff ? NAV.staff : NAV.operador;

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-[260px_1fr] gap-5">
        {/* SIDEBAR */}
        <aside className="bg-panel border border-border rounded-xl3 p-5 md:p-6 flex md:flex-col gap-4 md:gap-8 items-center md:items-stretch">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center font-bold text-white shrink-0">
              CC
            </div>
            <div className="hidden md:block">
              <div className="text-[11px] uppercase tracking-wide text-accent font-semibold">
                Capstone Copper
              </div>
              <div className="text-xs text-muted">Mantoverde · Bitácoras</div>
            </div>
          </div>

          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible flex-1">
            {items.map((item) => {
              const isActive = active === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium whitespace-nowrap transition " +
                    (isActive
                      ? "bg-accent text-white"
                      : "text-muted hover:bg-white/5")
                  }
                >
                  <i className={`fas ${item.icon} w-5 text-center`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

        </aside>

        {/* MAIN */}
        <main className="flex flex-col gap-5 min-w-0">
          {/* TOPBAR: saludo al usuario logeado + cerrar sesión (visible en todo tamaño) */}
          <div className="flex items-center justify-between gap-3 bg-panel border border-border rounded-xl2 px-5 py-3.5">
            <div className="min-w-0">
              <div className="text-white font-semibold text-sm truncate">
                Hola, {profile?.nombre_completo || "usuario"}
              </div>
              <div className="text-xs text-muted capitalize">
                {profile?.rol === "mantenedor"
                  ? "Mantenedor / Jefe mantención"
                  : profile?.rol === "admin"
                  ? "Administrador"
                  : "Operador equipo mina"}
              </div>
            </div>
            <LogoutButton />
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
