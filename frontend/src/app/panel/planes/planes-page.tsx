"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { FormFeedback } from "@/components/ui/FormFeedback";
import { CheckCircle2, Sparkles } from "lucide-react";
import ElectroBorder from "@/components/ui/electro-border";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

interface Business {
  id: string;
  name: string;
  ownerId?: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  limits: Record<string, number>;
}

interface Subscription {
  id: string;
  planId: string;
  status: string;
  plan: Plan;
}

type BillingAccess = {
  subscription: Subscription | null;
  trial: {
    daysTotal: number;
    endsAt: string;
    isActive: boolean;
    daysLeft: number;
    isExpired: boolean;
  };
  effectivePlan: Plan;
  effectivePlanId: string;
};

const limitLabels: Record<string, string> = {
  maxStaff: "Personal (Staff)",
  maxServices: "Servicios",
  maxBookingsPerMonth: "Reservas/mes",
};

export default function PlanesScreen() {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [access, setAccess] = useState<BillingAccess | null>(null);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingSub, setLoadingSub] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
      } catch {
        setError("No se pudieron cargar los negocios.");
      } finally {
        setLoadingBusinesses(false);
      }
    };

    const loadPlans = async () => {
      setLoadingPlans(true);
      try {
        const res = await api.get("/billing/plans");
        const list = Array.isArray(res.data)
          ? res.data
          : (res.data as { data?: unknown }).data;
        setPlans(Array.isArray(list) ? (list as Plan[]) : []);
      } catch {
        setError("No se pudieron cargar los planes.");
      } finally {
        setLoadingPlans(false);
      }
    };

    loadBusinesses();
    loadPlans();
  }, []);

  useEffect(() => {
    if (!selectedBusinessId) return;
    localStorage.setItem("activeBusinessId", selectedBusinessId);
  }, [selectedBusinessId]);

  useEffect(() => {
    if (!selectedBusinessId) return;
    const loadSubscription = async () => {
      setLoadingSub(true);
      setError(null);
      try {
        const res = await api.get(`/billing/subscription/${selectedBusinessId}`);
        setAccess(res.data as BillingAccess);
      } catch {
        setAccess(null);
      } finally {
        setLoadingSub(false);
      }
    };
    loadSubscription();
  }, [selectedBusinessId]);

  const viewerIsOwner = useMemo(() => {
    const selected = businesses.find((b) => b.id === selectedBusinessId);
    return !!(user?.id && selected?.ownerId && selected.ownerId === user.id);
  }, [businesses, selectedBusinessId, user?.id]);

  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => a.price - b.price),
    [plans],
  );

  const changePlan = async (planId: string) => {
    if (!selectedBusinessId) return;
    if (!viewerIsOwner) {
      setError("Solo el owner del negocio puede administrar el plan.");
      return;
    }
    setSaving(planId);
    setError(null);
    setSuccess(null);
    try {
      await api.patch(`/billing/subscription/${selectedBusinessId}`, { planId });
      const refreshed = await api.get(
        `/billing/subscription/${selectedBusinessId}`,
      );
      setAccess(refreshed.data as BillingAccess);
      setSuccess("Plan actualizado correctamente.");
    } catch (err: unknown) {
      const message =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response
          ?.data?.message === "string"
          ? (err as { response: { data: { message: string } } }).response.data
              .message
          : "No se pudo actualizar el plan.";
      setError(message);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-slate-400">Billing</p>
          <h1 className="text-3xl font-semibold text-white">Planes</h1>
          <p className="text-slate-400">
            Elegí el plan que mejor se adapta a tu negocio.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-200/80">Negocio</label>
          <Select
            value={selectedBusinessId}
            onChange={(e) => setSelectedBusinessId(e.target.value)}
            className="w-56"
            disabled={loadingBusinesses || businesses.length === 0}
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

      {error && <FormFeedback variant="error" message={error} />}
      {success && <FormFeedback variant="success" message={success} />}

      {!loadingBusinesses && businesses.length === 0 && (
        <Card className="space-y-2">
          <p className="text-sm text-slate-200">
            Para elegir un plan necesitás tener un negocio propio.
          </p>
          <p className="text-sm text-slate-400">
            Si sos staff en un negocio, el plan lo administra el owner. Podés
            crear tu negocio y contratar Pro aparte.
          </p>
          <div className="flex gap-2">
            <Link href="/panel?create=1" className="btn-primary">
              Crear mi negocio
            </Link>
            <Link href="/panel" className="btn-secondary">
              Volver al panel
            </Link>
          </div>
        </Card>
      )}

      {!viewerIsOwner && selectedBusinessId && (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Estás como staff. El plan Pro/Básico pertenece al negocio y lo
          administra el owner.
        </div>
      )}

      {access?.trial?.isActive && (
        <FormFeedback
          variant="success"
          message={
            viewerIsOwner
              ? `Tenés prueba Pro gratis activa: te quedan ${access.trial.daysLeft} día(s).`
              : `El negocio tiene prueba Pro activa (beneficios Pro habilitados por el owner): quedan ${access.trial.daysLeft} día(s).`
          }
        />
      )}

      {access?.trial?.isExpired && (
        <FormFeedback
          variant="error"
          message={
            viewerIsOwner
              ? "Tu prueba Pro terminó. Se activaron límites del plan Básico (personal, servicios y reservas/mes)."
              : "El negocio está en Básico por falta de pago del owner. Se activaron límites (personal, servicios y reservas/mes)."
          }
        />
      )}

      {(loadingPlans || loadingSub) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="space-y-2">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-9 w-full" />
            </Card>
          ))}
        </div>
      )}

      {!loadingPlans && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sortedPlans.map((plan) => {
            const effectivePlanId = access?.effectivePlanId ?? "";
            const isCurrent = effectivePlanId === plan.id;
            const isTrialPro = access?.trial?.isActive && plan.id === "plan_pro";
            const isPaidCurrent =
              access?.subscription?.status === "ACTIVE" &&
              access.subscription.planId === plan.id;
            const limitsEntries = Object.entries(plan.limits || {});
            const accent = plan.id === "plan_pro" ? "#8b5cf6" : "#22d3ee";
            return (
              <ElectroBorder
                key={plan.id}
                borderColor={accent}
                borderWidth={2}
                distortion={plan.id === "plan_pro" ? 1.2 : 0.9}
                animationSpeed={plan.id === "plan_pro" ? 1.0 : 0.7}
                glowBlur={36}
                radius={24}
              >
                <Card
                  className={`space-y-4 h-full border-0 hover:border-0 shadow-none hover:shadow-none ${
                    isCurrent ? "bg-indigo-500/5" : "bg-white/5"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-white">
                        {plan.name}
                      </h2>
                      {isCurrent && (
                        <span className="chip bg-indigo-500/15 text-indigo-100 border-indigo-400/30">
                          {isTrialPro ? (
                            <>
                              <Sparkles className="w-3 h-3" /> En prueba
                            </>
                          ) : (
                            "Actual"
                          )}
                        </span>
                      )}
                    </div>
                    <div className="text-3xl font-semibold text-white">
                      {plan.currency} {plan.price.toFixed(2)}
                      <span className="text-sm text-slate-300 font-normal">
                        {" "}/mes
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {limitsEntries.length === 0 ? (
                      <div className="text-slate-300">Sin límites.</div>
                    ) : (
                      limitsEntries.map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-slate-200">
                            {limitLabels[key] || key}
                          </span>
                          <span className="text-white font-semibold">
                            {value < 0 ? "Ilimitado" : value}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  <Button
                    onClick={() => changePlan(plan.id)}
                    disabled={saving !== null || isPaidCurrent || !viewerIsOwner}
                    className="w-full"
                    variant={isCurrent ? "secondary" : "primary"}
                  >
                    {!viewerIsOwner ? (
                      "Solo el owner puede cambiar"
                    ) : isPaidCurrent ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Plan actual
                      </>
                    ) : isCurrent ? (
                      "Plan en prueba"
                    ) : saving === plan.id ? (
                      "Actualizando..."
                    ) : (
                      "Elegir plan"
                    )}
                  </Button>
                </Card>
              </ElectroBorder>
            );
          })}
        </div>
      )}

      {!loadingPlans && plans.length === 0 && (
        <Card className="text-sm text-slate-300">No hay planes configurados.</Card>
      )}
    </div>
  );
}
