"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { CalendarClock, Notebook } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

interface Business {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
}

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function PublicBusinessHome() {
  const { slug } = useParams<{ slug: string }>();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/public/${slug}`);
        setBusiness(res.data as Business);
      } catch {
        setBusiness(null);
        setError("Negocio no encontrado");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <Skeleton className="h-10 w-3/4" />
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-200">
        {error || "Negocio no encontrado"}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.25em] text-indigo-200">
          /{business.slug}
        </p>
        <h1 className="text-4xl font-semibold text-white">{business.name}</h1>
        <p className="text-sm text-slate-300">
          Reservá tu turno eligiendo un servicio y un horario disponible.
        </p>
      </div>

      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <motion.div variants={cardVariants}>
          <Link
            href={`/${business.slug}/reservas`}
            className="card hover:border-indigo-300/50 hover:shadow-indigo-500/15 block"
          >
            <div className="flex items-center gap-3">
              <CalendarClock className="w-9 h-9 text-indigo-300" />
              <div>
                <h3 className="text-lg font-semibold text-white">Reservas</h3>
                <p className="text-sm text-slate-400">
                  Elegí servicio, fecha y hora para agendar.
                </p>
              </div>
            </div>
          </Link>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Link
            href={`/${business.slug}/servicios`}
            className="card hover:border-indigo-300/50 hover:shadow-indigo-500/15 block"
          >
            <div className="flex items-center gap-3">
              <Notebook className="w-9 h-9 text-indigo-300" />
              <div>
                <h3 className="text-lg font-semibold text-white">Servicios</h3>
                <p className="text-sm text-slate-400">
                  Mirá los servicios disponibles del negocio.
                </p>
              </div>
            </div>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
