"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Input } from "@/components/ui/Input";
import { FormFeedback } from "@/components/ui/FormFeedback";
import { Trash2 } from "lucide-react";

interface Business {
  id: string;
  name: string;
  logoUrl?: string | null;
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
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

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

  const selectedBusiness = useMemo(
    () => businesses.find((b) => b.id === selectedBusinessId) || null,
    [businesses, selectedBusinessId],
  );

  const formatDate = (iso: string) => {
    const dateOnly = iso.split("T")[0] ?? iso;
    const [y, m, d] = dateOnly.split("-").map(Number);
    const utc = new Date(Date.UTC(y, m - 1, d));
    return utc.toLocaleDateString("es-ES", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  };

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

  const openCancel = (booking: Booking) => {
    setCancelTarget(booking);
    setCancelReason("");
    setCancelError(null);
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelLoading(true);
    setCancelError(null);
    try {
      await api.patch(`/bookings/${cancelTarget.id}/cancel`, {
        reason: cancelReason.trim() || undefined,
      });
      setBookings((prev) =>
        prev.map((b) =>
          b.id === cancelTarget.id ? { ...b, status: "cancelled" } : b,
        ),
      );
      setCancelTarget(null);
      setCancelReason("");
    } catch (err: unknown) {
      const message =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response
          ?.data?.message === "string"
          ? (err as { response: { data: { message: string } } }).response.data
              .message
          : "No se pudo cancelar la reserva";
      setCancelError(message);
    } finally {
      setCancelLoading(false);
    }
  };

  const sortedBookings = useMemo(
    () =>
      [...bookings].sort(
        (a, b) =>
          (b.date.split("T")[0] ?? b.date).localeCompare(
            a.date.split("T")[0] ?? a.date,
          ) ||
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
          <div className="flex items-center gap-2">
            {selectedBusiness?.logoUrl ? (
              <img
                src={selectedBusiness.logoUrl}
                alt="Logo"
                className="h-8 w-8 rounded-lg object-cover border border-white/10 bg-white/5"
              />
            ) : null}
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
                  {formatDate(booking.date)} · {booking.startTime} ·{" "}
                  {booking.service?.name || "Servicio"}
                </div>
              </div>
              {booking.status !== "cancelled" && (
                <Button
                  onClick={() => openCancel(booking)}
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

      <AnimatePresence>
        {cancelTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur"
            onClick={() => {
              if (cancelLoading) return;
              setCancelTarget(null);
              setCancelReason("");
              setCancelError(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ type: "spring", stiffness: 220, damping: 20 }}
              className="w-full max-w-lg rounded-3xl bg-slate-900/80 border border-white/10 shadow-2xl shadow-red-500/15 p-6 space-y-4"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500/10 border border-red-400/20">
                    <Trash2 className="h-5 w-5 text-red-200" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-semibold text-white">
                      Cancelar reserva
                    </h2>
                    <p className="text-sm text-slate-300">
                      {cancelTarget.clientName} · {cancelTarget.clientPhone} ·{" "}
                      {formatDate(cancelTarget.date)} ·{" "}
                      {cancelTarget.startTime}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    if (cancelLoading) return;
                    setCancelTarget(null);
                    setCancelReason("");
                    setCancelError(null);
                  }}
                  variant="ghost"
                  className="text-sm"
                >
                  Cerrar
                </Button>
              </div>

              {cancelError && (
                <FormFeedback variant="error" message={cancelError} />
              )}

              <div className="space-y-2">
                <label className="block text-sm text-slate-200">
                  Motivo (opcional)
                </label>
                <Input
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Ej: No vamos a abrir hoy por mantenimiento"
                />
                <p className="text-xs text-slate-400">
                  Se le enviará un WhatsApp al cliente con el motivo.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  onClick={() => {
                    if (cancelLoading) return;
                    setCancelTarget(null);
                    setCancelReason("");
                    setCancelError(null);
                  }}
                  variant="secondary"
                  className="flex-1"
                >
                  Volver
                </Button>
                <Button
                  type="button"
                  onClick={confirmCancel}
                  disabled={cancelLoading}
                  variant="secondary"
                  className="flex-1 border border-red-400/40 bg-red-500/15 text-red-100 hover:bg-red-500/25"
                >
                  {cancelLoading ? "Cancelando..." : "Cancelar reserva"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
