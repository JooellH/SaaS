"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
import { useAuth } from "@/contexts/AuthContext";

interface Business {
  id: string;
  ownerId?: string;
  name: string;
  slug: string;
  timezone: string;
  phoneNumber?: string | null;
  whatsappToken?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
}

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

export default function AjustesScreen() {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
  const [form, setForm] = useState<Business | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingBusiness, setLoadingBusiness] = useState(false);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [logoPreviewError, setLogoPreviewError] = useState(false);
  const [bannerPreviewError, setBannerPreviewError] = useState(false);

  const MAX_LOGO_BYTES = 250 * 1024;
  const MAX_BANNER_BYTES = 900 * 1024;

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
      reader.readAsDataURL(file);
    });

  const handlePickImage = async (
    field: "logoUrl" | "bannerUrl",
    file: File | undefined,
  ) => {
    if (!form || !file) return;
    setError(null);
    if (field === "logoUrl") setLogoPreviewError(false);
    if (field === "bannerUrl") setBannerPreviewError(false);

    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen.");
      return;
    }

    const maxBytes = field === "logoUrl" ? MAX_LOGO_BYTES : MAX_BANNER_BYTES;
    if (file.size > maxBytes) {
      setError(
        `La imagen es muy pesada. Máximo ${
          field === "logoUrl" ? "250KB" : "900KB"
        }.`,
      );
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setForm({ ...form, [field]: dataUrl });
    } catch {
      setError("No se pudo cargar la imagen.");
    }
  };

  useEffect(() => {
    setLogoPreviewError(false);
  }, [form?.logoUrl]);

  useEffect(() => {
    setBannerPreviewError(false);
  }, [form?.bannerUrl]);

  useEffect(() => {
    const loadBusinesses = async () => {
      setLoadingBusinesses(true);
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
        if (!nextId) setForm(null);
      } catch {
        setError("No se pudieron cargar los negocios");
        setBusinesses([]);
        setSelectedBusinessId("");
        setForm(null);
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

    const parsed = businessSchema.safeParse({
      name: form.name,
      slug: form.slug,
      timezone: form.timezone,
      phoneNumber: form.phoneNumber?.trim() || undefined,
      whatsappToken: form.whatsappToken?.trim() || undefined,
      logoUrl: form.logoUrl?.trim() || undefined,
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

  const selectedBusiness = useMemo(
    () => businesses.find((b) => b.id === selectedBusinessId) || null,
    [businesses, selectedBusinessId],
  );

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
      </div>

      {error && <FormFeedback variant="error" message={error} />}
      {success && <FormFeedback variant="success" message={success} />}

      {!loadingBusinesses && businesses.length === 0 && (
        <Card className="max-w-xl space-y-2">
          <p className="text-sm text-slate-200">
            Ajustes solo está disponible para negocios donde sos owner.
          </p>
          <p className="text-sm text-slate-400">
            Si sos staff en un negocio, el owner administra los ajustes.
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
                  <label className="block text-sm text-slate-200">Logo</label>
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handlePickImage("logoUrl", e.target.files?.[0])
                      }
                    />
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Link directo a imagen (.png/.jpg) o data:image/..."
                        value={form.logoUrl ?? ""}
                        onChange={(e) =>
                          setForm({ ...form, logoUrl: e.target.value })
                        }
                      />
                      {form.logoUrl ? (
                        <Button
                          type="button"
                          variant="secondary"
                          className="shrink-0 !h-12"
                          onClick={() => setForm({ ...form, logoUrl: null })}
                        >
                          Quitar
                        </Button>
                      ) : null}
                    </div>
                    {form.logoUrl ? (
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <img
                          src={form.logoUrl}
                          alt="Logo"
                          className="h-16 w-16 rounded-lg object-cover"
                          onError={() => setLogoPreviewError(true)}
                        />
                        {logoPreviewError ? (
                          <div className="mt-2 text-xs text-amber-200/90">
                            No se pudo cargar el logo. Usá un link directo a la
                            imagen (ej: termina en .png/.jpg) o subilo desde tu
                            dispositivo.
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </motion.div>
                <motion.div variants={fadeUp} className="space-y-2 md:col-span-2">
                  <label className="block text-sm text-slate-200">Banner</label>
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handlePickImage("bannerUrl", e.target.files?.[0])
                      }
                    />
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Link directo a imagen (.png/.jpg) o data:image/..."
                        value={form.bannerUrl ?? ""}
                        onChange={(e) =>
                          setForm({ ...form, bannerUrl: e.target.value })
                        }
                      />
                      {form.bannerUrl ? (
                        <Button
                          type="button"
                          variant="secondary"
                          className="shrink-0 !h-12"
                          onClick={() => setForm({ ...form, bannerUrl: null })}
                        >
                          Quitar
                        </Button>
                      ) : null}
                    </div>
                    {form.bannerUrl ? (
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <img
                          src={form.bannerUrl}
                          alt="Banner"
                          className="h-28 w-full rounded-lg object-cover"
                          onError={() => setBannerPreviewError(true)}
                        />
                        {bannerPreviewError ? (
                          <div className="mt-2 text-xs text-amber-200/90">
                            No se pudo cargar el banner. Usá un link directo a la
                            imagen o subilo desde tu dispositivo.
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
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
