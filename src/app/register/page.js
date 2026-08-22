"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("operador");
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre_completo: nombre,
          rol,
        },
      },
    });

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    // Supabase no siempre devuelve error si el correo ya existe: cuando el
    // usuario ya estaba registrado, "identities" viene vacío. En ese caso no
    // se creó nada nuevo y el rol elegido aquí nunca se guarda.
    if (data?.user && data.user.identities && data.user.identities.length === 0) {
      setLoading(false);
      setError(
        "Ese correo ya tiene una cuenta. Inicia sesión, o si el rol quedó mal pide a un administrador que lo corrija en Supabase."
      );
      return;
    }

    // Si el proyecto tiene "Confirm email" desactivado, signUp ya deja una
    // sesión activa. El trigger de la base de datos crea el perfil con el
    // rol recibido, pero por si hay alguna condición de carrera, forzamos
    // el rol explícitamente antes de continuar.
    if (data?.session && data?.user) {
      await supabase
        .from("profiles")
        .update({ rol, nombre_completo: nombre })
        .eq("id", data.user.id);

      setLoading(false);
      router.push("/");
      router.refresh();
      return;
    }

    setLoading(false);
    setOk(true);
  }

  if (ok) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-panel border border-border rounded-xl3 p-8 text-center">
          <h1 className="text-xl font-bold text-white mb-3">
            Cuenta creada
          </h1>
          <p className="text-muted text-sm mb-6">
            Si tu proyecto tiene confirmación de correo activada, revisa tu
            bandeja de entrada. Luego inicia sesión.
          </p>
          <Link
            href="/login"
            className="inline-block bg-accent text-white rounded-xl px-5 py-3 font-semibold"
          >
            Ir a iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-panel border border-border rounded-xl3 p-8">
        <h1 className="text-xl font-bold text-white mb-1">Crear cuenta</h1>
        <p className="text-sm text-muted mb-6">
          Bitácoras Pala y Perforadora - Mantoverde
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label>Nombre completo</label>
            <input
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre y apellido"
            />
          </div>
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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <label>Rol</label>
            <select value={rol} onChange={(e) => setRol(e.target.value)}>
              <option value="operador">Operador equipo mina</option>
              <option value="mantenedor">
                Mantenedor / Jefe de mantención
              </option>
            </select>
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
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p className="text-sm text-muted text-center mt-6">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-accent font-medium">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
