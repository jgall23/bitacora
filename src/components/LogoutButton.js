"use client";

import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    // Recarga dura: evita que quede cacheada la sesión/rol anterior.
    window.location.href = "/login";
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 text-sm text-muted hover:text-bad transition px-3 py-2 rounded-lg border border-border shrink-0"
    >
      <i className="fas fa-right-from-bracket" />
      Cerrar sesión
    </button>
  );
}
