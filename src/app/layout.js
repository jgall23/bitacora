import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata = {
  title: "Bitácoras Pala y Perforadora | Capstone Copper Mantoverde",
  description: "Sistema de bitácoras de equipo mina - Operador y Mantenedor",
};

// Corre antes del primer pintado para fijar el tema guardado y evitar el
// "flash" de tema incorrecto al cargar la página (FOUC).
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var saved = window.localStorage.getItem('bitacoras-theme');
    var theme = saved === 'light' || saved === 'dark' ? saved : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="es" data-theme="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
