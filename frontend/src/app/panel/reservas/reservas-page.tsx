"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";

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

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

const statusClasses: Record<string, string> = {
  confirmed: "text-green-200 bg-green-500/15 border-green-300/30",
  pending: "text-amber-200 bg-amber-500/15 border-amber-300/30",
  cancelled: "text-red-200 bg-red-500/15 border-red-300/30",
};

const statusLabels: Record<string, string> = {
  confirmed: "Confirmada",
  pending: "Pendiente",
  cancelled: "Cancelada",
};

export default function ReservasScreen() {
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
        setError("No se pudieron cargar los negocios");
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
        setError("No se pudieron cargar las reservas");
      } finally {
        setLoading(false);
      }
    };
    loadBookings();
  }, [selectedBusinessId]);

  const cancelBooking = async (id: string) => {
    await api.patch(`/bookings/${id}/cancel`);
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)),
    );
  };

  const sortedBookings = useMemo(
    () =>
      [...bookings].sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime() ||
          a.startTime.localeCompare(b.startTime),
      ),
    [bookings],
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-slate-400">Panel</p>
          <h1 className="text-3xl font-semibold text-white">Reservas</h1>
          <p className="text-slate-400">
            Revisa y gestiona las reservas de tus negocios en un solo lugar.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-200/80">Negocio</label>
          <Select
            aria-label="Selecciona un negocio"
            value={selectedBusinessId}
            onChange={(e) => setSelectedBusinessId(e.target.value)}
            className="w-56"
          >
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {error && (
        <div className="text-red-200 text-sm rounded-2xl border border-red-400/30 bg-red-500/10 px-3 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <Card className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </Card>
      ) : sortedBookings.length === 0 ? (
        <div className="card text-sm text-slate-300">No hay reservas.</div>
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.04 } } }}
          className="space-y-3"
        >
          {sortedBookings.map((booking) => (
            <motion.div
              key={booking.id}
              variants={fadeUp}
              className="card flex flex-col md:flex-row md:items-center md:justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-semibold text-white">
                    {booking.clientName}
                  </span>
                  <Badge className="border-white/10 bg-white/10 text-slate-100">
                    {booking.clientPhone}
                  </Badge>
                  <Badge
                    className={`border ${
                      statusClasses[booking.status] || "text-slate-200 bg-white/10 border-white/15"
                    }`}
                  >
                    {statusLabels[booking.status] || booking.status}
                  </Badge>
                </div>
                <div className="text-sm text-slate-200">
                  {new Date(booking.date).toLocaleDateString("es-ES", {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })} {" "}· {booking.startTime} · {booking.service?.name || "Servicio"}
                </div>
              </div>
              {booking.status !== "cancelled" && (
                <Button
                  onClick={() => cancelBooking(booking.id)}
                  variant="secondary"
                  className="self-start md:self-auto"
                  aria-label="Cancelar reserva"
                >
                  Cancelar
                </Button>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
