"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { serviceSchema } from "@/lib/validations";
import { motion } from "framer-motion";
import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { FormFeedback } from "@/components/ui/FormFeedback";
import { Skeleton } from "@/components/ui/Skeleton";

interface Business {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  cleaningTimeMinutes: number;
  price: number;
}

const emptyService = {
  name: "",
  durationMinutes: 30,
  cleaningTimeMinutes: 0,
  price: 0,
};

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

export default function ServiciosScreen() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState(emptyService);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);

  useEffect(() => {
    const loadBusinesses = async () => {
      try {
        const res = await api.get("/business");
        setBusinesses(res.data);
        if (res.data.length > 0) {
          setSelectedBusinessId(res.data[0].id);
        }
      } catch {
        setError("No se pudieron cargar los negocios");
      }
    };
    loadBusinesses();
  }, []);

  useEffect(() => {
    if (!selectedBusinessId) return;
    const loadServices = async () => {
      setLoadingServices(true);
      try {
        const res = await api.get(`/services/${selectedBusinessId}`);
        setServices(res.data);
      } catch {
        setError("No se pudieron cargar los servicios");
      } finally {
        setLoadingServices(false);
      }
    };
    loadServices();
  }, [selectedBusinessId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const parsed = serviceSchema.safeParse({
      ...form,
      businessId: selectedBusinessId,
    });
    if (!parsed.success) {
      setError("Revisa los campos del servicio.");
      setSaving(false);
      return;
    }

    try {
      await api.post("/services", parsed.data);
      setForm(emptyService);
      const res = await api.get(`/services/${selectedBusinessId}`);
      setServices(res.data);
    } catch {
      setError("No se pudo guardar el servicio");
    } finally {
      setSaving(false);
    }
  };

  const deleteService = async (id: string) => {
    await api.delete(`/services/${id}`);
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  const sortedServices = useMemo(
    () =>
      [...services].sort((a, b) => a.name.localeCompare(b.name, "es")),
    [services],
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-slate-400">Operación</p>
          <h1 className="text-3xl font-semibold text-white">Servicios</h1>
          <p className="text-slate-400">
            Define ofertas, duración y precios con un look más visual.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-200/80">Negocio</label>
          <Select
            value={selectedBusinessId}
            onChange={(e) => setSelectedBusinessId(e.target.value)}
            className="w-56"
          >
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {error && <FormFeedback variant="error" message={error} />}

      <Card className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="chip">Nuevo servicio</span>
          <p className="text-sm text-slate-300">
            Completa los datos y guarda para agregarlo a tu negocio.
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="form-grid md:grid-cols-6"
        >
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm text-slate-200">Nombre</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm text-slate-200">
              Duración (min)
            </label>
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
            <label className="block text-sm text-slate-200">
              Limpieza (min)
            </label>
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
            <label className="block text-sm text-slate-200">Precio</label>
            <Input
              type="number"
              value={form.price}
              onChange={(e) =>
                setForm({ ...form, price: Number(e.target.value) })
              }
              required
              min={0}
            />
          </div>
          <div className="flex items-end">
            <Button
              type="submit"
              className="w-full h-12"
              disabled={saving}
            >
              <Plus className="w-4 h-4" />
              {saving ? "Guardando" : "Guardar"}
            </Button>
          </div>
        </form>
      </Card>

      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.04 } } }}
        className="space-y-3"
      >
        {loadingServices ? (
          [...Array(3)].map((_, i) => (
            <Card key={i} className="space-y-2">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
            </Card>
          ))
        ) : sortedServices.length === 0 ? (
          <Card className="text-sm text-slate-300">No hay servicios aún.</Card>
        ) : (
          sortedServices.map((service) => (
            <motion.div
              key={service.id}
              variants={fadeUp}
              className="card flex items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="text-lg font-semibold text-white">
                  {service.name}
                </div>
                <div className="text-sm text-slate-300">
                  {service.durationMinutes} min · {service.cleaningTimeMinutes} min limpieza · $
                  {service.price}
                </div>
              </div>
              <Button
                variant="secondary"
                className="text-red-200 hover:text-white"
                onClick={() => deleteService(service.id)}
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </Button>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
}
