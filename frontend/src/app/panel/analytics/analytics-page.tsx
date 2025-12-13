"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { FormFeedback } from "@/components/ui/FormFeedback";
import { BarChart3, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface Business {
  id: string;
  name: string;
  logoUrl?: string | null;
}

interface PopularService {
  name?: string | null;
  count: number;
}

interface StatusGroup {
  status: string;
  _count: { status: number };
}

interface AnalyticsData {
  totalBookings: number;
  popularServices: PopularService[];
  cancellationRate: number;
  byStatus: StatusGroup[];
}

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

const statusLabels: Record<string, string> = {
  confirmed: "Confirmada",
  pending: "Pendiente",
  cancelled: "Cancelada",
};

export default function AnalyticsScreen() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getErrorMessage = (err: unknown, fallback: string) => {
    const message =
      typeof err === "object" &&
      err !== null &&
      "response" in err &&
      typeof (err as { response?: { data?: { message?: string } } }).response
        ?.data?.message === "string"
        ? (err as { response: { data: { message: string } } }).response.data
            .message
        : null;
    return message || fallback;
  };

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
      } catch (err: unknown) {
        setError("No se pudieron cargar los negocios.");
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
    const loadAnalytics = async () => {
      setLoadingData(true);
      setError(null);
      try {
        const res = await api.get(`/analytics/${selectedBusinessId}`);
        setData(res.data);
      } catch (err: unknown) {
        setData(null);
        setError(getErrorMessage(err, "No se pudieron cargar las estadísticas."));
      } finally {
        setLoadingData(false);
      }
    };
    loadAnalytics();
  }, [selectedBusinessId]);

  const byStatus = useMemo(() => {
    if (!data) return [];
    return [...data.byStatus].sort((a, b) =>
      a.status.localeCompare(b.status),
    );
  }, [data]);

  const selectedBusiness = useMemo(
    () => businesses.find((b) => b.id === selectedBusinessId) || null,
    [businesses, selectedBusinessId],
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-slate-400">Panel</p>
          <h1 className="text-3xl font-semibold text-white">Analytics</h1>
          <p className="text-slate-400">
            Rendimiento general y servicios más reservados.
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
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
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

      {loadingBusinesses || loadingData || !data ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="space-y-2">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-8 w-1/3" />
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <BarChart3 className="w-4 h-4 text-indigo-300" />
                Total de reservas
              </div>
              <div className="text-3xl font-semibold text-white">
                {data.totalBookings}
              </div>
            </Card>

            <Card className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <TrendingUp className="w-4 h-4 text-indigo-300" />
                Tasa de cancelación
              </div>
              <div className="text-3xl font-semibold text-white">
                {data.cancellationRate.toFixed(1)}%
              </div>
            </Card>

            <Card className="space-y-2">
              <div className="text-sm text-slate-300">
                Reservas por estado
              </div>
              <div className="space-y-1 text-sm">
                {byStatus.map((s) => (
                  <div key={s.status} className="flex justify-between">
                    <span className="text-slate-200">
                      {statusLabels[s.status] || s.status}
                    </span>
                    <span className="text-white font-semibold">
                      {s._count.status}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.04 } } }}
            className="space-y-3 max-w-3xl"
          >
            <Card className="space-y-3">
              <h2 className="text-lg font-semibold text-white">
                Servicios más reservados
              </h2>
              {data.popularServices.length === 0 ? (
                <div className="text-sm text-slate-300">
                  No hay reservas aún.
                </div>
              ) : (
                <div className="space-y-2">
                  {data.popularServices.map((svc, i) => (
                    <motion.div
                      key={`${svc.name}-${i}`}
                      variants={fadeUp}
                      className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 border border-white/10"
                    >
                      <div className="text-slate-100">
                        {svc.name || "Servicio"}
                      </div>
                      <div className="chip text-xs">
                        {svc.count} reservas
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        </>
      )}
    </div>
  );
}
