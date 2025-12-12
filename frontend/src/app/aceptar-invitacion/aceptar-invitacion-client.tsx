"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormFeedback } from "@/components/ui/FormFeedback";
import { Input } from "@/components/ui/Input";

export default function AceptarInvitacionClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (!token) return;
    const accept = async () => {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setNeedsPassword(false);
      try {
        await api.post("/staff/accept-invite", { token });
        setSuccess("Invitación aceptada. Ya podés iniciar sesión.");
      } catch (err: unknown) {
        const message =
          typeof err === "object" &&
          err !== null &&
          "response" in err &&
          typeof (err as { response?: { data?: { message?: string } } }).response
            ?.data?.message === "string"
            ? (err as { response: { data: { message: string } } }).response.data
                .message
            : "No se pudo aceptar la invitación.";
        setError(message);
        setNeedsPassword(message.toLowerCase().includes("contrase"));
      } finally {
        setLoading(false);
      }
    };
    accept();
  }, [token]);

  const submitWithPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.post("/staff/accept-invite", {
        token,
        password,
        name: name.trim() || undefined,
      });
      setSuccess("Invitación aceptada. Ya podés iniciar sesión.");
      setNeedsPassword(false);
    } catch (err: unknown) {
      const message =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response
          ?.data?.message === "string"
          ? (err as { response: { data: { message: string } } }).response.data
              .message
          : "No se pudo aceptar la invitación.";
      setError(message);
      setNeedsPassword(message.toLowerCase().includes("contrase"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-semibold text-white">
          Aceptar invitación
        </h1>
        {!token && (
          <FormFeedback variant="error" message="Falta el token de invitación." />
        )}
        {error && <FormFeedback variant="error" message={error} />}
        {success && <FormFeedback variant="success" message={success} />}

        {needsPassword && !success && (
          <form onSubmit={submitWithPassword} className="space-y-3 text-left">
            <div className="space-y-1">
              <label className="text-sm text-slate-200">Nombre (opcional)</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-200">Contraseña</label>
              <Input
                type="password"
                minLength={6}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Procesando..." : "Aceptar invitación"}
            </Button>
          </form>
        )}

        <div className="pt-2 flex justify-center">
          <Button
            className="w-full"
            disabled={loading || !success}
            onClick={() => (window.location.href = "/inicio-sesion")}
          >
            {loading ? "Procesando..." : "Ir a iniciar sesión"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
