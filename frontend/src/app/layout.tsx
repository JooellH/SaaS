import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Reserva Pro - Sistema de Reservas Multinegocio",
  description:
    "Sistema profesional de gestión de reservas con recordatorios automáticos vía WhatsApp",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,0.08),transparent_26%),radial-gradient(circle_at_80%_0%,rgba(34,211,238,0.08),transparent_30%),radial-gradient(circle_at_60%_80%,rgba(59,130,246,0.08),transparent_28%),#0b1021] text-slate-50`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
