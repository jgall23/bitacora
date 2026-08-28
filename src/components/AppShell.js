import Link from "next/link";
import Image from "next/image";
import LogoutButton from "./LogoutButton";

const NAV = {
  operador: [
    { href: "/bitacoras", icon: "fa-book", label: "Mis bitácoras" },
    { href: "/bitacoras/nueva", icon: "fa-plus", label: "Nueva bitácora" },
  ],
  mantenedor: [
    { href: "/dashboard", icon: "fa-gauge-high", label: "Dashboard" },
    { href: "/dashboard/equipos", icon: "fa-truck-monster", label: "Equipos" },
  ],
  supervisor: [
    { href: "/dashboard", icon: "fa-gauge-high", label: "Dashboard" },
    { href: "/dashboard/control", icon: "fa-diagram-project", label: "Centro de Control" },
    { href: "/dashboard/equipos", icon: "fa-truck-monster", label: "Equipos" },
  ],
  admin: [
    { href: "/dashboard", icon: "fa-gauge-high", label: "Dashboard" },
    { href: "/dashboard/control", icon: "fa-diagram-project", label: "Centro de Control" },
    { href: "/dashboard/equipos", icon: "fa-truck-monster", label: "Equipos" },
  ],
};

const ROL_LABEL = {
  operador: "Operador equipo mina",
  mantenedor: "Mantenedor / Jefe mantención",
  supervisor: "Supervisor / Jefe de Turno",
  admin: "Administrador",
};

export default function AppShell({ profile, active, children }) {
  const rol = profile?.rol || "operador";
  const items = NAV[rol] || NAV.operador;

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-[260px_1fr] gap-5">
        {/* SIDEBAR */}
        <aside className="bg-panel border border-border rounded-xl3 p-5 md:p-6 flex md:flex-col gap-4 md:gap-8 items-center md:items-stretch">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shrink-0 overflow-hidden p-1">
              <Image
                src="/logo-capstone.png"
                alt="Capstone Copper"
                width={40}
                height={40}
                className="object-contain w-full h-full"
              />
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
              <div className="text-xs text-muted">
                {ROL_LABEL[rol] || "Usuario"}
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
