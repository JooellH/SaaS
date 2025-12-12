"use client";

import { FormEvent, useEffect, useState } from "react";
import api from "@/lib/api";
import { businessSchema } from "@/lib/validations";
import { motion } from "framer-motion";
import { Save, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { FormFeedback } from "@/components/ui/FormFeedback";
import { Skeleton } from "@/components/ui/Skeleton";

interface Business {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  phoneNumber?: string | null;
  whatsappToken?: string | null;
  logoUrl?: string | null;
  brandColor?: string | null;
  bannerUrl?: string | null;
}

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

export default function AjustesScreen() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
  const [form, setForm] = useState<Business | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingBusiness, setLoadingBusiness] = useState(false);

  useEffect(() => {
    const loadBusinesses = async () => {
      try {
        const res = await api.get("/business");
        setBusinesses(res.data);
        if (res.data.length > 0) {
          setSelectedBusinessId(res.data[0].id);
        }
      } catch {
        setError("No se pudieron cargar los negocios");
      }
    };
    loadBusinesses();
  }, []);

  useEffect(() => {
    if (!selectedBusinessId) return;
    const loadBusiness = async () => {
      setLoadingBusiness(true);
      try {
        const res = await api.get(`/business/${selectedBusinessId}`);
        setForm(res.data);
      } catch {
        setError("No se pudo cargar el negocio");
      } finally {
        setLoadingBusiness(false);
      }
    };
    loadBusiness();
  }, [selectedBusinessId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setError(null);
    setSuccess(null);
    setSaving(true);

    const rawBrand = form.brandColor?.trim();
    const normalizedBrandColor =
      rawBrand && rawBrand.length > 0
        ? rawBrand.startsWith("#")
          ? rawBrand
          : `#${rawBrand}`
        : undefined;

    const parsed = businessSchema.safeParse({
      name: form.name,
      slug: form.slug,
      timezone: form.timezone,
      phoneNumber: form.phoneNumber?.trim() || undefined,
      whatsappToken: form.whatsappToken?.trim() || undefined,
      logoUrl: form.logoUrl?.trim() || undefined,
      brandColor: normalizedBrandColor,
      bannerUrl: form.bannerUrl?.trim() || undefined,
    });
    if (!parsed.success) {
      setError("Revisa los campos del negocio.");
      setSaving(false);
      return;
    }
    try {
      await api.patch(`/business/${selectedBusinessId}`, parsed.data);
      setSuccess("Negocio actualizado");
    } catch {
      setError("No se pudo actualizar el negocio");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-slate-400">Configuración</p>
          <h1 className="text-3xl font-semibold text-white">Ajustes</h1>
          <p className="text-slate-400">
            Actualiza la información principal de tu negocio.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-200/80">Negocio</label>
          <Select
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

      {error && <FormFeedback variant="error" message={error} />}
      {success && <FormFeedback variant="success" message={success} />}

      {loadingBusiness && (
        <Card className="space-y-3 max-w-xl">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-10 w-32" />
        </Card>
      )}

      {form && !loadingBusiness && (
        <Card className="max-w-xl">
          <motion.form
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.05 } } }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <motion.div variants={fadeUp} className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-300" />
              <span className="chip">Datos del negocio</span>
            </motion.div>

            <div className="space-y-8">
              <div className="form-grid md:grid-cols-2">
                <motion.div variants={fadeUp} className="space-y-2">
                  <label className="block text-sm text-slate-200">Nombre</label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </motion.div>
                <motion.div variants={fadeUp} className="space-y-2">
                  <label className="block text-sm text-slate-200">Slug</label>
                  <Input
                    value={form.slug}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                      })
                    }
                  />
                </motion.div>
                <motion.div variants={fadeUp} className="space-y-2 md:col-span-2">
                  <label className="block text-sm text-slate-200">Zona horaria</label>
                  <Select
                    aria-label="Zona horaria"
                    className="w-full"
                    value={form.timezone}
                    onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                  >
                    <option value="America/Argentina/Buenos_Aires">
                      America/Argentina/Buenos_Aires
                    </option>
                    <option value="America/Mexico_City">America/Mexico_City</option>
                    <option value="America/Bogota">America/Bogota</option>
                  </Select>
                </motion.div>
              </div>

              <motion.div variants={fadeUp} className="flex items-center gap-2">
                <span className="chip">Branding</span>
                <p className="text-xs text-slate-400">
                  Se muestra en el turnero público.
                </p>
              </motion.div>
              <div className="form-grid md:grid-cols-2">
                <motion.div variants={fadeUp} className="space-y-2 md:col-span-2">
                  <label className="block text-sm text-slate-200">Logo (URL)</label>
                  <Input
                    type="url"
                    placeholder="https://.../logo.png"
                    value={form.logoUrl ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, logoUrl: e.target.value })
                    }
                  />
                </motion.div>
                <motion.div variants={fadeUp} className="space-y-2">
                  <label className="block text-sm text-slate-200">Color de marca</label>
                  <Input
                    type="text"
                    placeholder="#7c3aed"
                    value={form.brandColor ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, brandColor: e.target.value })
                    }
                  />
                </motion.div>
                <motion.div variants={fadeUp} className="space-y-2 md:col-span-2">
                  <label className="block text-sm text-slate-200">Banner (URL)</label>
                  <Input
                    type="url"
                    placeholder="https://.../banner.jpg"
                    value={form.bannerUrl ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, bannerUrl: e.target.value })
                    }
                  />
                </motion.div>
              </div>

              <motion.div variants={fadeUp} className="flex items-center gap-2">
                <span className="chip">WhatsApp</span>
                <p className="text-xs text-slate-400">
                  Para confirmaciones y recordatorios automáticos.
                </p>
              </motion.div>
              <div className="form-grid md:grid-cols-2">
                <motion.div variants={fadeUp} className="space-y-2">
                  <label className="block text-sm text-slate-200">
                    Phone Number ID
                  </label>
                  <Input
                    type="text"
                    placeholder="ID de Meta WhatsApp"
                    value={form.phoneNumber ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, phoneNumber: e.target.value })
                    }
                  />
                </motion.div>
                <motion.div variants={fadeUp} className="space-y-2 md:col-span-2">
                  <label className="block text-sm text-slate-200">
                    Token de WhatsApp Cloud API
                  </label>
                  <Input
                    type="password"
                    placeholder="EAAJ..."
                    value={form.whatsappToken ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, whatsappToken: e.target.value })
                    }
                  />
                </motion.div>
              </div>

              <motion.div variants={fadeUp} className="flex items-end">
                <Button type="submit" className="w-full h-12" disabled={saving}>
                  <Save className="w-4 h-4" />
                  {saving ? "Guardando..." : "Guardar cambios"}
                </Button>
              </motion.div>
            </div>
          </motion.form>
        </Card>
      )}
    </div>
  );
}
