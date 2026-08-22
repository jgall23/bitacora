import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 text-center">
      <div>
        <div className="text-6xl font-extrabold text-accent mb-3">404</div>
        <p className="text-muted mb-6">No se encontró la bitácora o página solicitada.</p>
        <Link
          href="/"
          className="bg-accent text-white font-semibold rounded-xl px-5 py-3 text-sm"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
