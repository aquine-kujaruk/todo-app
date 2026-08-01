import type { Metadata } from "next";
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
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
