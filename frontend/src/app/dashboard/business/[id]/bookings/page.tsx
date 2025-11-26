"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import api from "@/lib/api";
import { bookingSchema, type BookingForm } from "@/lib/validations";

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

export default function BusinessBookingsPage() {
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
          `/bookings/${businessId}/availability?serviceId=${form.serviceId}&date=${form.date}`
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
          `/bookings/${businessId}/availability?serviceId=${reschedule.serviceId}&date=${reschedule.date}`
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
    } catch (err: any) {
      setError(err?.response?.data?.message || "No se pudo crear la reserva.");
    }
  };

  const cancelBooking = async (bookingId: string) => {
    await api.patch(`/bookings/${bookingId}/cancel`);
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: "cancelled" } : b))
    );
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
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-gray-500">Negocio</p>
          <h1 className="text-3xl font-bold text-gray-900">Reservas</h1>
        </div>
        <Link
          href={`/dashboard/business/${businessId}`}
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          ← Volver al negocio
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Crear reserva</h2>
        {error && <div className="text-sm text-red-600">{error}</div>}
        {success && <div className="text-sm text-green-600">{success}</div>}
        <form
          onSubmit={handleCreate}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div>
            <label className="block text-sm text-gray-700 mb-1">Servicio</label>
            <select
              value={form.serviceId}
              onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
              className="input-field"
              required
            >
              {services.map((svc) => (
                <option key={svc.id} value={svc.id}>
                  {svc.name} ({svc.durationMinutes} min)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Fecha</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Hora</label>
            <select
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              className="input-field"
              required
            >
              {slots.length === 0 && <option>No hay disponibilidad</option>}
              {slots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Nombre cliente
            </label>
            <input
              value={form.clientName}
              onChange={(e) => setForm({ ...form, clientName: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Teléfono</label>
            <input
              value={form.clientPhone}
              onChange={(e) =>
                setForm({ ...form, clientPhone: e.target.value })
              }
              className="input-field"
              required
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={slots.length === 0}
            >
              Crear reserva
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Reservas existentes
        </h2>
        {loading ? (
          <p className="text-sm text-gray-600">Cargando...</p>
        ) : bookings.length === 0 ? (
          <p className="text-sm text-gray-600">Aún no hay reservas.</p>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="border border-gray-200 rounded-lg p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="font-semibold text-gray-900">
                    {booking.clientName} ({booking.clientPhone})
                  </div>
                  <div className="text-sm text-gray-700">
                    {new Date(booking.date).toLocaleDateString()}{" "}
                    {booking.startTime} · {booking.service?.name || "Servicio"}
                  </div>
                  <div className="text-xs uppercase text-gray-500">
                    Estado: {booking.status}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {booking.status !== "cancelled" && (
                    <>
                      <button
                        className="btn-secondary"
                        onClick={() => openReschedule(booking)}
                      >
                        Reagendar
                      </button>
                      <button
                        className="btn-secondary text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => cancelBooking(booking.id)}
                      >
                        Cancelar
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {reschedule.bookingId && (
        <div className="rounded-xl border border-primary-200 bg-primary-50 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Reagendar reserva
            </h3>
            <button
              className="text-sm text-primary-700"
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
            </button>
          </div>
          <form
            onSubmit={submitReschedule}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div>
              <label className="block text-sm text-gray-700 mb-1">Fecha</label>
              <input
                type="date"
                value={reschedule.date}
                onChange={(e) =>
                  setReschedule((prev) => ({
                    ...prev,
                    date: e.target.value,
                    startTime: "",
                  }))
                }
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Hora</label>
              <select
                value={reschedule.startTime}
                onChange={(e) =>
                  setReschedule((prev) => ({
                    ...prev,
                    startTime: e.target.value,
                  }))
                }
                className="input-field"
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
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="btn-primary w-full"
                disabled={rescheduleSlots.length === 0}
              >
                Guardar cambio
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
