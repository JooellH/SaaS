"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { scheduleSchema } from "@/lib/validations";
import { mapSchedulesFromApi } from "@/lib/schedule";
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
  logoUrl?: string | null;
}

interface ScheduleRow {
  id: string;
  weekday: number;
  openTime: string;
  closeTime: string;
  breakStart?: string | null;
  breakEnd?: string | null;
}

const weekdays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const makeEmptySchedule = (weekday = 1) => ({
  weekday,
  openTime: "09:00",
  closeTime: "18:00",
  breakStart: "",
  breakEnd: "",
});

export default function HorariosScreen() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
  const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
  const [form, setForm] = useState(makeEmptySchedule());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  useEffect(() => {
    const loadBusinesses = async () => {
      setLoadingBusinesses(true);
      try {
        const res = await api.get("/business");
        const list = Array.isArray(res.data)
          ? res.data
          : (res.data as { data?: unknown }).data;
        const normalized = Array.isArray(list) ? (list as Business[]) : [];

        setBusinesses(normalized);

        const active = localStorage.getItem("activeBusinessId");
        const nextId =
          (active && normalized.some((b) => b.id === active) && active) ||
          normalized[0]?.id ||
          "";
        setSelectedBusinessId(nextId);
      } catch {
        setError("No se pudieron cargar los negocios");
      } finally {
        setLoadingBusinesses(false);
      }
    };
    loadBusinesses();
  }, []);

  useEffect(() => {
    if (!selectedBusinessId) return;
    localStorage.setItem("activeBusinessId", selectedBusinessId);
  }, [selectedBusinessId]);

  useEffect(() => {
    if (!selectedBusinessId) return;
    const loadSchedule = async () => {
      setLoadingSchedule(true);
      try {
        const res = await api.get(`/business/${selectedBusinessId}/schedule`);
        const mapped = mapSchedulesFromApi(res.data);
        setSchedule(mapped);
        setForm((prev) => {
          const existing = mapped.find((row) => row.weekday === prev.weekday);
          if (!existing) return prev;
          return {
            weekday: existing.weekday,
            openTime: existing.openTime,
            closeTime: existing.closeTime,
            breakStart: existing.breakStart ?? "",
            breakEnd: existing.breakEnd ?? "",
          };
        });
      } catch {
        setError("No se pudo cargar la agenda");
      } finally {
        setLoadingSchedule(false);
      }
    };
    loadSchedule();
  }, [selectedBusinessId]);

  const submitSchedule = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const parsed = scheduleSchema.safeParse({
      ...form,
      breakStart: form.breakStart || undefined,
      breakEnd: form.breakEnd || undefined,
    });
    if (!parsed.success) {
      setError("Revisa los valores del horario.");
      setSaving(false);
      return;
    }
    try {
      await api.post(`/business/${selectedBusinessId}/schedule`, parsed.data);
      const res = await api.get(`/business/${selectedBusinessId}/schedule`);
      const mapped = mapSchedulesFromApi(res.data);
      setSchedule(mapped);
      const weekday = Number(parsed.data.weekday);
      const existing = mapped.find((row) => row.weekday === weekday);
      setForm(
        existing
          ? {
              weekday: existing.weekday,
              openTime: existing.openTime,
              closeTime: existing.closeTime,
              breakStart: existing.breakStart ?? "",
              breakEnd: existing.breakEnd ?? "",
            }
          : makeEmptySchedule(weekday),
      );
    } catch {
      setError("No se pudo guardar el horario");
    } finally {
      setSaving(false);
    }
  };

  const deleteRow = async (id: string) => {
    await api.delete(`/business/${selectedBusinessId}/schedule/${id}`);
    setSchedule((prev) => prev.filter((row) => row.id !== id));
  };

  const sortedSchedule = useMemo(
    () => [...schedule].sort((a, b) => a.weekday - b.weekday),
    [schedule],
  );

  const selectedBusiness = useMemo(
    () => businesses.find((b) => b.id === selectedBusinessId) || null,
    [businesses, selectedBusinessId],
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-slate-400">Operación</p>
          <h1 className="text-3xl font-semibold text-white">Horarios</h1>
          <p className="text-slate-400">
            Define disponibilidad y pausas para cada día.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-200/80">Negocio</label>
          <div className="flex items-center gap-2">
            {selectedBusiness?.logoUrl ? (
              <img
                src={selectedBusiness.logoUrl}
                alt="Logo"
                className="h-8 w-8 rounded-lg object-cover border border-white/10 bg-white/5"
              />
            ) : null}
            <Select
              value={selectedBusinessId}
              onChange={(e) => setSelectedBusinessId(e.target.value)}
              className="w-56"
              disabled={loadingBusinesses}
            >
              <option value="" disabled>
                Selecciona un negocio
              </option>
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {error && <FormFeedback variant="error" message={error} />}

      <Card className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="chip">Agregar horario</span>
          <p className="text-sm text-slate-300">
            Configura apertura, cierre y pausas opcionales.
          </p>
        </div>
        <form
          onSubmit={submitSchedule}
          className="form-grid md:grid-cols-6"
        >
          <div className="space-y-2">
            <label className="block text-sm text-slate-200">Día</label>
            <Select
              aria-label="Seleccionar día"
              value={form.weekday}
              onChange={(e) =>
                setForm(() => {
                  const weekday = Number(e.target.value);
                  const existing = schedule.find((row) => row.weekday === weekday);
                  return existing
                    ? {
                        weekday: existing.weekday,
                        openTime: existing.openTime,
                        closeTime: existing.closeTime,
                        breakStart: existing.breakStart ?? "",
                        breakEnd: existing.breakEnd ?? "",
                      }
                    : makeEmptySchedule(weekday);
                })
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
            <label className="block text-sm text-slate-200">Apertura</label>
            <Input
              type="time"
              value={form.openTime}
              onChange={(e) => setForm({ ...form, openTime: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm text-slate-200">Cierre</label>
            <Input
              type="time"
              value={form.closeTime}
              onChange={(e) => setForm({ ...form, closeTime: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm text-slate-200">Pausa inicio</label>
            <Input
              type="time"
              value={form.breakStart}
              onChange={(e) => setForm({ ...form, breakStart: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm text-slate-200">Pausa fin</label>
            <Input
              type="time"
              value={form.breakEnd}
              onChange={(e) => setForm({ ...form, breakEnd: e.target.value })}
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full h-12" disabled={saving}>
              <Plus className="w-4 h-4" />
              {saving ? "Guardando" : "Guardar"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Horarios cargados</h2>

        {loadingSchedule ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        ) : sortedSchedule.length === 0 ? (
          <div className="text-sm text-slate-300">No hay horarios configurados.</div>
        ) : (
          <div className="space-y-3">
            {sortedSchedule.map((row) => (
              <div
                key={row.id}
                className="rounded-2xl border border-white/10 bg-white/5 flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="space-y-1">
                  <div className="text-lg font-semibold text-white">
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
                  <Trash2 className="w-4 h-4" />
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
