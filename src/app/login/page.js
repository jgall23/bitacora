"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "Correo o contraseña incorrectos."
          : error.message
      );
      return;
    }

    // Recarga dura (no router.push) para asegurar que el servidor lea el
    // perfil y rol más recientes desde Supabase, sin caché de Next.js.
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-panel border border-border rounded-xl3 p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center font-bold text-white">
            CC
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-accent font-semibold">
              Capstone Copper · Mantoverde
            </div>
            <div className="text-sm text-muted">Bitácoras Pala y Perforadora</div>
          </div>
        </div>

        <h1 className="text-xl font-bold text-white mt-6 mb-6">
          Iniciar sesión
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label>Correo</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@mantoverde.cl"
            />
          </div>
          <div>
            <label>Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-sm text-bad bg-bad/10 border border-bad/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:opacity-90 transition text-white font-semibold rounded-xl py-3 disabled:opacity-60"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p className="text-sm text-muted text-center mt-6">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="text-accent font-medium">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}