"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { CalendarClock, Notebook, Settings2, ArrowLeft } from "lucide-react";

interface Business {
  id: string;
  name: string;
  slug: string;
  timezone?: string;
}

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function BusinessPage() {
  const params = useParams<{ id: string }>();
  const businessId = params?.id;

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBusiness = async () => {
      if (!businessId) return;
      try {
        const res = await api.get(`/business/${businessId}`);
        setBusiness(res.data);
      } catch (err: any) {
        setError(
          err?.response?.data?.message || "No se pudo cargar el negocio",
        );
      } finally {
        setLoading(false);
      }
    };

    loadBusiness();
  }, [businessId]);

  if (loading) {
    return <div className="py-10 text-center text-slate-200">Cargando negocio...</div>;
  }

  if (error || !business) {
    return (
      <div className="py-10 text-center space-y-3">
        <p className="text-lg font-semibold text-white">No se encontró el negocio</p>
        <p className="text-sm text-slate-400">{error}</p>
        <Link href="/dashboard" className="btn-secondary inline-flex">
          <ArrowLeft className="w-4 h-4" />
          Volver al dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.25em] text-indigo-200">
            /{business.slug}
          </p>
          <h1 className="text-4xl font-semibold text-white">{business.name}</h1>
          {business.timezone && (
            <p className="text-sm text-slate-300">
              Zona horaria: {business.timezone}
            </p>
          )}
        </div>
        <Link href="/dashboard" className="btn-secondary">
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>
      </div>

      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <motion.div variants={cardVariants}>
          <Link
            href={`/dashboard/business/${business.id}/bookings`}
            className="card hover:border-indigo-300/50 hover:shadow-indigo-500/15 block"
          >
            <div className="flex items-center gap-3">
              <CalendarClock className="w-9 h-9 text-indigo-300" />
              <div>
                <h3 className="text-lg font-semibold text-white">Reservas</h3>
                <p className="text-sm text-slate-400">
                  Administra reservas y disponibilidad.
                </p>
              </div>
            </div>
          </Link>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Link
            href={`/dashboard/business/${business.id}/services`}
            className="card hover:border-indigo-300/50 hover:shadow-indigo-500/15 block"
          >
            <div className="flex items-center gap-3">
              <Notebook className="w-9 h-9 text-indigo-300" />
              <div>
                <h3 className="text-lg font-semibold text-white">Servicios</h3>
                <p className="text-sm text-slate-400">
                  Configura los servicios y precios.
                </p>
              </div>
            </div>
          </Link>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Link
            href={`/dashboard/business/${business.id}/schedule`}
            className="card hover:border-indigo-300/50 hover:shadow-indigo-500/15 block"
          >
            <div className="flex items-center gap-3">
              <Settings2 className="w-9 h-9 text-indigo-300" />
              <div>
                <h3 className="text-lg font-semibold text-white">Horarios</h3>
                <p className="text-sm text-slate-400">
                  Define horarios y bloqueos.
                </p>
              </div>
            </div>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
