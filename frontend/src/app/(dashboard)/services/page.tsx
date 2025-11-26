"use client";

import { FormEvent, useEffect, useState } from "react";
import api from "@/lib/api";
import { serviceSchema } from "@/lib/validations";

interface Business {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  cleaningTimeMinutes: number;
  price: number;
}

const emptyService = {
  name: "",
  durationMinutes: 30,
  cleaningTimeMinutes: 0,
  price: 0,
};

export default function ServicesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState(emptyService);
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
    const loadServices = async () => {
      try {
        const res = await api.get(`/services/${selectedBusinessId}`);
        setServices(res.data);
      } catch {
        setError("Unable to load services");
      }
    };
    loadServices();
  }, [selectedBusinessId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = serviceSchema.safeParse({
      ...form,
      businessId: selectedBusinessId,
    });
    if (!parsed.success) {
      setError("Please check the service fields.");
      return;
    }

    try {
      await api.post("/services", parsed.data);
      setForm(emptyService);
      const res = await api.get(`/services/${selectedBusinessId}`);
      setServices(res.data);
    } catch {
      setError("Unable to save service");
    }
  };

  const deleteService = async (id: string) => {
    await api.delete(`/services/${id}`);
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Services</h1>
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

      <form onSubmit={handleSubmit} className="card grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Duration (min)</label>
          <input
            type="number"
            value={form.durationMinutes}
            onChange={(e) =>
              setForm({ ...form, durationMinutes: Number(e.target.value) })
            }
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Cleaning (min)</label>
          <input
            type="number"
            value={form.cleaningTimeMinutes}
            onChange={(e) =>
              setForm({ ...form, cleaningTimeMinutes: Number(e.target.value) })
            }
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Price</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              className="input-field flex-1"
              required
            />
            <button type="submit" className="btn-primary whitespace-nowrap">
              Save
            </button>
          </div>
        </div>
      </form>

      <div className="space-y-3">
        {services.length === 0 ? (
          <div className="text-sm text-gray-600">No services created yet.</div>
        ) : (
          services.map((service) => (
            <div
              key={service.id}
              className="card flex items-center justify-between gap-3"
            >
              <div>
                <div className="font-semibold text-gray-900">
                  {service.name}
                </div>
                <div className="text-sm text-gray-700">
                  {service.durationMinutes} min + {service.cleaningTimeMinutes} min · $
                  {service.price}
                </div>
              </div>
              <button
                className="btn-secondary"
                onClick={() => deleteService(service.id)}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
