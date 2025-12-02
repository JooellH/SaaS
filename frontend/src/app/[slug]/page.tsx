"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { bookingSchema, type BookingForm } from "@/lib/validations";
import { motion } from "framer-motion";
import { CalendarClock, Clock3, Phone, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { FormFeedback } from "@/components/ui/FormFeedback";
import { Skeleton } from "@/components/ui/Skeleton";
import { Input } from "@/components/ui/Input";

interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
}

interface ScheduleRow {
  weekday: number;
  openTime: string;
  closeTime: string;
}

interface Business {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  services: Service[];
  schedule: ScheduleRow[];
}

export default function PublicBookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<BookingForm>({
    serviceId: "",
    date: new Date().toISOString().slice(0, 10),
    startTime: "",
    clientName: "",
    clientPhone: "",
  });

  useEffect(() => {
    if (!slug) return;
    const loadBusiness = async () => {
      setError(null);
      try {
        const res = await api.get(`/public/${slug}`);
        setBusiness(res.data);
        if (res.data.services?.length) {
          setForm((prev) => ({ ...prev, serviceId: res.data.services[0].id }));
        }
      } catch {
        setError("Negocio no encontrado");
      } finally {
        setLoading(false);
      }
    };
    loadBusiness();
  }, [slug]);

  useEffect(() => {
    const loadSlots = async () => {
      if (!business || !form.serviceId || !form.date) return;
      try {
        const res = await api.get(
          `/bookings/${business.id}/availability?serviceId=${form.serviceId}&date=${form.date}`,
        );
        setSlots(res.data);
        if (res.data.length > 0) {
          setForm((prev) => ({ ...prev, startTime: res.data[0] }));
        }
      } catch {
        setSlots([]);
      }
    };
    loadSlots();
  }, [business, form.serviceId, form.date]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    const parsed = bookingSchema.safeParse(form);
    if (!parsed.success) {
      setError("Revisa los datos de la reserva.");
      setSaving(false);
      return;
    }
    try {
      await api.post("/bookings", {
        ...parsed.data,
        businessId: business.id,
      });
      setSuccess("Reserva creada. Te confirmaremos en breve.");
    } catch (err: unknown) {
      const message =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response
          ?.data?.message === "string"
          ? (err as { response: { data: { message: string } } }).response.data
              .message
          : "No se pudo crear la reserva";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <Skeleton className="h-10 w-3/4" />
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Card className="space-y-3">
          <Skeleton className="h-6 w-1/2" />
          <div className="grid md:grid-cols-2 gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
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
    <div className="relative min-h-screen">
      <div className="absolute inset-0 -z-10 opacity-70 blur-3xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,0.16),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_60%_80%,rgba(59,130,246,0.18),transparent_32%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10"
      >
        {/* Hero */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-200">
            <Sparkles className="w-4 h-4" />
            <span>Reserva Pro · Landing Pública</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold text-white">
            {business.name}
          </h1>
          <p className="text-slate-300">
            Zona horaria: {business.timezone} · /{business.slug}
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <p className="text-sm text-indigo-200">Agenda tu turno</p>
              <h3 className="text-xl font-semibold text-white">
                Elegí el servicio y horario perfecto
              </h3>
              <p className="text-sm text-slate-300">
                Animaciones suaves, inputs premium y un flujo de reserva
                minimalista.
              </p>
            </Card>
            <Card>
              <p className="text-sm text-indigo-200">Servicios destacados</p>
              <ul className="space-y-2 text-slate-100 text-sm">
                {business.services.slice(0, 3).map((svc) => (
                  <li key={svc.id} className="flex items-center gap-2">
                    <span className="chip border-indigo-300/30 bg-indigo-500/15 text-indigo-100">
                      {svc.durationMinutes} min
                    </span>
                    <span>{svc.name}</span>
                    <span className="text-slate-300">· ${svc.price}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>

        {/* Booking form */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card space-y-6"
        >
          <div>
            <h2 className="text-2xl font-semibold text-white">
              Reserva un servicio
            </h2>
            <p className="text-sm text-slate-300">
              Selecciona servicio, fecha y hora para confirmar tu reserva.
            </p>
          </div>

          {error && <FormFeedback variant="error" message={error} />}
          {success && <FormFeedback variant="success" message={success} />}

          <form
            onSubmit={submit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-sm text-slate-200 mb-1">
                Servicio
              </label>
              <Select
                aria-label="Servicio"
                value={form.serviceId}
                onChange={(e) =>
                  setForm({ ...form, serviceId: e.target.value })
                }
                required
              >
                {business.services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} · {service.durationMinutes} min · ${service.price}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm text-slate-200 mb-1">Fecha</label>
              <Input
                aria-label="Fecha"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm text-slate-200 mb-1">Hora</label>
              <Select
                aria-label="Hora"
                value={form.startTime}
                onChange={(e) =>
                  setForm({ ...form, startTime: e.target.value })
                }
                required
              >
                {slots.length === 0 && <option>No hay disponibilidad</option>}
                {slots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm text-slate-200 mb-1">
                Nombre
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  aria-label="Nombre"
                  value={form.clientName}
                  onChange={(e) =>
                    setForm({ ...form, clientName: e.target.value })
                  }
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-200 mb-1">
                Teléfono
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  aria-label="Teléfono"
                  value={form.clientPhone}
                  onChange={(e) =>
                    setForm({ ...form, clientPhone: e.target.value })
                  }
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="md:col-span-2 flex flex-wrap gap-3">
              <Button
                type="submit"
                disabled={saving || !form.startTime || slots.length === 0}
              >
                {saving ? "Guardando..." : "Confirmar reserva"}
              </Button>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <CalendarClock className="w-4 h-4" />
                <span>
                  Disponibilidad en tiempo real · zona horaria {business.timezone}
                </span>
              </div>
            </div>
          </form>
        </motion.div>

        {/* Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card space-y-3"
        >
          <h3 className="font-semibold text-white">Agenda del negocio</h3>
          <div className="text-sm text-slate-200 space-y-2">
            {business.schedule.length === 0
              ? "No hay horarios configurados"
              : business.schedule.map((row) => (
                  <div
                    key={`${row.weekday}-${row.openTime}`}
                    className="flex items-center gap-2"
                  >
                    <Clock3 className="w-4 h-4 text-indigo-200" />
                    <span>
                      Día {row.weekday}: {row.openTime} - {row.closeTime}
                    </span>
                  </div>
                ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
