"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  LogOut,
  Sparkles,
  LayoutGrid,
  CalendarClock,
  NotebookText,
  Settings2,
  Home,
  Users,
  BarChart3,
  CreditCard,
} from "lucide-react";
import TrialBanner from "@/components/TrialBanner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/inicio-sesion");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navItems = [
    { label: "Inicio", href: "/panel", icon: Home },
    { label: "Reservas", href: "/panel/reservas", icon: CalendarClock },
    { label: "Servicios", href: "/panel/servicios", icon: NotebookText },
    { label: "Horarios", href: "/panel/horarios", icon: CalendarClock },
    { label: "Personal", href: "/panel/personal", icon: Users },
    { label: "Analytics", href: "/panel/analytics", icon: BarChart3 },
    { label: "Planes", href: "/panel/planes", icon: CreditCard },
    { label: "Ajustes", href: "/panel/ajustes", icon: Settings2 },
  ];

  return (
    <div className="min-h-screen relative flex">
      <div className="absolute inset-0 -z-10 opacity-70 blur-3xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,0.2),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(34,211,238,0.2),transparent_30%),radial-gradient(circle_at_60%_80%,rgba(59,130,246,0.25),transparent_32%)]" />
      </div>

      <aside className="hidden lg:flex w-64 flex-col border-r border-white/10 bg-slate-900/60 backdrop-blur-xl px-5 py-6 gap-8">
        <div className="flex items-center gap-3">
          <div className="pill bg-indigo-500/20 border-indigo-400/30">
            <Sparkles className="w-4 h-4 text-indigo-300" />
            <span className="text-xs font-semibold tracking-wide">
              Reserva Pro
            </span>
          </div>
        </div>
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition-all border ${
                  active
                    ? "border-indigo-400/50 bg-indigo-500/10 text-white shadow-lg shadow-indigo-500/15"
                    : "border-transparent text-slate-300 hover:text-white hover:border-white/10 hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 min-h-screen">
        <motion.nav
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-30 border-b border-white/10 bg-slate-900/70 backdrop-blur px-4 sm:px-6 lg:px-8 h-16 flex items-center"
        >
          <div className="flex items-center gap-2 text-slate-100 lg:hidden">
            <div className="pill bg-indigo-500/20 border-indigo-400/30">
              <LayoutGrid className="w-4 h-4 text-indigo-300" />
              <span className="text-xs font-semibold tracking-wide">
                Panel
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <span className="text-sm text-slate-200/80">
              Hola,{" "}
              <span className="font-semibold text-slate-100">{user.name}</span>
            </span>
            <button
              onClick={logout}
              className="btn-secondary !py-2 !px-3 text-sm"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </div>
        </motion.nav>

        <div className="page-shell">
          <TrialBanner key={user.id} />
          {children}
        </div>
      </div>
    </div>
  );
}
