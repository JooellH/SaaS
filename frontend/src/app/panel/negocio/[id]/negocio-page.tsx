"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { CalendarClock, Notebook, Settings2, ArrowLeft, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";

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

export default function NegocioScreen() {
  const params = useParams<{ id: string }>();
  const businessId = params?.id;

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publicUrl, setPublicUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadBusiness = async () => {
      if (!businessId) return;
      try {
        const res = await api.get(`/business/${businessId}`);
        setBusiness(res.data);
      } catch (err: unknown) {
        const message =
          typeof err === "object" &&
          err !== null &&
          "response" in err &&
          typeof (err as { response?: { data?: { message?: string } } }).response
            ?.data?.message === "string"
            ? (err as { response: { data: { message: string } } }).response.data
                .message
            : "No se pudo cargar el negocio";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadBusiness();
  }, [businessId]);

  useEffect(() => {
    if (!business?.slug) return;
    setPublicUrl(`${window.location.origin}/${business.slug}`);
  }, [business?.slug]);

  if (loading) {
    return <div className="py-10 text-center text-slate-200">Cargando negocio...</div>;
  }

  if (error || !business) {
    return (
      <div className="py-10 text-center space-y-3">
        <p className="text-lg font-semibold text-white">No se encontró el negocio</p>
        <p className="text-sm text-slate-400">{error}</p>
        <Link href="/panel" className="btn-secondary inline-flex">
          <ArrowLeft className="w-4 h-4" />
          Volver al panel
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
        <div className="flex flex-wrap items-center gap-2 justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={async () => {
              if (!publicUrl) return;
              try {
                await navigator.clipboard.writeText(publicUrl);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1500);
              } catch {
                setCopied(false);
              }
            }}
          >
            <Copy className="w-4 h-4" />
            {copied ? "Copiado" : "Copiar link"}
          </Button>
          <a
            href={publicUrl || `/${business.slug}`}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary inline-flex"
          >
            <ExternalLink className="w-4 h-4" />
            Ver público
          </a>
          <Link href="/panel" className="btn-secondary">
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Link>
        </div>
      </div>

      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <motion.div variants={cardVariants}>
          <Link
            href={`/panel/negocio/${business.id}/reservas`}
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
            href={`/panel/negocio/${business.id}/servicios`}
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
            href={`/panel/negocio/${business.id}/horarios`}
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
