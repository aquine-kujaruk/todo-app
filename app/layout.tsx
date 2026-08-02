import type { Metadata } from "next";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Todo POC",
  description: "Prueba de concepto: Next.js + Supabase desplegado en Vercel",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // `suppressHydrationWarning` va aquí porque el script de abajo escribe
    // `data-theme` en este mismo elemento antes de que React hidrate, y React
    // se quejaría de un atributo que el servidor no mandó. Solo afecta a este
    // elemento, no a sus hijos.
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Bloqueante y antes del contenido a propósito: estampa el tema
            guardado antes del primer pintado, que es lo que evita el destello.
            El contenido es una constante del propio código, no entra nada de
            fuera. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
