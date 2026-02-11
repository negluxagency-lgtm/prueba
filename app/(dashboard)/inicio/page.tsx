"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAppointments } from "@/hooks/useAppointments";
import { useTrends } from "@/hooks/useTrends";
import { Appointment, AppointmentFormData } from "@/types";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { AppointmentTable } from "@/components/dashboard/AppointmentTable";
import { AppointmentModal } from "@/components/dashboard/AppointmentModal";
import { ProductSalesTable } from '@/components/dashboard/ProductSalesTable';
import ObjectiveRings from "@/components/dashboard/ObjectiveRings";
import MonthlyGoalsChart from "@/components/dashboard/MonthlyGoalsChart";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

export default function Dashboard() {
    const router = useRouter(); // Asegúrate de tener esto si no lo tienes
    const searchParams = useSearchParams();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [objectives, setObjectives] = useState({
        ingresos: 0,
        cortes: 0,
        productos: 0
    });
    const [loadingObjectives, setLoadingObjectives] = useState(true);

    const [sales, setSales] = useState<Appointment[]>([]);
    const [services, setServices] = useState<any[]>([]); // State for services
    const [barbers, setBarbers] = useState<any[]>([]); // State for barbers (objects)

    const {
        appointments: dailyCitas,
        monthlyRevenue,
        userPlan,
        loading: appointmentsLoading,
        deleteCita,
        saveCita,
        updateAppointmentStatus
    } = useAppointments(selectedDate);

    // Fetch Services for Dropdown
    React.useEffect(() => {
        const fetchServices = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Link perfiles.id with servicios.perfil_id
            const { data: servicesData } = await supabase
                .from('servicios')
                .select('id, nombre, precio')
                .eq('perfil_id', user.id);

            if (servicesData) {
                setServices(servicesData);
            }

            // Fetch barbers list
            const { data: barbersData } = await supabase
                .from('barberos')
                .select('id, nombre') // Fetch ID too
                .eq('barberia_id', user.id);

            if (barbersData) {
                setBarbers(barbersData);
            }
        };
        fetchServices();
    }, []);

    // Fetch Ventas Productos (New Logic)
    React.useEffect(() => {
        // ... existing fetchSales code ...
        const fetchSales = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Date range for the selected day
            const startOfDay = `${selectedDate} 00:00:00`;
            const endOfDay = `${selectedDate} 23:59:59`;

            const { data: salesData, error } = await supabase
                .from('ventas_productos')
                .select('*')
                .eq('barberia_id', user.id) // Filter by UUID
                .gte('created_at', startOfDay)
                .lte('created_at', endOfDay);

            if (salesData && !error) {
                // Map to Appointment Interface to match existing UI
                // Using _isProductSale as internal marker (not stored in DB)
                const mappedSales: (Appointment & { _isProductSale?: boolean })[] = salesData.map((venta: any) => ({
                    id: venta.id,
                    created_at: venta.created_at,
                    Nombre: venta.nombre_producto,
                    Dia: selectedDate,
                    Hora: venta.created_at.split('T')[1].substring(0, 5), // 'HH:MM'
                    Telefono: String(venta.cantidad), // Used for quantity count in existing logic
                    Precio: venta.precio,
                    confirmada: true,
                    _isProductSale: true, // Internal marker
                }));
                setSales(mappedSales);
            }
        };

        fetchSales();
    }, [selectedDate]);

    // Merge Citas + Ventas
    const allAppointments = [...dailyCitas, ...sales].sort((a, b) => {
        // Sort by time/created_at if needed, but UI seems to handle tables separately
        return a.Hora.localeCompare(b.Hora);
    });

    const { chartData, loading: trendsLoading, setRange } = useTrends(selectedDate);

    // Fetch Objetivos de Perfil
    React.useEffect(() => {
        const fetchObjectives = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from('perfiles')
                .select('ingresos_dia, cortes_dia, productos_dia')
                .eq('id', user.id)
                .single();

            if (profile) {
                setObjectives({
                    ingresos: Number(profile.ingresos_dia) || 0,
                    cortes: Number(profile.cortes_dia) || 0,
                    productos: Number(profile.productos_dia) || 0
                });
            }
            setLoadingObjectives(false);
        };
        fetchObjectives();
    }, []);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCita, setEditingCita] = useState<Appointment | null>(null);

    // Separar citas de ventas usando el marcador interno
    const productSales = allAppointments.filter(a => (a as any)._isProductSale);
    const appointments = allAppointments.filter(a => !(a as any)._isProductSale);

    // Cálculos para ObjectiveRings
    const stats = {
        ingresos: {
            actual: allAppointments.filter(a => a.confirmada).reduce((sum, a) => sum + (Number(a.Precio) || 0), 0),
            objetivo: objectives.ingresos,
            label: 'Ingresos del Día'
        },
        cortes: {
            actual: appointments.filter(a => a.confirmada).length,
            objetivo: objectives.cortes,
            label: 'Cortes Realizados'
        },
        productos: {
            actual: productSales.reduce((sum, a) => sum + (Number(a.Telefono) || 0), 0),
            objetivo: objectives.productos,
            label: 'Ventas Productos'
        }
    };

    const handleEdit = (cita: Appointment) => {
        setEditingCita(cita);
        setIsModalOpen(true);
    };

    const handleDelete = async (item: Appointment) => {
        const isProductSale = (item as any)._isProductSale;

        let promise: Promise<any>;
        if (isProductSale) {
            // Delete from ventas_productos table (UUID id)
            promise = supabase
                .from('ventas_productos')
                .delete()
                .eq('id', item.id)
                .then(({ error }) => {
                    if (error) return { success: false, error: error.message };
                    // Remove from local sales state
                    setSales(prev => prev.filter(s => s.id !== item.id));
                    return { success: true };
                }) as any as Promise<any>;
        } else {
            // Delete from citas table (bigint id)
            promise = deleteCita(item.id);
        }

        toast.promise(promise, {
            loading: 'Eliminando...',
            success: (result: any) => {
                if (!result.success) throw new Error(result.error);
                return 'Registro eliminado';
            },
            error: (err) => `Error al eliminar: ${err}`
        });
    };

    const handleSave = async (data: AppointmentFormData) => {
        const promise = saveCita(data, editingCita?.id || null);

        toast.promise(promise, {
            loading: 'Guardando...',
            success: (result) => {
                if (!result.success) throw new Error(result.error);
                setIsModalOpen(false);
                setEditingCita(null);
                return 'Registro guardado correctamente';
            },
            error: (err) => `Error: ${err}`
        });
    };

    const handleUpdateStatus = async (id: number, status: 'pendiente' | 'confirmada' | 'cancelada') => {
        const promise = updateAppointmentStatus(id, status).then(res => {
            if (!res.success) throw new Error(res.error);
            return res;
        });

        toast.promise(promise, {
            loading: 'Actualizando estado...',
            success: 'Estado actualizado',
            error: (err) => `Error: ${err.message}`
        });
    };

    return (
        <main className="flex-1 p-4 md:p-10 max-w-7xl mx-auto w-full pb-24 md:pb-10">
            <DashboardHeader
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
            />

            <div className="flex flex-col lg:flex-row gap-0 md:gap-6 mb-6 md:mb-10 items-stretch justify-start">
                <div className="flex flex-row gap-0 w-full lg:flex-1 items-stretch min-h-[160px] md:min-h-0">
                    <div className="w-[75%] lg:w-full">
                        <ObjectiveRings
                            ingresos={stats.ingresos}
                            cortes={stats.cortes}
                            productos={stats.productos}
                            loading={loadingObjectives}
                        />
                    </div>
                    <div className="w-[25%] lg:hidden flex justify-end">
                        <DashboardStats
                            appointments={appointments}
                            monthlyRevenue={stats.ingresos.actual}
                            onNewAppointment={() => { setEditingCita(null); setIsModalOpen(true); }}
                        />
                    </div>
                </div>

                <div className="w-full lg:flex-1 hidden md:flex flex-col gap-6 items-end">
                    <div className="w-full">
                        <MonthlyGoalsChart
                            data={chartData}
                            loading={trendsLoading}
                        />
                    </div>
                </div>
            </div>

            {/* Stats row for Desktop (Hidden on mobile as it's already in the rings container) */}
            <div className="hidden md:flex mb-6 md:mb-10 lg:px-4">
                <DashboardStats
                    appointments={appointments}
                    monthlyRevenue={stats.ingresos.actual}
                    onNewAppointment={() => { setEditingCita(null); setIsModalOpen(true); }}
                />
            </div>

            <div className="space-y-4 md:space-y-10">
                <AppointmentTable
                    appointments={appointments}
                    selectedDate={selectedDate}
                    userPlan={userPlan}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onUpdateStatus={handleUpdateStatus}
                    loading={appointmentsLoading}
                    barbers={barbers} // Pass barbers for name lookup
                />

                <ProductSalesTable
                    sales={productSales}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    loading={appointmentsLoading}
                />
            </div>

            <AppointmentModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingCita(null); }}
                onSave={handleSave}
                services={services} // Pass services to modal
                barbers={barbers} // Pass barbers to modal
                initialData={editingCita ? {
                    Nombre: editingCita.Nombre,
                    servicio: editingCita.servicio,
                    barbero: editingCita.barbero,
                    Dia: editingCita.Dia,
                    Hora: editingCita.Hora,
                    Telefono: String(editingCita.Telefono),
                    Precio: String(editingCita.Precio),
                    confirmada: !!editingCita.confirmada,
                } : {
                    Nombre: '',
                    servicio: '',
                    barbero: '',
                    Dia: selectedDate,
                    Hora: '',
                    Telefono: '',
                    Precio: '',
                    confirmada: false
                }}
                isEditing={!!editingCita}
            />

        </main>
    );
}