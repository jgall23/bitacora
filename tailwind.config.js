/** @type {import('tailwindcss').Config} */

// Cada color se resuelve desde una variable CSS (definida en globals.css),
// lo que permite que todas las clases de Tailwind (bg-panel, text-muted,
// text-accent, etc.) cambien automáticamente de valor según el tema
// (claro u oscuro) activo, sin tener que tocar los componentes.
function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgb(var(${variableName}) / ${opacityValue})`;
    }
    return `rgb(var(${variableName}))`;
  };
}

module.exports = {
  content: [
    "./src/app/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: withOpacity("--color-bg"),
        panel: withOpacity("--color-panel"),
        border: withOpacity("--color-border"),
        muted: withOpacity("--color-muted"),
        ink: withOpacity("--color-ink"),
        accent: withOpacity("--color-accent"),
        accent2: withOpacity("--color-accent2"),
        good: withOpacity("--color-good"),
        bad: withOpacity("--color-bad"),
      },
      borderRadius: {
        xl2: "24px",
        xl3: "28px",
      },
    },
  },
  plugins: [],
};
