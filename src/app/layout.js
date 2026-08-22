import "./globals.css";

export const metadata = {
  title: "Bitácoras Pala y Perforadora | Capstone Copper Mantoverde",
  description: "Sistema de bitácoras de equipo mina - Operador y Mantenedor",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
