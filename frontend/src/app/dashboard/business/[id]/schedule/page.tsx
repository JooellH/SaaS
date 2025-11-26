"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import api from "@/lib/api";
import { scheduleSchema } from "@/lib/validations";

type ScheduleRow = {
  id: string;
  weekday: number;
  openTime: string;
  closeTime: string;
  breakStart?: string | null;
  breakEnd?: string | null;
};

const weekdays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const emptySchedule = {
  weekday: 1,
  openTime: "09:00",
  closeTime: "18:00",
  breakStart: "",
  breakEnd: "",
};

export default function BusinessSchedulePage() {
  const { id: businessId } = useParams<{ id: string }>();
  const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
  const [form, setForm] = useState(emptySchedule);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSchedule = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/schedule/${businessId}`);
        setSchedule(res.data);
      } catch {
        setError("No se pudo cargar el horario.");
      } finally {
        setLoading(false);
      }
    };
    loadSchedule();
  }, [businessId]);

  const submitSchedule = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = scheduleSchema.safeParse({
      ...form,
      businessId,
      breakStart: form.breakStart || undefined,
      breakEnd: form.breakEnd || undefined,
    });
    if (!parsed.success) {
      setError("Revisa los datos del horario.");
      return;
    }
    try {
      await api.post("/schedule", parsed.data);
      const res = await api.get(`/schedule/${businessId}`);
      setSchedule(res.data);
    } catch {
      setError("No se pudo guardar el horario.");
    }
  };

  const deleteRow = async (id: string) => {
    await api.delete(`/schedule/${id}`);
    setSchedule((prev) => prev.filter((row) => row.id !== id));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-gray-500">Negocio</p>
          <h1 className="text-3xl font-bold text-gray-900">Horarios</h1>
        </div>
        <Link
          href={`/dashboard/business/${businessId}`}
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          ← Volver al negocio
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Agregar horario</h2>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <form onSubmit={submitSchedule} className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Día</label>
            <select
              value={form.weekday}
              onChange={(e) => setForm({ ...form, weekday: Number(e.target.value) })}
              className="input-field"
            >
              {weekdays.map((day, idx) => (
                <option key={day} value={idx}>
                  {idx} - {day}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Apertura</label>
            <input
              type="time"
              value={form.openTime}
              onChange={(e) => setForm({ ...form, openTime: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Cierre</label>
            <input
              type="time"
              value={form.closeTime}
              onChange={(e) => setForm({ ...form, closeTime: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Pausa inicio</label>
            <input
              type="time"
              value={form.breakStart}
              onChange={(e) => setForm({ ...form, breakStart: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Pausa fin</label>
            <input
              type="time"
              value={form.breakEnd}
              onChange={(e) => setForm({ ...form, breakEnd: e.target.value })}
              className="input-field"
            />
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn-primary w-full">
              Guardar
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Horarios cargados</h2>
        {loading ? (
          <p className="text-sm text-gray-600">Cargando...</p>
        ) : schedule.length === 0 ? (
          <p className="text-sm text-gray-600">Aún no hay horarios.</p>
        ) : (
          <div className="space-y-3">
            {schedule.map((row) => (
              <div
                key={row.id}
                className="border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="font-semibold text-gray-900">
                    {weekdays[row.weekday]} · {row.openTime} - {row.closeTime}
                  </div>
                  {row.breakStart && row.breakEnd && (
                    <div className="text-sm text-gray-700">
                      Pausa: {row.breakStart} - {row.breakEnd}
                    </div>
                  )}
                </div>
                <button className="btn-secondary" onClick={() => deleteRow(row.id)}>
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
