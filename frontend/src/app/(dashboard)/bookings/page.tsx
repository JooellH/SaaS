"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

interface Business {
  id: string;
  name: string;
}

interface Booking {
  id: string;
  clientName: string;
  clientPhone: string;
  date: string;
  startTime: string;
  status: string;
  service?: { name: string };
}

export default function BookingsPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBusinesses = async () => {
      try {
        const res = await api.get("/business");
        setBusinesses(res.data);
        if (res.data.length > 0) {
          setSelectedBusinessId(res.data[0].id);
        }
      } catch (e) {
        setError("Unable to load businesses");
      }
    };
    loadBusinesses();
  }, []);

  useEffect(() => {
    if (!selectedBusinessId) return;
    const loadBookings = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/bookings/${selectedBusinessId}`);
        setBookings(res.data);
      } catch (e) {
        setError("Unable to load bookings");
      } finally {
        setLoading(false);
      }
    };
    loadBookings();
  }, [selectedBusinessId]);

  const cancelBooking = async (id: string) => {
    await api.patch(`/bookings/${id}/cancel`);
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Bookings</h1>
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

      {loading ? (
        <div className="text-sm text-gray-600">Loading bookings...</div>
      ) : bookings.length === 0 ? (
        <div className="text-sm text-gray-600">No bookings found.</div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="card flex flex-col md:flex-row md:items-center md:justify-between gap-3"
            >
              <div>
                <div className="font-semibold text-gray-900">
                  {booking.clientName} ({booking.clientPhone})
                </div>
                <div className="text-sm text-gray-700">
                  {new Date(booking.date).toLocaleDateString()} at{" "}
                  {booking.startTime} · {booking.service?.name || "Service"}
                </div>
                <div className="text-xs uppercase text-gray-500">
                  Status: {booking.status}
                </div>
              </div>
              {booking.status !== "cancelled" && (
                <button
                  onClick={() => cancelBooking(booking.id)}
                  className="btn-secondary self-start md:self-auto"
                >
                  Cancel booking
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
