"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import api from "@/lib/api";
import { bookingSchema, type BookingForm } from "@/lib/validations";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { FormFeedback } from "@/components/ui/FormFeedback";
import { Trash2 } from "lucide-react";

type Booking = {
  id: string;
  businessId: string;
  serviceId: string;
  date: string;
  startTime: string;
  status: string;
  clientName: string;
  clientPhone: string;
  service?: { id: string; name: string };
};

type Service = {
  id: string;
  name: string;
  durationMinutes: number;
};

const today = () => new Date().toISOString().slice(0, 10);

const estadoEtiqueta: Record<string, string> = {
  confirmed: "Confirmada",
  pending: "Pendiente",
  cancelled: "Cancelada",
};

export default function NegocioReservasScreen() {
  const { id: businessId } = useParams<{ id: string }>();
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<BookingForm>({
    serviceId: "",
    date: today(),
    startTime: "",
    clientName: "",
    clientPhone: "",
  });

  const [reschedule, setReschedule] = useState<{
    bookingId: string | null;
    serviceId: string;
    date: string;
    startTime: string;
  }>({
    bookingId: null,
    serviceId: "",
    date: today(),
    startTime: "",
  });
  const [rescheduleSlots, setRescheduleSlots] = useState<string[]>([]);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    const loadServicesAndBookings = async () => {
      setLoading(true);
      try {
        const [svcRes, bookingRes] = await Promise.all([
          api.get(`/services/${businessId}`),
          api.get(`/bookings/${businessId}`),
        ]);
        setServices(svcRes.data);
        setBookings(bookingRes.data);
        if (svcRes.data.length > 0) {
          setForm((prev) => ({ ...prev, serviceId: svcRes.data[0].id }));
        }
      } catch (e) {
        setError("No se pudieron cargar servicios o reservas.");
      } finally {
        setLoading(false);
      }
    };
    loadServicesAndBookings();
  }, [businessId]);

  useEffect(() => {
    const loadSlots = async () => {
      if (!form.serviceId || !form.date) return;
      try {
        const res = await api.get(
          `/bookings/${businessId}/availability?serviceId=${form.serviceId}&date=${form.date}`,
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
  }, [businessId, form.serviceId, form.date]);

  useEffect(() => {
    const loadRescheduleSlots = async () => {
      if (!reschedule.bookingId || !reschedule.serviceId || !reschedule.date)
        return;
      try {
        const res = await api.get(
          `/bookings/${businessId}/availability?serviceId=${reschedule.serviceId}&date=${reschedule.date}`,
        );
        setRescheduleSlots(res.data);
        if (res.data.length > 0) {
          setReschedule((prev) => ({ ...prev, startTime: res.data[0] }));
        }
      } catch {
        setRescheduleSlots([]);
      }
    };
    loadRescheduleSlots();
  }, [businessId, reschedule.bookingId, reschedule.serviceId, reschedule.date]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const parsed = bookingSchema.safeParse(form);
    if (!parsed.success) {
      setError("Revisa los datos de la reserva.");
      return;
    }
    try {
      await api.post("/bookings", { ...parsed.data, businessId });
      const bookingRes = await api.get(`/bookings/${businessId}`);
      setBookings(bookingRes.data);
      setSuccess("Reserva creada correctamente.");
    } catch (err: unknown) {
      const message =
        typeof err === "object" &&
          err !== null &&
          "response" in err &&
          typeof (err as { response?: { data?: { message?: string } } }).response
            ?.data?.message === "string"
          ? (err as { response: { data: { message: string } } }).response.data
            .message
          : "No se pudo crear la reserva.";
      setError(message);
    }
  };

  const openCancel = (booking: Booking) => {
    setCancelTarget(booking);
    setCancelReason("");
    setCancelError(null);
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelLoading(true);
    setCancelError(null);
    try {
      await api.patch(`/bookings/${cancelTarget.id}/cancel`, {
        reason: cancelReason.trim() || undefined,
      });
      setBookings((prev) =>
        prev.map((b) =>
          b.id === cancelTarget.id ? { ...b, status: "cancelled" } : b,
        ),
      );
      setCancelTarget(null);
      setCancelReason("");
    } catch (err: unknown) {
      const message =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response
          ?.data?.message === "string"
          ? (err as { response: { data: { message: string } } }).response.data
              .message
          : "No se pudo cancelar la reserva";
      setCancelError(message);
    } finally {
      setCancelLoading(false);
    }
  };

  const openReschedule = (booking: Booking) => {
    setReschedule({
      bookingId: booking.id,
      serviceId: booking.serviceId,
      date: today(),
      startTime: "",
    });
    setRescheduleSlots([]);
  };

  const submitReschedule = async (e: FormEvent) => {
    e.preventDefault();
    if (!reschedule.bookingId || !reschedule.startTime) return;
    await api.patch(`/bookings/${reschedule.bookingId}/reschedule`, {
      date: reschedule.date,
      startTime: reschedule.startTime,
    });
    const bookingRes = await api.get(`/bookings/${businessId}`);
    setBookings(bookingRes.data);
    setReschedule({
      bookingId: null,
      serviceId: "",
      date: today(),
      startTime: "",
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-slate-400">Negocio</p>
          <h1 className="text-3xl font-semibold text-white">Reservas</h1>
        </div>
        <Link
          href={`/panel/negocio/${businessId}`}
          className="btn-secondary inline-flex w-fit"
        >
          ← Volver
        </Link>
      </div>

      <Card className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold text-white">Crear reserva</h2>
            <p className="text-sm text-slate-300">
              Selecciona servicio, fecha y hora para agendar.
            </p>
          </div>
          {success && (
            <div className="chip bg-green-500/15 text-green-100">{success}</div>
          )}
          {error && <div className="chip bg-red-500/15 text-red-100">{error}</div>}
        </div>
        <form
          onSubmit={handleCreate}
          className="form-grid md:grid-cols-4"
        >
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm text-slate-200">Servicio</label>
            <Select
              value={form.serviceId}
              onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
              required
            >
              {services.map((svc) => (
                <option key={svc.id} value={svc.id}>
                  {svc.name} ({svc.durationMinutes} min)
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm text-slate-200">Fecha</label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm text-slate-200">Hora</label>
            <Select
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
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
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm text-slate-200">Nombre cliente</label>
            <Input
              value={form.clientName}
              onChange={(e) => setForm({ ...form, clientName: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm text-slate-200">Teléfono</label>
            <Input
              value={form.clientPhone}
              onChange={(e) =>
                setForm({ ...form, clientPhone: e.target.value })
              }
              required
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full h-12" disabled={slots.length === 0}>
              Crear reserva
            </Button>
          </div>
        </form>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Reservas existentes</h2>
          {loading && <span className="text-xs text-slate-400">Cargando...</span>}
        </div>
        {loading ? (
          <div className="text-sm text-slate-400">Cargando...</div>
        ) : bookings.length === 0 ? (
          <div className="text-sm text-slate-300">Aún no hay reservas.</div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="card border border-white/5 bg-white/5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-1">
                  <div className="font-semibold text-white">
                    {booking.clientName} ({booking.clientPhone})
                  </div>
                  <div className="text-sm text-slate-300">
                    {new Date(booking.date).toLocaleDateString("es-ES")} · {booking.startTime} · {booking.service?.name || "Servicio"}
                  </div>
                  <div className="text-xs uppercase text-indigo-200">
                    Estado: {estadoEtiqueta[booking.status] || booking.status}
                  </div>
                </div>
                {booking.status !== "cancelled" && (
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="secondary"
                      onClick={() => openReschedule(booking)}
                    >
                      Reagendar
                    </Button>
                    <Button
                      variant="secondary"
                      className="text-red-200 hover:text-white"
                      onClick={() => openCancel(booking)}
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <AnimatePresence>
        {cancelTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur"
            onClick={() => {
              if (cancelLoading) return;
              setCancelTarget(null);
              setCancelReason("");
              setCancelError(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ type: "spring", stiffness: 220, damping: 20 }}
              className="w-full max-w-lg rounded-3xl bg-slate-900/80 border border-white/10 shadow-2xl shadow-red-500/15 p-6 space-y-4"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500/10 border border-red-400/20">
                    <Trash2 className="h-5 w-5 text-red-200" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-semibold text-white">
                      Cancelar reserva
                    </h2>
                    <p className="text-sm text-slate-300">
                      {cancelTarget.clientName} · {cancelTarget.clientPhone} ·{" "}
                      {new Date(cancelTarget.date).toLocaleDateString("es-ES")} ·{" "}
                      {cancelTarget.startTime}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    if (cancelLoading) return;
                    setCancelTarget(null);
                    setCancelReason("");
                    setCancelError(null);
                  }}
                  variant="ghost"
                  className="text-sm"
                >
                  Cerrar
                </Button>
              </div>

              {cancelError && (
                <FormFeedback variant="error" message={cancelError} />
              )}

              <div className="space-y-2">
                <label className="block text-sm text-slate-200">
                  Motivo (opcional)
                </label>
                <Input
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Ej: No vamos a abrir hoy por mantenimiento"
                />
                <p className="text-xs text-slate-400">
                  Se le enviará un WhatsApp al cliente con el motivo.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  onClick={() => {
                    if (cancelLoading) return;
                    setCancelTarget(null);
                    setCancelReason("");
                    setCancelError(null);
                  }}
                  variant="secondary"
                  className="flex-1"
                >
                  Volver
                </Button>
                <Button
                  type="button"
                  onClick={confirmCancel}
                  disabled={cancelLoading}
                  variant="secondary"
                  className="flex-1 border border-red-400/40 bg-red-500/15 text-red-100 hover:bg-red-500/25"
                >
                  {cancelLoading ? "Cancelando..." : "Cancelar reserva"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {reschedule.bookingId && (
        <Card className="space-y-4 border-indigo-400/30 bg-indigo-500/5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Reagendar reserva</h3>
            <Button
              variant="ghost"
              className="text-sm"
              onClick={() =>
                setReschedule({
                  bookingId: null,
                  serviceId: "",
                  date: today(),
                  startTime: "",
                })
              }
            >
              Cerrar
            </Button>
          </div>
          <form
            onSubmit={submitReschedule}
            className="form-grid md:grid-cols-3"
          >
            <div className="space-y-2">
              <label className="block text-sm text-slate-200">Fecha</label>
              <Input
                type="date"
                value={reschedule.date}
                onChange={(e) =>
                  setReschedule((prev) => ({
                    ...prev,
                    date: e.target.value,
                    startTime: "",
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm text-slate-200">Hora</label>
              <Select
                value={reschedule.startTime}
                onChange={(e) =>
                  setReschedule((prev) => ({
                    ...prev,
                    startTime: e.target.value,
                  }))
                }
                required
              >
                {rescheduleSlots.length === 0 && (
                  <option>No hay disponibilidad</option>
                )}
                {rescheduleSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                className="w-full h-12"
                disabled={rescheduleSlots.length === 0}
              >
                Guardar cambio
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
