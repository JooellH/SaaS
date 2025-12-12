"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { FormFeedback } from "@/components/ui/FormFeedback";
import { Skeleton } from "@/components/ui/Skeleton";
import { Copy, Plus, Trash2, UserCheck, Users } from "lucide-react";

interface Business {
  id: string;
  name: string;
  ownerId?: string;
}

interface Staff {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  status: string;
  inviteToken?: string | null;
}

type BillingAccess = {
  effectivePlanId: string;
};

export default function PersonalScreen() {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
  const [staff, setStaff] = useState<Staff[]>([]);
  const [access, setAccess] = useState<BillingAccess | null>(null);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [loadingAccess, setLoadingAccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [origin, setOrigin] = useState<string>("");
  const [lastInviteToken, setLastInviteToken] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    setOrigin(typeof window !== "undefined" ? window.location.origin : "");
  }, []);

  useEffect(() => {
    const loadBusinesses = async () => {
      setLoadingBusinesses(true);
      setError(null);
      try {
        const res = await api.get("/business");
        const list = Array.isArray(res.data)
          ? res.data
          : (res.data as { data?: unknown }).data;
        const normalized = Array.isArray(list) ? (list as Business[]) : [];

        const owned =
          user?.id ? normalized.filter((b) => b.ownerId === user.id) : [];
        setBusinesses(owned);

        const active = localStorage.getItem("activeBusinessId");
        const nextId =
          (active && owned.some((b) => b.id === active) && active) ||
          owned[0]?.id ||
          "";
        setSelectedBusinessId(nextId);
      } catch {
        setError("No se pudieron cargar los negocios.");
        setBusinesses([]);
        setSelectedBusinessId("");
      } finally {
        setLoadingBusinesses(false);
      }
    };

    loadBusinesses();
  }, [user?.id]);

  useEffect(() => {
    if (!selectedBusinessId) return;
    localStorage.setItem("activeBusinessId", selectedBusinessId);
  }, [selectedBusinessId]);

  useEffect(() => {
    if (!selectedBusinessId) return;

    const loadAccess = async () => {
      setLoadingAccess(true);
      try {
        const res = await api.get(`/billing/subscription/${selectedBusinessId}`);
        setAccess(res.data as BillingAccess);
      } catch {
        setAccess(null);
      } finally {
        setLoadingAccess(false);
      }
    };

    const loadStaff = async () => {
      setLoadingStaff(true);
      setError(null);
      try {
        const res = await api.get(`/business/${selectedBusinessId}/staff`);
        const list = Array.isArray(res.data)
          ? res.data
          : (res.data as { data?: unknown }).data;
        setStaff(Array.isArray(list) ? (list as Staff[]) : []);
      } catch {
        setError("No se pudo cargar el personal.");
      } finally {
        setLoadingStaff(false);
      }
    };

    loadAccess();
    loadStaff();
  }, [selectedBusinessId]);

  const proEnabled = access?.effectivePlanId === "plan_pro";

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedBusinessId) return;
    if (!proEnabled) {
      setError("Personal está disponible solo en el plan Pro.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    setLastInviteToken(null);

    try {
      const res = await api.post(`/business/${selectedBusinessId}/staff`, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
      });
      setStaff((prev) => [res.data, ...prev]);
      setLastInviteToken(res.data?.inviteToken || null);
      setForm({ name: "", email: "", phone: "" });
      setSuccess("Invitación creada. Compartí el link con tu equipo.");
    } catch (err: unknown) {
      const message =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response
          ?.data?.message === "string"
          ? (err as { response: { data: { message: string } } }).response.data
              .message
          : "No se pudo crear la invitación.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const deleteStaff = async (staffId: string) => {
    if (!proEnabled) {
      setError("Para eliminar personal necesitás el plan Pro.");
      return;
    }
    if (!confirm("¿Eliminar este miembro del personal?")) return;
    try {
      await api.delete(`/business/${selectedBusinessId}/staff/${staffId}`);
      setStaff((prev) => prev.filter((s) => s.id !== staffId));
    } catch {
      setError("No se pudo eliminar el miembro.");
    }
  };

  const sortedStaff = useMemo(
    () => [...staff].sort((a, b) => a.name.localeCompare(b.name, "es")),
    [staff],
  );

  const copyInviteLink = async (token: string) => {
    const link = `${origin}/aceptar-invitacion?token=${token}`;
    try {
      await navigator.clipboard.writeText(link);
      setSuccess("Link copiado al portapapeles.");
    } catch {
      alert(link);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-slate-400">Equipo</p>
          <h1 className="text-3xl font-semibold text-white">Personal</h1>
          <p className="text-slate-400">
            Invitá empleados para que gestionen reservas y servicios.
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

      {!loadingBusinesses && businesses.length === 0 ? (
        <Card className="max-w-3xl space-y-2">
          <div className="flex items-center gap-2 text-slate-100">
            <Users className="w-4 h-4" />
            <span className="font-semibold">Sin negocios propios</span>
          </div>
          <p className="text-sm text-slate-300">
            El personal solo se administra en negocios donde sos owner. Si sos
            staff en un negocio, el personal lo gestiona el owner.
          </p>
          <div className="flex gap-2">
            <Link href="/panel?create=1" className="btn-primary">
              Crear mi negocio
            </Link>
            <Link href="/panel/planes" className="btn-secondary">
              Ver planes
            </Link>
          </div>
        </Card>
      ) : (
        <>
          {lastInviteToken && (
            <Card className="max-w-3xl space-y-3">
              <div className="text-sm text-slate-200">
                Link de invitación (compartilo con la persona):
              </div>
              <div className="flex flex-col md:flex-row gap-2">
                <Input
                  readOnly
                  value={`${origin}/aceptar-invitacion?token=${lastInviteToken}`}
                  onFocus={(e) => e.currentTarget.select()}
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="h-12"
                  onClick={() => copyInviteLink(lastInviteToken)}
                >
                  <Copy className="w-4 h-4" />
                  Copiar
                </Button>
              </div>
            </Card>
          )}

          <Card className="space-y-4 max-w-3xl">
            <div className="flex items-center gap-3">
              <span className="chip">Nuevo miembro</span>
              <p className="text-sm text-slate-300">
                Se genera un link de invitación único.
              </p>
            </div>
            {!loadingAccess && !proEnabled && (
              <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                Bloqueado: para invitar o eliminar personal necesitás Pro.
              </div>
            )}
            <form onSubmit={handleCreate} className="form-grid md:grid-cols-4">
              <div className="space-y-2 md:col-span-1">
                <label className="block text-sm text-slate-200">Nombre</label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                  disabled={!proEnabled || loadingAccess}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm text-slate-200">Email</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  required
                  disabled={!proEnabled || loadingAccess}
                />
              </div>
              <div className="space-y-2 md:col-span-1">
                <label className="block text-sm text-slate-200">Teléfono</label>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="+54..."
                  disabled={!proEnabled || loadingAccess}
                />
              </div>
              <div className="flex items-end md:col-span-4">
                <Button
                  type="submit"
                  className="w-full h-12"
                  disabled={
                    saving ||
                    !selectedBusinessId ||
                    !proEnabled ||
                    loadingAccess
                  }
                >
                  <Plus className="w-4 h-4" />
                  {saving ? "Guardando..." : "Crear invitación"}
                </Button>
              </div>
            </form>
          </Card>

          <Card className="space-y-3 max-w-3xl">
            <h2 className="text-lg font-semibold text-white">Personal cargado</h2>

            {loadingBusinesses || loadingStaff ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ))}
              </div>
            ) : sortedStaff.length === 0 ? (
              <div className="text-sm text-slate-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                No hay personal aún.
              </div>
            ) : (
              <div className="space-y-3">
                {sortedStaff.map((member) => {
                  const inviteLink =
                    member.inviteToken && origin
                      ? `${origin}/aceptar-invitacion?token=${member.inviteToken}`
                      : null;

                  return (
                    <div
                      key={member.id}
                      className="rounded-2xl border border-white/10 bg-white/5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between px-4 py-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-indigo-300" />
                          <span className="text-base font-semibold text-white">
                            {member.name}
                          </span>
                          <span className="chip text-xs">
                            {member.role === "OWNER" ? "Owner" : "Staff"}
                          </span>
                          <span className="chip text-xs">{member.status}</span>
                        </div>
                        <div className="text-sm text-slate-300">
                          {member.email}
                          {member.phone ? ` · ${member.phone}` : ""}
                        </div>

                        {member.inviteToken && inviteLink && (
                          <div className="text-xs text-slate-300 flex items-center gap-2">
                            <span className="chip bg-amber-500/15 text-amber-100 border-amber-400/30">
                              Invitación pendiente
                            </span>
                            <button
                              type="button"
                              onClick={() => copyInviteLink(member.inviteToken!)}
                              className="btn-ghost h-8 px-2"
                            >
                              <Copy className="w-3 h-3" />
                              Copiar link
                            </button>
                          </div>
                        )}
                      </div>

                      <Button
                        variant="secondary"
                        className="text-red-200 hover:text-white self-start md:self-auto"
                        onClick={() => deleteStaff(member.id)}
                        aria-label="Eliminar personal"
                        disabled={!proEnabled || loadingAccess}
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

