"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import api from "@/lib/api";
import { serviceSchema } from "@/lib/validations";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

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

export default function NegocioServiciosScreen() {
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-slate-400">Negocio</p>
          <h1 className="text-3xl font-semibold text-white">Servicios</h1>
        </div>
        <Link
          href={`/panel/negocio/${businessId}`}
          className="btn-secondary inline-flex w-fit"
        >
          ← Volver
        </Link>
      </div>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Crear servicio</h2>
            <p className="text-sm text-slate-300">
              Define duración, limpieza y precio.
            </p>
          </div>
          {error && <div className="chip bg-red-500/15 text-red-100">{error}</div>}
        </div>
        <form
          onSubmit={handleSubmit}
          className="form-grid lg:grid-cols-6"
        >
          <div className="lg:col-span-2 space-y-2">
            <label className="text-sm text-slate-200">Nombre</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-200">Duración (min)</label>
            <Input
              type="number"
              value={form.durationMinutes}
              onChange={(e) =>
                setForm({ ...form, durationMinutes: Number(e.target.value) })
              }
              required
              min={0}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-200">Limpieza (min)</label>
            <Input
              type="number"
              value={form.cleaningTimeMinutes}
              onChange={(e) =>
                setForm({
                  ...form,
                  cleaningTimeMinutes: Number(e.target.value),
                })
              }
              required
              min={0}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-200">Precio</label>
            <Input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              required
              min={0}
            />
          </div>
          <div className="form-actions flex items-end">
            <Button type="submit" className="w-full h-12">
              Guardar
            </Button>
          </div>
        </form>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Servicios del negocio</h2>
        {loading ? (
          <div className="text-sm text-slate-400">Cargando...</div>
        ) : services.length === 0 ? (
          <div className="text-sm text-slate-300">No hay servicios aún.</div>
        ) : (
          <div className="space-y-3">
            {services.map((service) => (
              <div
                key={service.id}
                className="card border border-white/5 bg-white/5 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="font-semibold text-white">{service.name}</div>
                  <div className="text-sm text-slate-300">
                    {service.durationMinutes} min + {service.cleaningTimeMinutes} min · $
                    {service.price}
                  </div>
                </div>
                <Button
                  variant="secondary"
                  className="text-red-200 hover:text-white"
                  onClick={() => deleteService(service.id)}
                >
                  Eliminar
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
