"use client";

import { useTheme } from "./ThemeProvider";

export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      title={isDark ? "Tema claro" : "Tema oscuro"}
      className={
        "w-9 h-9 flex items-center justify-center rounded-lg border border-border text-muted hover:text-ink transition shrink-0 " +
        className
      }
    >
      <i className={`fas ${isDark ? "fa-sun" : "fa-moon"}`} aria-hidden="true" />
    </button>
  );
}
