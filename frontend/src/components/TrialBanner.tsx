"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

type BillingAccess = {
  trial: {
    isActive: boolean;
    daysLeft: number;
    isExpired: boolean;
  };
  effectivePlanId: string;
};

type Business = { id: string; name: string };

export default function TrialBanner() {
  const [access, setAccess] = useState<BillingAccess | null>(null);
  const [noBusiness, setNoBusiness] = useState(false);

  useEffect(() => {
    const resolveBusinessId = async (): Promise<string> => {
      const stored = localStorage.getItem("activeBusinessId");
      if (stored) return stored;

      const res = await api.get("/business");
      const list = Array.isArray(res.data)
        ? res.data
        : (res.data as { data?: unknown }).data;
      const normalized = Array.isArray(list) ? (list as Business[]) : [];
      const firstId = normalized[0]?.id || "";
      if (firstId) localStorage.setItem("activeBusinessId", firstId);
      return firstId;
    };

    const load = async () => {
      try {
        const businessId = await resolveBusinessId();
        if (!businessId) {
          setNoBusiness(true);
          return;
        }
        const res = await api.get(`/billing/subscription/${businessId}`);
        setAccess(res.data as BillingAccess);
      } catch {
        setAccess(null);
      }
    };

    load();
  }, []);

  if (noBusiness) {
    return (
      <div className="mb-6">
        <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 flex items-center justify-between gap-3">
          <div>
            No tenés acceso a ningún negocio. Pedile al owner que reactive el
            plan Pro.
          </div>
          <Link href="/panel/planes" className="btn-secondary !h-9 !px-3">
            Ver planes
          </Link>
        </div>
      </div>
    );
  }

  if (!access) return null;

  if (access.trial.isActive) {
    return (
      <div className="mb-6">
        <div className="rounded-2xl border border-indigo-400/30 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-100 flex items-center justify-between gap-3">
          <div>
            Prueba Pro activa: te quedan{" "}
            <span className="font-semibold">{access.trial.daysLeft}</span>{" "}
            día(s).
          </div>
          <Link href="/panel/planes" className="btn-secondary !h-9 !px-3">
            Ver planes
          </Link>
        </div>
      </div>
    );
  }

  if (access.trial.isExpired && access.effectivePlanId === "plan_basic") {
    return (
      <div className="mb-6">
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100 flex items-center justify-between gap-3">
          <div>
            Tu prueba Pro terminó. Se aplican límites del plan Básico (menos
            servicios/personal, sin Analytics, sin Exportación CSV, sin pausas ni
            días especiales).
          </div>
          <Link href="/panel/planes" className="btn-secondary !h-9 !px-3">
            Actualizar plan
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
