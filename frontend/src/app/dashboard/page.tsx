'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

interface Business {
    id: string;
    name: string;
    slug: string;
    createdAt: string;
}

export default function DashboardPage() {
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newBusiness, setNewBusiness] = useState({ name: '', slug: '', timezone: 'America/Argentina/Buenos_Aires' });

    useEffect(() => {
        loadBusinesses();
    }, []);

    const loadBusinesses = async () => {
        try {
            const response = await api.get('/business');
            setBusinesses(response.data);
        } catch (error) {
            console.error('Error loading businesses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/business', newBusiness);
            setShowModal(false);
            setNewBusiness({ name: '', slug: '', timezone: 'America/Argentina/Buenos_Aires' });
            loadBusinesses();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error al crear negocio');
        }
    };

    if (loading) {
        return <div className="text-center py-12">Cargando...</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Mis Negocios</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn-primary"
                >
                    + Nuevo Negocio
                </button>
            </div>

            {businesses.length === 0 ? (
                <div className="text-center py-12 card">
                    <p className="text-gray-600 mb-4">No tienes negocios creados aún</p>
                    <button onClick={() => setShowModal(true)} className="btn-primary">
                        Crear mi primer negocio
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {businesses.map((business) => (
                        <Link href={`/dashboard/business/${business.id}`} key={business.id}>
                            <div className="card hover:shadow-lg cursor-pointer">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">{business.name}</h3>
                                <p className="text-sm text-gray-600 mb-4">/{business.slug}</p>
                                <div className="flex space-x-2">
                                    <Link href={`/dashboard/business/${business.id}/bookings`} className="text-sm text-primary-600 hover:text-primary-700">
                                        Reservas
                                    </Link>
                                    <span className="text-gray-300">•</span>
                                    <Link href={`/dashboard/business/${business.id}/services`} className="text-sm text-primary-600 hover:text-primary-700">
                                        Servicios
                                    </Link>
                                    <span className="text-gray-300">•</span>
                                    <Link href={`/dashboard/business/${business.id}/schedule`} className="text-sm text-primary-600 hover:text-primary-700">
                                        Horarios
                                    </Link>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full">
                        <h2 className="text-2xl font-bold mb-4">Nuevo Negocio</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nombre del negocio
                                </label>
                                <input
                                    type="text"
                                    value={newBusiness.name}
                                    onChange={(e) => setNewBusiness({ ...newBusiness, name: e.target.value })}
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Slug (URL única)
                                </label>
                                <input
                                    type="text"
                                    value={newBusiness.slug}
                                    onChange={(e) => setNewBusiness({ ...newBusiness, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                    className="input-field"
                                    placeholder="mi-negocio"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Zona horaria
                                </label>
                                <select
                                    value={newBusiness.timezone}
                                    onChange={(e) => setNewBusiness({ ...newBusiness, timezone: e.target.value })}
                                    className="input-field"
                                >
                                    <option value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</option>
                                    <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
                                    <option value="America/Bogota">Bogotá (GMT-5)</option>
                                </select>
                            </div>
                            <div className="flex space-x-3">
                                <button type="submit" className="btn-primary flex-1">
                                    Crear
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn-secondary flex-1"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
