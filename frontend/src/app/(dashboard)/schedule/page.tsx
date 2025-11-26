"use client";

import { FormEvent, useEffect, useState } from "react";
import api from "@/lib/api";
import { scheduleSchema } from "@/lib/validations";

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

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const emptySchedule = {
  weekday: 1,
  openTime: "09:00",
  closeTime: "18:00",
  breakStart: "",
  breakEnd: "",
};

export default function SchedulePage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
  const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
  const [form, setForm] = useState(emptySchedule);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBusinesses = async () => {
      try {
        const res = await api.get("/business");
        setBusinesses(res.data);
        if (res.data.length > 0) {
          setSelectedBusinessId(res.data[0].id);
        }
      } catch {
        setError("Unable to load businesses");
      }
    };
    loadBusinesses();
  }, []);

  useEffect(() => {
    if (!selectedBusinessId) return;
    const loadSchedule = async () => {
      try {
        const res = await api.get(`/schedule/${selectedBusinessId}`);
        setSchedule(res.data);
      } catch {
        setError("Unable to load schedule");
      }
    };
    loadSchedule();
  }, [selectedBusinessId]);

  const submitSchedule = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = scheduleSchema.safeParse({
      ...form,
      businessId: selectedBusinessId,
      breakStart: form.breakStart || undefined,
      breakEnd: form.breakEnd || undefined,
    });
    if (!parsed.success) {
      setError("Check schedule values.");
      return;
    }
    try {
      await api.post("/schedule", parsed.data);
      const res = await api.get(`/schedule/${selectedBusinessId}`);
      setSchedule(res.data);
    } catch {
      setError("Unable to save schedule");
    }
  };

  const deleteRow = async (id: string) => {
    await api.delete(`/schedule/${id}`);
    setSchedule((prev) => prev.filter((row) => row.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Schedule</h1>
        <div className="flex gap-3 items-center">
          <label className="text-sm text-gray-700">Business</label>
          <select
            value={selectedBusinessId}
            onChange={(e) => setSelectedBusinessId(e.target.value)}
            className="input-field"
          >
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <form onSubmit={submitSchedule} className="card grid grid-cols-1 md:grid-cols-6 gap-3">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Weekday</label>
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
          <label className="block text-sm text-gray-700 mb-1">Open</label>
          <input
            type="time"
            value={form.openTime}
            onChange={(e) => setForm({ ...form, openTime: e.target.value })}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Close</label>
          <input
            type="time"
            value={form.closeTime}
            onChange={(e) => setForm({ ...form, closeTime: e.target.value })}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Break start</label>
          <input
            type="time"
            value={form.breakStart}
            onChange={(e) => setForm({ ...form, breakStart: e.target.value })}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Break end</label>
          <input
            type="time"
            value={form.breakEnd}
            onChange={(e) => setForm({ ...form, breakEnd: e.target.value })}
            className="input-field"
          />
        </div>
        <div className="flex items-end">
          <button type="submit" className="btn-primary w-full">
            Add
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {schedule.length === 0 ? (
          <div className="text-sm text-gray-600">No schedule rows yet.</div>
        ) : (
          schedule.map((row) => (
            <div
              key={row.id}
              className="card flex items-center justify-between gap-3"
            >
              <div>
                <div className="font-semibold text-gray-900">
                  {weekdays[row.weekday]} · {row.openTime} - {row.closeTime}
                </div>
                {row.breakStart && row.breakEnd && (
                  <div className="text-sm text-gray-700">
                    Break: {row.breakStart} - {row.breakEnd}
                  </div>
                )}
              </div>
              <button className="btn-secondary" onClick={() => deleteRow(row.id)}>
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
