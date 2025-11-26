"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { scheduleSchema } from "@/lib/validations";
import { motion } from "framer-motion";
import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { FormFeedback } from "@/components/ui/FormFeedback";
import { Skeleton } from "@/components/ui/Skeleton";

interface Business {
  id: string;
  name: string;
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

const emptySchedule = {
  weekday: 1,
  openTime: "09:00",
  closeTime: "18:00",
  breakStart: "",
  breakEnd: "",
};

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

export default function SchedulePage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
  const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
  const [form, setForm] = useState(emptySchedule);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

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
    const loadSchedule = async () => {
      setLoadingSchedule(true);
      try {
        const res = await api.get(
          `/business/${selectedBusinessId}/schedule`,
        );
        setSchedule(res.data);
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
      businessId: selectedBusinessId,
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
      const res = await api.get(
        `/business/${selectedBusinessId}/schedule`,
      );
      setSchedule(res.data);
      setForm(emptySchedule);
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
          <select
            value={selectedBusinessId}
            onChange={(e) => setSelectedBusinessId(e.target.value)}
            className="input-field w-56"
          >
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
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
          className="grid grid-cols-1 md:grid-cols-6 gap-3"
        >
          <div>
            <label className="block text-sm text-slate-200 mb-1">Día</label>
            <Select
              aria-label="Seleccionar día"
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
          <div>
            <label className="block text-sm text-slate-200 mb-1">Apertura</label>
            <input
              type="time"
              value={form.openTime}
              onChange={(e) => setForm({ ...form, openTime: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-200 mb-1">Cierre</label>
            <input
              type="time"
              value={form.closeTime}
              onChange={(e) => setForm({ ...form, closeTime: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-200 mb-1">Pausa inicio</label>
            <input
              type="time"
              value={form.breakStart}
              onChange={(e) => setForm({ ...form, breakStart: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-200 mb-1">Pausa fin</label>
            <input
              type="time"
              value={form.breakEnd}
              onChange={(e) => setForm({ ...form, breakEnd: e.target.value })}
              className="input-field"
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full" disabled={saving}>
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
        {loadingSchedule ? (
          [...Array(4)].map((_, i) => (
            <Card key={i} className="space-y-2">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </Card>
          ))
        ) : sortedSchedule.length === 0 ? (
          <Card className="text-sm text-slate-300">
            No hay horarios configurados.
          </Card>
        ) : (
          sortedSchedule.map((row) => (
            <motion.div
              key={row.id}
              variants={fadeUp}
              className="card flex items-center justify-between gap-3"
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
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
}
