"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { bookingSchema, type BookingForm } from "@/lib/validations";
import { ArrowLeft, CalendarClock, CheckCircle2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormFeedback } from "@/components/ui/FormFeedback";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Input } from "@/components/ui/Input";

type Service = {
  id: string;
  name: string;
  durationMinutes: number;
  cleaningTimeMinutes?: number;
  price: number;
};

type BusinessSchedule = {
  weekday: number;
  isActive: boolean;
  intervals: { start: string; end: string }[];
};

type Business = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  services: Service[];
  schedules?: BusinessSchedule[];
};

type ClientBooking = {
  id: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  service?: { name: string };
  metadata?: { cancellationReason?: string } | null;
};

const statusLabels: Record<string, string> = {
  confirmed: "Confirmada",
  pending: "Pendiente",
  cancelled: "Cancelada",
};

const formatISODate = (iso: string) => {
  const d = iso.slice(0, 10);
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
};

const weekdayFromISO = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-").map((n) => Number(n));
  return new Date(y, m - 1, d).getDay();
};

const timeToMinutes = (time: string) => {
  const [h, m] = time.split(":").map((n) => Number(n));
  return h * 60 + m;
};

const minutesToTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
};

const computeCandidateSlots = (
  intervals: { start: string; end: string }[],
  totalDuration: number,
  stepMinutes: number,
) => {
  const out: string[] = [];
  for (const interval of intervals) {
    const start = timeToMinutes(interval.start);
    const end = timeToMinutes(interval.end);
    for (let t = start; t + totalDuration <= end; t += stepMinutes) {
      out.push(minutesToTime(t));
    }
  }
  return out;
};

const getOrCreateClientKey = (slug: string) => {
  const storageKey = `clientKey:${slug}`;
  const existing = localStorage.getItem(storageKey);
  if (existing) return existing;
  const created =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  localStorage.setItem(storageKey, created);
  return created;
};

