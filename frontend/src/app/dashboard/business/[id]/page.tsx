"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

interface Business {
  id: string;
  name: string;
  slug: string;
  timezone?: string;
}

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
    return <div className="py-10 text-center">Cargando negocio...</div>;
  }

  if (error || !business) {
    return (
      <div className="py-10 text-center space-y-3">
        <p className="text-lg font-semibold text-gray-900">
          No se encontró el negocio
        </p>
        <p className="text-sm text-gray-600">{error}</p>
        <Link
          href="/dashboard"
          className="text-primary-600 hover:text-primary-700"
        >
          ← Volver al dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-gray-500">/{business.slug}</p>
          <h1 className="text-3xl font-bold text-gray-900">{business.name}</h1>
          {business.timezone && (
            <p className="text-sm text-gray-600">
              Zona horaria: {business.timezone}
            </p>
          )}
        </div>
        <Link
          href="/dashboard"
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          ← Volver
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href={`/dashboard/business/${business.id}/bookings`}
          className="card hover:shadow-md transition"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Reservas</h3>
          <p className="text-sm text-gray-600">
            Administra reservas y disponibilidad.
          </p>
        </Link>

        <Link
          href={`/dashboard/business/${business.id}/services`}
          className="card hover:shadow-md transition"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Servicios
          </h3>
          <p className="text-sm text-gray-600">
            Configura los servicios y precios.
          </p>
        </Link>

        <Link
          href={`/dashboard/business/${business.id}/schedule`}
          className="card hover:shadow-md transition"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Horarios</h3>
          <p className="text-sm text-gray-600">Define horarios y bloqueos.</p>
        </Link>
      </div>
    </div>
  );
}
