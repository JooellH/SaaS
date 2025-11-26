"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { bookingSchema, type BookingForm } from "@/lib/validations";

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

export default function PublicBookingPage({
  params,
}: {
  params: { slug: string };
}) {
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
    const loadBusiness = async () => {
      setError(null);
      try {
        const res = await api.get(`/public/${params.slug}`);
        setBusiness(res.data);
        if (res.data.services?.length) {
          setForm((prev) => ({ ...prev, serviceId: res.data.services[0].id }));
        }
      } catch {
        setError("Business not found");
      } finally {
        setLoading(false);
      }
    };
    loadBusiness();
  }, [params.slug]);

  useEffect(() => {
    const loadSlots = async () => {
      if (!business || !form.serviceId || !form.date) return;
      try {
        const res = await api.get(
          `/bookings/${business.id}/availability?serviceId=${form.serviceId}&date=${form.date}`
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
      setError("Please check the booking data.");
      setSaving(false);
      return;
    }
    try {
      await api.post("/bookings", {
        ...parsed.data,
        businessId: business.id,
      });
      setSuccess("Booking created. You will receive confirmation soon.");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to create booking");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-gray-600">Loading business...</div>;
  }

  if (!business) {
    return <div className="p-8 text-red-600">{error || "Business not found"}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">{business.name}</h1>
        <p className="text-sm text-gray-600">
          Timezone: {business.timezone} · slug: /{business.slug}
        </p>
      </div>

      <div className="card space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Book a service</h2>
          <p className="text-sm text-gray-700">
            Pick a service, date and time to confirm your reservation.
          </p>
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}
        {success && <div className="text-green-600 text-sm">{success}</div>}

        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Service</label>
            <select
              value={form.serviceId}
              onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
              className="input-field"
              required
            >
              {business.services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} · {service.durationMinutes} min · ${service.price}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Time</label>
            <select
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              className="input-field"
              required
            >
              {slots.length === 0 && <option>No availability</option>}
              {slots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Name</label>
            <input
              value={form.clientName}
              onChange={(e) => setForm({ ...form, clientName: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Phone</label>
            <input
              value={form.clientPhone}
              onChange={(e) => setForm({ ...form, clientPhone: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="btn-primary"
              disabled={saving || !form.startTime || slots.length === 0}
            >
              {saving ? "Saving..." : "Confirm booking"}
            </button>
          </div>
        </form>
      </div>

      <div className="card space-y-2">
        <h3 className="font-semibold text-gray-900">Schedule</h3>
        <div className="text-sm text-gray-700">
          {business.schedule.length === 0
            ? "No schedule configured"
            : business.schedule.map((row) => (
                <div key={`${row.weekday}-${row.openTime}`}>
                  Day {row.weekday}: {row.openTime} - {row.closeTime}
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}
