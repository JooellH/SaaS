"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ArrowLeft } from "lucide-react";

type Service = {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
};

type Business = {
  id: string;
  name: string;
  slug: string;
  services: Service[];
};

export default function PublicServiciosPage() {
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Card className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </Card>
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
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.25em] text-indigo-200">
            /{business.slug}
          </p>
          <h1 className="text-3xl font-semibold text-white">Servicios</h1>
          <p className="text-sm text-slate-400">
            Servicios disponibles en {business.name}.
          </p>
        </div>
        <Link href={`/${business.slug}`} className="btn-secondary inline-flex">
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>
      </div>

      <Card className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Servicios del negocio</h2>
        {business.services.length === 0 ? (
          <div className="text-sm text-slate-300">No hay servicios aún.</div>
        ) : (
          <div className="space-y-3">
            {business.services.map((service) => (
              <div
                key={service.id}
                className="card border border-white/5 bg-white/5 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="font-semibold text-white">{service.name}</div>
                  <div className="text-sm text-slate-300">
                    {service.durationMinutes} min · ${service.price}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

