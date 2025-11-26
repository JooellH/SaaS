"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import api from "@/lib/api";
import { serviceSchema } from "@/lib/validations";

type Service = {
  id: string;
  name: string;
  durationMinutes: number;
  cleaningTimeMinutes: number;
  price: number;
};

const emptyService = {
  name: "",
  durationMinutes: 30,
  cleaningTimeMinutes: 0,
  price: 0,
};

export default function BusinessServicesPage() {
  const { id: businessId } = useParams<{ id: string }>();
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState(emptyService);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadServices = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/services/${businessId}`);
        setServices(res.data);
      } catch {
        setError("No se pudieron cargar los servicios.");
      } finally {
        setLoading(false);
      }
    };
    loadServices();
  }, [businessId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = serviceSchema.safeParse({ ...form, businessId });
    if (!parsed.success) {
      setError("Revisa los datos del servicio.");
      return;
    }
    try {
      await api.post("/services", parsed.data);
      const res = await api.get(`/services/${businessId}`);
      setServices(res.data);
      setForm(emptyService);
    } catch {
      setError("No se pudo guardar el servicio.");
    }
  };

  const deleteService = async (serviceId: string) => {
    await api.delete(`/services/${serviceId}`);
    setServices((prev) => prev.filter((s) => s.id !== serviceId));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-gray-500">Negocio</p>
          <h1 className="text-3xl font-bold text-gray-900">Servicios</h1>
        </div>
        <Link
          href={`/dashboard/business/${businessId}`}
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          ← Volver al negocio
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Crear servicio</h2>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-700 mb-1">Nombre</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Duración (min)</label>
            <input
              type="number"
              value={form.durationMinutes}
              onChange={(e) =>
                setForm({ ...form, durationMinutes: Number(e.target.value) })
              }
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Limpieza (min)</label>
            <input
              type="number"
              value={form.cleaningTimeMinutes}
              onChange={(e) =>
                setForm({ ...form, cleaningTimeMinutes: Number(e.target.value) })
              }
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Precio</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="input-field flex-1"
                required
              />
              <button type="submit" className="btn-primary whitespace-nowrap">
                Guardar
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Servicios del negocio</h2>
        {loading ? (
          <p className="text-sm text-gray-600">Cargando...</p>
        ) : services.length === 0 ? (
          <p className="text-sm text-gray-600">No hay servicios aún.</p>
        ) : (
          <div className="space-y-3">
            {services.map((service) => (
              <div
                key={service.id}
                className="border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="font-semibold text-gray-900">{service.name}</div>
                  <div className="text-sm text-gray-700">
                    {service.durationMinutes} min + {service.cleaningTimeMinutes} min · $
                    {service.price}
                  </div>
                </div>
                <button
                  className="btn-secondary"
                  onClick={() => deleteService(service.id)}
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
