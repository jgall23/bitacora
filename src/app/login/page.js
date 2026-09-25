"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
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
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4">
      {/* Círculos decorativos */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-accent/20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-24 w-96 h-96 rounded-full bg-accent2/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/4 w-80 h-80 rounded-full bg-good/10 blur-3xl" />

      <div className="relative w-full max-w-md bg-panel border border-border rounded-xl3 p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0 overflow-hidden p-1">
            <Image
              src="/logo-capstone.png"
              alt="Capstone Copper"
              width={32}
              height={32}
              className="object-contain w-full h-full"
            />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-accent font-semibold">
              Capstone Copper · Mantoverde
            </div>
            <div className="text-sm text-muted">Bitácoras Pala y Perforadora</div>
          </div>
        </div>

        <div className="mt-6 mb-6">
          <h1 className="text-2xl font-bold text-white">Bienvenido</h1>
          <p className="text-sm text-muted mt-1">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email">Usuario o correo</label>
            <div className="relative">
              <i className="fas fa-user absolute left-3.5 top-1/2 -translate-y-1/2 text-muted text-sm" />
              <input
                id="email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@mantoverde.cl"
                className="!pl-10"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password">Contraseña</label>
            <div className="relative">
              <i className="fas fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-muted text-sm" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                aria-describedby={error ? "login-error" : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="!pl-10 !pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted hover:text-white text-sm w-8 h-8 flex items-center justify-center rounded-lg"
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 !mb-0 cursor-pointer select-none text-muted">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                style={{ width: 16, height: 16 }}
                className="accent-orange-500 !p-0"
              />
              <span>Recordarme</span>
            </label>
            <span className="text-muted/60 cursor-not-allowed" title="Próximamente">
              ¿Olvidaste tu contraseña?
            </span>
          </div>

          {error && (
            <div
              id="login-error"
              role="alert"
              className="text-sm text-bad bg-bad/10 border border-bad/30 rounded-lg px-3 py-2"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:opacity-90 transition text-white font-semibold rounded-xl py-3 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && (
              <i className="fas fa-circle-notch animate-spin" aria-hidden="true" />
            )}
            {loading ? "Ingresando..." : "Iniciar sesión"}
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
