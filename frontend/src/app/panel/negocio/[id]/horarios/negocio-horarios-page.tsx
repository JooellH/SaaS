"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import api from "@/lib/api";
import { scheduleSchema } from "@/lib/validations";
import { mapSchedulesFromApi } from "@/lib/schedule";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

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

export default function NegocioHorariosScreen() {
  const { id: businessId } = useParams<{ id: string }>();
  const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
  const [form, setForm] = useState(emptySchedule);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSchedule = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/business/${businessId}/schedule`);
        setSchedule(mapSchedulesFromApi(res.data));
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
      breakStart: form.breakStart || undefined,
      breakEnd: form.breakEnd || undefined,
    });

    if (!parsed.success) {
      setError("Revisa los datos del horario.");
      return;
    }

    try {
      await api.post(`/business/${businessId}/schedule`, parsed.data);
      const res = await api.get(`/business/${businessId}/schedule`);
      setSchedule(mapSchedulesFromApi(res.data));
    } catch {
      setError("No se pudo guardar el horario.");
    }
  };

  const deleteRow = async (id: string) => {
    await api.delete(`/business/${businessId}/schedule/${id}`);
    setSchedule((prev) => prev.filter((row) => row.id !== id));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-slate-400">Negocio</p>
          <h1 className="text-3xl font-semibold text-white">Horarios</h1>
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
            <h2 className="text-xl font-semibold text-white">Agregar horario</h2>
            <p className="text-sm text-slate-300">
              Configura apertura, cierre y pausas opcionales.
            </p>
          </div>
          {error && <div className="chip bg-red-500/15 text-red-100">{error}</div>}
        </div>

        {/* FORMULARIO CORREGIDO */}
        <form
          onSubmit={submitSchedule}
          className="form-grid lg:grid-cols-6"
        >
          <div className="space-y-2">
            <label className="text-sm text-slate-200">Día</label>
            <Select
              value={form.weekday}
              onChange={(e) =>
                setForm({ ...form, weekday: Number(e.target.value) })
              }
            >
              {weekdays.map((day, idx) => (
                <option key={day} value={idx}>
                  {idx} - {day}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-200">Apertura</label>
            <Input
              type="time"
              value={form.openTime}
              onChange={(e) => setForm({ ...form, openTime: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-200">Cierre</label>
            <Input
              type="time"
              value={form.closeTime}
              onChange={(e) => setForm({ ...form, closeTime: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-200">Pausa inicio</label>
            <Input
              type="time"
              value={form.breakStart}
              onChange={(e) =>
                setForm({ ...form, breakStart: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-200">Pausa fin</label>
            <Input
              type="time"
              value={form.breakEnd}
              onChange={(e) =>
                setForm({ ...form, breakEnd: e.target.value })
              }
            />
          </div>

          <div className="flex items-end">
            <Button type="submit" className="w-full h-12">
              Guardar
            </Button>
          </div>
        </form>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Horarios cargados</h2>

        {loading ? (
          <div className="text-sm text-slate-400">Cargando...</div>
        ) : schedule.length === 0 ? (
          <div className="text-sm text-slate-300">Aún no hay horarios.</div>
        ) : (
          <div className="space-y-3">
            {schedule.map((row) => (
              <div
                key={row.id}
                className="card border border-white/5 bg-white/5 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="font-semibold text-white">
                    {weekdays[row.weekday]} · {row.openTime} - {row.closeTime}
                  </div>

                  {row.breakStart && row.breakEnd && (
                    <div className="text-sm text-slate-300">
                      Pausa: {row.breakStart} - {row.breakEnd}
                    </div>
                  )}
                </div>

                <Button
                  variant="secondary"
                  className="text-red-200 hover:text-white"
                  onClick={() => deleteRow(row.id)}
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
