"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, PlusCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

interface Business {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

type LostMembership = {
  businessId: string;
  businessName: string;
  role: string;
  reason: "PAYMENT_REQUIRED";
};

const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function PanelScreen() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [lostMemberships, setLostMemberships] = useState<LostMembership[]>([]);
  const [showLostModal, setShowLostModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newBusiness, setNewBusiness] = useState({
    name: "",
    slug: "",
    timezone: "America/Argentina/Buenos_Aires",
  });

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    try {
      const response = await api.get("/business");
      const list = Array.isArray(response.data)
        ? response.data
        : (response.data as { data?: unknown }).data;
      const normalized = Array.isArray(list) ? (list as Business[]) : [];
      setBusinesses(normalized);

      if (normalized.length === 0) {
        localStorage.removeItem("activeBusinessId");
        try {
          const lostRes = await api.get("/business/lost-memberships");
          const lost = Array.isArray(lostRes.data)
            ? (lostRes.data as LostMembership[])
            : [];
          setLostMemberships(lost);
          if (lost.length > 0) {
            const seenKey = `lostMembershipSeen:${lost[0].businessId}`;
            if (!localStorage.getItem(seenKey)) {
              localStorage.setItem(seenKey, "1");
              setShowLostModal(true);
            }
          }
        } catch {
          setLostMemberships([]);
        }
      } else {
        const stored = localStorage.getItem("activeBusinessId");
        const businessId =
          (stored && normalized.some((b) => b.id === stored) && stored) ||
          normalized[0].id;
        localStorage.setItem("activeBusinessId", businessId);
        setLostMemberships([]);
      }
    } catch (error: unknown) {
      console.error("Error al cargar negocios:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/business", newBusiness);
      setShowModal(false);
      setNewBusiness({
        name: "",
        slug: "",
        timezone: "America/Argentina/Buenos_Aires",
      });
      loadBusinesses();
    } catch (error: unknown) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response
          ?.data?.message === "string"
          ? (error as { response: { data: { message: string } } }).response.data
              .message
          : "Error al crear negocio";
      alert(message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este negocio y todos sus datos relacionados?"))
      return;
    try {
      await api.delete(`/business/${id}`);
      loadBusinesses();
    } catch (error: unknown) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response
          ?.data?.message === "string"
          ? (error as { response: { data: { message: string } } }).response.data
              .message
          : "No se pudo eliminar el negocio";
      alert(message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="space-y-3">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-6 w-full" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm text-slate-400">Panel principal</p>
          <h1 className="text-4xl font-semibold text-white">Mis negocios</h1>
          <p className="text-slate-400">
            Administra tus espacios y agiliza las reservas con una experiencia
            premium.
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} className="text-sm px-4 py-3">
          <PlusCircle className="w-4 h-4" />
          Nuevo negocio
        </Button>
      </div>

      {businesses.length === 0 ? (
        <Card className="text-center space-y-3">
          {lostMemberships.length > 0 ? (
            <>
              <Building2 className="w-10 h-10 text-amber-300 mx-auto" />
              <h3 className="text-lg font-semibold text-white">
                Acceso removido
              </h3>
              <p className="text-sm text-slate-300">
                El negocio{" "}
                <span className="font-semibold text-white">
                  &quot;{lostMemberships[0].businessName}&quot;
                </span>{" "}
                del que eras parte como{" "}
                <span className="font-semibold text-white">staff</span> ya no
                está disponible por falta de pago del plan Pro del owner.
              </p>
              <p className="text-sm text-slate-400">
                Cuando el owner reactive Pro vas a recuperar el acceso
                automáticamente.
              </p>
              <div className="flex justify-center gap-2">
                <Button
                  onClick={() => setShowModal(true)}
                  variant="secondary"
                  className="px-4 py-2"
                >
                  Crear mi negocio
                </Button>
                <Link href="/panel/planes" className="btn-primary !h-11">
                  Ver planes
                </Link>
              </div>
            </>
          ) : (
            <>
              <Building2 className="w-10 h-10 text-indigo-300 mx-auto" />
              <h3 className="text-lg font-semibold text-white">
                Sin negocios aún
              </h3>
              <p className="text-sm text-slate-400">
                Crea tu primer negocio para comenzar a gestionar reservas.
              </p>
              <div className="flex justify-center">
                <Button onClick={() => setShowModal(true)} className="px-4 py-2">
                  Crear negocio
                </Button>
              </div>
            </>
          )}
        </Card>
      ) : (
        <motion.div
          variants={{ show: { transition: { staggerChildren: 0.05 } } }}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {businesses.map((business) => (
            <motion.div
              key={business.id}
              variants={fadeIn}
              className="card group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-start justify-between gap-3 relative z-10">
                <Link href={`/panel/negocio/${business.id}`} className="block">
                  <h3 className="text-xl font-semibold text-white hover:text-indigo-200 transition-colors">
                    {business.name}
                  </h3>
                  <p className="text-sm text-slate-400">/{business.slug}</p>
                </Link>
                <Button
                  onClick={() => handleDelete(business.id)}
                  variant="secondary"
                  className="flex items-center gap-1 rounded-full border border-red-400/40 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-200 hover:bg-red-500/20 transition"
                >
                  <Trash2 className="w-3 h-3" />
                  Eliminar
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-4 text-sm text-indigo-100">
                <Link
                  href={`/panel/negocio/${business.id}/reservas`}
                  className="pill bg-indigo-500/20 border-indigo-400/30 hover:border-indigo-300/70 hover:bg-indigo-500/30 transition"
                >
                  Reservas
                </Link>
                <Link
                  href={`/panel/negocio/${business.id}/servicios`}
                  className="pill bg-indigo-500/20 border-indigo-400/30 hover:border-indigo-300/70 hover:bg-indigo-500/30 transition"
                >
                  Servicios
                </Link>
                <Link
                  href={`/panel/negocio/${business.id}/horarios`}
                  className="pill bg-indigo-500/20 border-indigo-400/30 hover:border-indigo-300/70 hover:bg-indigo-500/30 transition"
                >
                  Horarios
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ type: "spring", stiffness: 220, damping: 20 }}
              className="w-full max-w-lg rounded-3xl bg-slate-900/80 border border-white/10 shadow-2xl shadow-indigo-500/20 p-6 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-white">
                    Nuevo negocio
                  </h2>
                  <p className="text-sm text-slate-400">
                    Define el nombre, slug y zona horaria para comenzar.
                  </p>
                </div>
                <Button
                  onClick={() => setShowModal(false)}
                  variant="ghost"
                  className="text-sm"
                >
                  Cerrar
                </Button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Nombre del negocio
                  </label>
                  <input
                    type="text"
                    value={newBusiness.name}
                    onChange={(e) =>
                      setNewBusiness({ ...newBusiness, name: e.target.value })
                    }
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Slug (URL única)
                  </label>
                  <input
                    type="text"
                    value={newBusiness.slug}
                    onChange={(e) =>
                      setNewBusiness({
                        ...newBusiness,
                        slug: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, ""),
                      })
                    }
                    className="input-field"
                    placeholder="mi-negocio"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Zona horaria
                  </label>
                  <select
                    value={newBusiness.timezone}
                    onChange={(e) =>
                      setNewBusiness({
                        ...newBusiness,
                        timezone: e.target.value,
                      })
                    }
                    className="input-field"
                  >
                    <option value="America/Argentina/Buenos_Aires">
                      Buenos Aires (GMT-3)
                    </option>
                    <option value="America/Mexico_City">
                      Ciudad de México (GMT-6)
                    </option>
                    <option value="America/Bogota">Bogotá (GMT-5)</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" className="flex-1">
                    Crear
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowModal(false)}
                    variant="secondary"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLostModal && lostMemberships.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ type: "spring", stiffness: 220, damping: 20 }}
              className="w-full max-w-lg rounded-3xl bg-slate-900/80 border border-white/10 shadow-2xl shadow-amber-500/15 p-6 space-y-4 text-center"
            >
              <Building2 className="w-10 h-10 text-amber-300 mx-auto" />
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-white">
                  Acceso removido
                </h2>
                <p className="text-sm text-slate-300">
                  El negocio{" "}
                  <span className="font-semibold text-white">
                    &quot;{lostMemberships[0].businessName}&quot;
                  </span>{" "}
                  del que eras parte como{" "}
                  <span className="font-semibold text-white">staff</span> ya no
                  está disponible por falta de pago del plan Pro del owner.
                </p>
                <p className="text-sm text-slate-400">
                  Cuando el owner reactive Pro vas a recuperar el acceso
                  automáticamente.
                </p>
              </div>

              <div className="flex justify-center gap-2 pt-2">
                <Button
                  onClick={() => setShowLostModal(false)}
                  variant="secondary"
                  className="px-4 py-2"
                >
                  Entendido
                </Button>
                <Button
                  onClick={() => {
                    setShowLostModal(false);
                    setShowModal(true);
                  }}
                  className="px-4 py-2"
                >
                  Crear mi negocio
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