export default function PublicReservasPage() {
  const { slug } = useParams<{ slug: string }>();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientKey, setClientKey] = useState<string>("");

  const [form, setForm] = useState<BookingForm>({
    serviceId: "",
    date: new Date().toISOString().slice(0, 10),
    startTime: "",
    clientName: "",
    clientPhone: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [candidateSlots, setCandidateSlots] = useState<string[]>([]);

  const [myBookings, setMyBookings] = useState<ClientBooking[]>([]);
  const [loadingMyBookings, setLoadingMyBookings] = useState(false);

  const [actionBooking, setActionBooking] = useState<ClientBooking | null>(null);
  const [actionMode, setActionMode] = useState<"cancel" | "reschedule" | null>(
    null,
  );
  const [actionDate, setActionDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [actionTime, setActionTime] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionAvailable, setActionAvailable] = useState<string[]>([]);
  const [actionCandidates, setActionCandidates] = useState<string[]>([]);

  useEffect(() => {
    if (!slug) return;
    setClientKey(getOrCreateClientKey(slug));
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    const loadBusiness = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/public/${slug}`);
        const next = res.data as Business;
        setBusiness(next);
        if (next.services?.length) {
          setForm((prev) => ({ ...prev, serviceId: next.services[0].id }));
        }
      } catch {
        setBusiness(null);
        setError("Negocio no encontrado");
      } finally {
        setLoading(false);
      }
    };
    loadBusiness();
  }, [slug]);

  const loadMyBookings = async () => {
    if (!slug || !clientKey) return;
    setLoadingMyBookings(true);
    try {
      const res = await api.get(`/public/${slug}/bookings?clientKey=${clientKey}`);
      setMyBookings(Array.isArray(res.data) ? (res.data as ClientBooking[]) : []);
    } catch {
      setMyBookings([]);
    } finally {
      setLoadingMyBookings(false);
    }
  };

  useEffect(() => {
    loadMyBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, clientKey]);

  useEffect(() => {
    const loadSlots = async () => {
      if (!business || !form.serviceId || !form.date) return;
      const service = business.services.find((s) => s.id === form.serviceId);
      const scheduleRow = business.schedules?.find(
        (s) => s.weekday === weekdayFromISO(form.date),
      );

      const totalDuration = service?.durationMinutes || 0;
      const candidates =
        scheduleRow?.isActive && totalDuration > 0
          ? computeCandidateSlots(scheduleRow.intervals || [], totalDuration, 30)
          : [];
      setCandidateSlots(candidates);

      try {
        const res = await api.get(
          `/bookings/${business.id}/availability?serviceId=${form.serviceId}&date=${form.date}`,
        );
        const available = Array.isArray(res.data) ? (res.data as string[]) : [];
        setAvailableSlots(available);
        setForm((prev) => ({
          ...prev,
          startTime: available[0] || "",
        }));
      } catch {
        setAvailableSlots([]);
        setForm((prev) => ({ ...prev, startTime: "" }));
      }
    };
    loadSlots();
  }, [business, form.serviceId, form.date]);

  useEffect(() => {
    const loadActionSlots = async () => {
      if (!business || !actionBooking || actionMode !== "reschedule") return;

      const service = business.services.find((s) => s.id === actionBooking.serviceId);
      const scheduleRow = business.schedules?.find(
        (s) => s.weekday === weekdayFromISO(actionDate),
      );

      const totalDuration = service?.durationMinutes || 0;
      const candidates =
        scheduleRow?.isActive && totalDuration > 0
          ? computeCandidateSlots(scheduleRow.intervals || [], totalDuration, 30)
          : [];
      setActionCandidates(candidates);

      try {
        const res = await api.get(
          `/bookings/${business.id}/availability?serviceId=${actionBooking.serviceId}&date=${actionDate}`,
        );
        const list = Array.isArray(res.data) ? (res.data as string[]) : [];

        const bookingDate = actionBooking.date.slice(0, 10);
        const allowCurrentSlot =
          bookingDate === actionDate && !list.includes(actionBooking.startTime);

        const available = allowCurrentSlot
          ? [...list, actionBooking.startTime].sort((a, b) => a.localeCompare(b))
          : list;

        setActionAvailable(available);

        if (available.includes(actionBooking.startTime)) {
          setActionTime(actionBooking.startTime);
        } else {
          setActionTime(available[0] || "");
        }
      } catch {
        setActionAvailable([]);
        setActionTime("");
      }
    };
    loadActionSlots();
  }, [actionBooking, actionDate, actionMode, business]);

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
        metadata: { clientKey },
      });

      const svcName =
        business.services.find((s) => s.id === parsed.data.serviceId)?.name ||
        "servicio";
      const [year, month, day] = parsed.data.date.split("-");
      const formattedDate = `${day}/${month}/${year}`;
      setSuccess(
        `Reserva confirmada para ${svcName} el ${formattedDate} a las ${parsed.data.startTime}. Te vamos a escribir por WhatsApp.`,
      );
      await loadMyBookings();
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

      setError(
        message === "Time slot not available"
          ? "Ese horario ya está reservado. Elegí otro."
          : message,
      );
    } finally {
      setSaving(false);
    }
  };

  const openCancel = (booking: ClientBooking) => {
    setActionBooking(booking);
    setActionMode("cancel");
    setActionError(null);
  };

  const openReschedule = (booking: ClientBooking) => {
    setActionBooking(booking);
    setActionMode("reschedule");
    setActionError(null);
    setActionDate(booking.date.slice(0, 10));
    setActionTime(booking.startTime);
    setActionAvailable([]);
    setActionCandidates([]);
  };

  const closeAction = () => {
    if (actionLoading) return;
    setActionBooking(null);
    setActionMode(null);
    setActionError(null);
    setActionAvailable([]);
    setActionCandidates([]);
    setActionTime("");
  };

  const confirmCancel = async () => {
    if (!slug || !actionBooking || !clientKey) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await api.patch(`/public/${slug}/bookings/${actionBooking.id}/cancel`, {
        clientKey,
      });
      await loadMyBookings();
      closeAction();
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
      setActionError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const confirmReschedule = async () => {
    if (!slug || !actionBooking || !clientKey) return;
    if (!actionTime) {
      setActionError("Elegí una hora disponible.");
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      await api.patch(`/public/${slug}/bookings/${actionBooking.id}/reschedule`, {
        clientKey,
        date: actionDate,
        startTime: actionTime,
      });

      const svcName = actionBooking.service?.name || "servicio";
      const [year, month, day] = actionDate.split("-");
      const formattedDate = `${day}/${month}/${year}`;
      setSuccess(
        `Reserva reagendada para ${svcName} el ${formattedDate} a las ${actionTime}. Te vamos a escribir por WhatsApp.`,
      );
      await loadMyBookings();
      closeAction();
    } catch (err: unknown) {
      const message =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response
          ?.data?.message === "string"
          ? (err as { response: { data: { message: string } } }).response.data
              .message
          : "No se pudo reagendar la reserva";
      setActionError(
        message === "Time slot not available"
          ? "Ese horario ya está reservado. Elegí otro."
          : message,
      );
    } finally {
      setActionLoading(false);
    }
  };

  const sortedMyBookings = useMemo(
    () =>
      [...myBookings].sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime() ||
          b.startTime.localeCompare(a.startTime),
      ),
    [myBookings],
  );

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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between gap-3 mb-8">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.25em] text-indigo-200">
            /{business.slug}
          </p>
          <h1 className="text-3xl font-semibold text-white">Reservas</h1>
          <p className="text-sm text-slate-400">
            Seleccioná un servicio, fecha y hora para agendar.
          </p>
        </div>
        <Link href={`/${business.slug}`} className="btn-secondary inline-flex">
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-white">Crear reserva</h2>
              <p className="text-sm text-slate-300">
                Elegí un horario disponible y completá tus datos.
              </p>
            </div>

            {error && <FormFeedback variant="error" message={error} />}
            {success && <FormFeedback variant="success" message={success} />}

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-200 mb-1">
                  Servicio
                </label>
                <Select
                  aria-label="Servicio"
                  value={form.serviceId}
                  onChange={(e) =>
                    setForm({ ...form, serviceId: e.target.value, startTime: "" })
                  }
                  required
                >
                  {business.services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} · {service.durationMinutes} min · $
                      {service.price}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-200 mb-1">
                    Fecha
                  </label>
                  <Input
                    aria-label="Fecha"
                    type="date"
                    value={form.date}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        date: e.target.value,
                        startTime: "",
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-200 mb-1">
                    Hora
                  </label>
                  <Select
                    aria-label="Hora"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    required
                  >
                    {candidateSlots.length === 0 && (
                      <option value="">No hay disponibilidad</option>
                    )}
                    {candidateSlots.map((slot) => {
                      const available = availableSlots.includes(slot);
                      return (
                        <option key={slot} value={slot} disabled={!available}>
                          {available ? slot : `${slot} (ocupado)`}
                        </option>
                      );
                    })}
                  </Select>
                </div>
              </div>

              {availableSlots.length === 0 && candidateSlots.length > 0 && (
                <div className="text-xs text-slate-400">
                  Ese día no hay horarios disponibles (todo ocupado).
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-200 mb-1">
                    Nombre
                  </label>
                  <Input
                    aria-label="Nombre"
                    value={form.clientName}
                    onChange={(e) =>
                      setForm({ ...form, clientName: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-200 mb-1">
                    Teléfono
                  </label>
                  <Input
                    aria-label="Teléfono"
                    value={form.clientPhone}
                    onChange={(e) =>
                      setForm({ ...form, clientPhone: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="brand"
                  type="submit"
                  disabled={saving || !form.startTime || availableSlots.length === 0}
                >
                  {saving ? "Guardando..." : "Confirmar reserva"}
                </Button>
                {success && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setSuccess(null);
                      setError(null);
                      setForm((prev) => ({
                        ...prev,
                        clientName: "",
                        clientPhone: "",
                      }));
                    }}
                  >
                    Agendar otro turno
                  </Button>
                )}
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CalendarClock className="w-4 h-4" />
                  <span>Disponibilidad en tiempo real · {business.timezone}</span>
                </div>
              </div>
            </form>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Mis reservas</h2>
              {loadingMyBookings && (
                <span className="text-xs text-slate-400">Cargando...</span>
              )}
            </div>

            {!loadingMyBookings && sortedMyBookings.length === 0 ? (
              <div className="text-sm text-slate-300">
                Todavía no tenés reservas desde este dispositivo.
              </div>
            ) : (
              <div className="space-y-3">
                {sortedMyBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="card border border-white/5 bg-white/5 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="font-semibold text-white">
                        {booking.service?.name || "Servicio"}
                      </div>
                      <div className="text-sm text-slate-300">
                        {formatISODate(booking.date)} · {booking.startTime}
                      </div>
                      <div className="text-xs uppercase text-indigo-200 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        {statusLabels[booking.status] || booking.status}
                      </div>
                      {booking.status === "cancelled" &&
                      booking.metadata?.cancellationReason ? (
                        <div className="text-xs text-amber-200/90">
                          Cancelada. Motivo: {booking.metadata.cancellationReason}
                        </div>
                      ) : null}
                    </div>
                    {booking.status !== "cancelled" && (
                      <div className="flex flex-wrap gap-2 justify-end">
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
        </motion.div>
      </div>

      <AnimatePresence>
        {actionBooking && actionMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur"
            onClick={closeAction}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ type: "spring", stiffness: 220, damping: 20 }}
              className="w-full max-w-lg rounded-3xl bg-slate-900/80 border border-white/10 shadow-2xl shadow-indigo-500/15 p-6 space-y-4"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold text-white">
                    {actionMode === "cancel"
                      ? "Cancelar reserva"
                      : "Reagendar reserva"}
                  </h2>
                  <p className="text-sm text-slate-300">
                    {actionBooking.service?.name || "Servicio"} ·{" "}
                    {formatISODate(actionBooking.date)} · {actionBooking.startTime}
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={closeAction}
                  variant="ghost"
                  className="text-sm"
                >
                  Cerrar
                </Button>
              </div>

              {actionError && (
                <FormFeedback variant="error" message={actionError} />
              )}

              {actionMode === "reschedule" ? (
                <div className="space-y-3">
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-slate-200 mb-1">
                        Fecha
                      </label>
                      <Input
                        type="date"
                        value={actionDate}
                        min={new Date().toISOString().slice(0, 10)}
                        onChange={(e) => {
                          setActionDate(e.target.value);
                          setActionTime("");
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-200 mb-1">
                        Hora
                      </label>
                      <Select
                        value={actionTime}
                        onChange={(e) => setActionTime(e.target.value)}
                      >
                        {actionCandidates.length === 0 && (
                          <option value="">No hay disponibilidad</option>
                        )}
                        {actionCandidates.map((slot) => {
                          const available = actionAvailable.includes(slot);
                          return (
                            <option key={slot} value={slot} disabled={!available}>
                              {available ? slot : `${slot} (ocupado)`}
                            </option>
                          );
                        })}
                      </Select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  Esta acción cancelará tu reserva.
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  onClick={closeAction}
                  variant="secondary"
                  className="flex-1"
                >
                  Volver
                </Button>
                <Button
                  type="button"
                  onClick={
                    actionMode === "cancel" ? confirmCancel : confirmReschedule
                  }
                  disabled={actionLoading}
                  variant="secondary"
                  className={
                    actionMode === "cancel"
                      ? "flex-1 border border-red-400/40 bg-red-500/15 text-red-100 hover:bg-red-500/25"
                      : "flex-1"
                  }
                >
                  {actionLoading ? (
                    "Procesando..."
                  ) : actionMode === "cancel" ? (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Cancelar
                    </>
                  ) : (
                    "Guardar cambio"
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
