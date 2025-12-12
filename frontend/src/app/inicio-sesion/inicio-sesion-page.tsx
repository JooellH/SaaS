"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Sparkles } from "lucide-react";
import { AxiosError } from "axios";

export default function InicioSesionPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      router.push("/panel");
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ message: string }>;
      setError(axiosErr.response?.data.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">

      {/* Fondo */}
      <div className="absolute inset-0 -z-10 opacity-80 bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,0.16),transparent_26%),radial-gradient(circle_at_80%_0%,rgba(34,211,238,0.14),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(59,130,246,0.16),transparent_28%)]"></div>

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
        }}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-indigo-900/30 backdrop-blur-xl space-y-8"
      >
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-200">
            <Sparkles className="w-4 h-4" />
            <span>Reserva Pro</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Bienvenido de nuevo</h1>
          <p className="text-sm text-slate-300">Inicia sesión para gestionar tus negocios y reservas.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {/* EMAIL */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />

              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-11 input-compact"
                placeholder="demo@reservapro.com"
              />
            </div>
          </div>

          {/* CONTRASEÑA */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />

              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-11 pr-11 input-compact"
                placeholder="••••••••"
              />

              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border-0 bg-transparent p-1 text-slate-400 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Iniciando..." : "Iniciar sesión"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-300">
          ¿No tienes cuenta?{" "}
          <Link href="/crear-cuenta" className="font-semibold text-indigo-200 hover:text-white">
            Regístrate
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
