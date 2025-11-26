"use client";

import { FormEvent, useEffect, useState } from "react";
import api from "@/lib/api";
import { businessSchema } from "@/lib/validations";

interface Business {
  id: string;
  name: string;
  slug: string;
  timezone: string;
}

export default function SettingsPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
  const [form, setForm] = useState<Business | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
    const loadBusiness = async () => {
      try {
        const res = await api.get(`/business/${selectedBusinessId}`);
        setForm(res.data);
      } catch {
        setError("Unable to load business details");
      }
    };
    loadBusiness();
  }, [selectedBusinessId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setError(null);
    setSuccess(null);
    const parsed = businessSchema.safeParse({
      name: form.name,
      slug: form.slug,
      timezone: form.timezone,
    });
    if (!parsed.success) {
      setError("Please check the business fields.");
      return;
    }
    try {
      await api.patch(`/business/${selectedBusinessId}`, parsed.data);
      setSuccess("Business updated");
    } catch {
      setError("Unable to update business");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
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
      {success && <div className="text-green-600 text-sm">{success}</div>}

      {form && (
        <form onSubmit={handleSubmit} className="card space-y-4 max-w-xl">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Name</label>
            <input
              className="input-field"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Slug</label>
            <input
              className="input-field"
              value={form.slug}
              onChange={(e) =>
                setForm({
                  ...form,
                  slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                })
              }
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Timezone</label>
            <select
              className="input-field"
              value={form.timezone}
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
            >
              <option value="America/Argentina/Buenos_Aires">America/Argentina/Buenos_Aires</option>
              <option value="America/Mexico_City">America/Mexico_City</option>
              <option value="America/Bogota">America/Bogota</option>
            </select>
          </div>
          <button type="submit" className="btn-primary">
            Save changes
          </button>
        </form>
      )}
    </div>
  );
}
