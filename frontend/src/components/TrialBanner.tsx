"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

type BillingAccess = {
  trial: {
    isActive: boolean;
    daysLeft: number;
    isExpired: boolean;
  };
  effectivePlanId: string;
};

type Business = { id: string; name: string; ownerId?: string };
type LostMembership = {
  businessId: string;
  businessName: string;
  role: string;
  reason: "PAYMENT_REQUIRED";
};

export default function TrialBanner() {
  const { user } = useAuth();
  const [access, setAccess] = useState<BillingAccess | null>(null);
  const [noBusiness, setNoBusiness] = useState(false);
  const [lost, setLost] = useState<LostMembership[]>([]);
  const [viewerIsOwner, setViewerIsOwner] = useState<boolean | null>(null);
  const [showLostBanner, setShowLostBanner] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const businessRes = await api.get("/business");
        const list = Array.isArray(businessRes.data)
          ? businessRes.data
          : (businessRes.data as { data?: unknown }).data;
        const normalized = Array.isArray(list) ? (list as Business[]) : [];

        if (normalized.length === 0) {
          localStorage.removeItem("activeBusinessId");
          setNoBusiness(true);
          setViewerIsOwner(null);
          setAccess(null);
          try {
            const lostRes = await api.get("/business/lost-memberships");
            const lostList = Array.isArray(lostRes.data)
              ? (lostRes.data as LostMembership[])
              : [];
            setLost(lostList);
          } catch {
            setLost([]);
          }
          return;
        }

        setNoBusiness(false);
        setLost([]);

        const stored = localStorage.getItem("activeBusinessId");
        const businessId =
          (stored && normalized.some((b) => b.id === stored) && stored) ||
          normalized[0].id;
        localStorage.setItem("activeBusinessId", businessId);

        const selected = normalized.find((b) => b.id === businessId);
        setViewerIsOwner(
          !!(user?.id && selected?.ownerId && selected.ownerId === user.id),
        );

        const res = await api.get(`/billing/subscription/${businessId}`);
        setAccess(res.data as BillingAccess);
      } catch {
        setAccess(null);
      }
    };

    load();
  }, [user?.id]);

  useEffect(() => {
    if (!noBusiness) {
      setShowLostBanner(false);
      return;
    }

    const first = lost[0];
    if (!first) {
      setShowLostBanner(false);
      return;
    }

    const seenKey = `lostMembershipSeen:${first.businessId}`;
    const alreadySeen = localStorage.getItem(seenKey) === "1";
    if (alreadySeen) {
      setShowLostBanner(false);
      return;
    }

    localStorage.setItem(seenKey, "1");
    setShowLostBanner(true);
    const t = window.setTimeout(() => setShowLostBanner(false), 8000);
    return () => window.clearTimeout(t);
  }, [noBusiness, lost]);

  if (noBusiness) {
    const first = lost[0];
    if (!first || !showLostBanner) return null;

    return (
      <div className="mb-6">
        <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 flex items-center justify-between gap-3">
          <div>
            {`Perdiste acceso al negocio "${first.businessName}" por falta de pago del plan Pro del owner.`}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-secondary !h-9 !px-3 min-w-[110px]"
              onClick={() => setShowLostBanner(false)}
            >
              Entendido
            </button>
            <Link
              href="/panel/planes"
              className="btn-secondary !h-9 !px-3 min-w-[110px]"
              onClick={() => setShowLostBanner(false)}
            >
              Ver planes
            </Link>
          </div>
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
            {viewerIsOwner === false
              ? "El negocio tiene Prueba Pro activa (beneficios Pro habilitados por el owner):"
              : "Prueba Pro activa:"}{" "}
            te quedan <span className="font-semibold">{access.trial.daysLeft}</span>{" "}
            día(s).
          </div>
          <Link
            href="/panel/planes"
            className="btn-secondary !h-9 !px-3 min-w-[110px]"
          >
            Ver planes
          </Link>
        </div>
      </div>
    );
  }

  if (access.trial.isExpired && access.effectivePlanId === "plan_basic") {
    const message =
      viewerIsOwner === false
        ? "El negocio pasó al plan Básico por falta de pago del owner. Se aplican límites (menos servicios/personal, sin Analytics, sin Exportación CSV, sin pausas ni días especiales)."
        : "Tu prueba Pro terminó. Se aplican límites del plan Básico (menos servicios/personal, sin Analytics, sin Exportación CSV, sin pausas ni días especiales).";
    const cta = viewerIsOwner === false ? "Ver planes" : "Actualizar plan";

    return (
      <div className="mb-6">
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100 flex items-center justify-between gap-3">
          <div>{message}</div>
          <Link
            href="/panel/planes"
            className="btn-secondary !h-9 !px-3 min-w-[120px]"
          >
            {cta}
          </Link>
        </div>
      </div>
    );
  }

  return null;
}

