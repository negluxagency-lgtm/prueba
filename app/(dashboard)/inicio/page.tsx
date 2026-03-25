"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAppointments } from "@/hooks/useAppointments";
import { useTrends } from "@/hooks/useTrends";
import { useShopData } from "@/hooks/useShopData";
import { Appointment, AppointmentFormData } from "@/types";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { AppointmentTable } from "@/components/dashboard/AppointmentTable";
import { AppointmentModal } from "@/components/dashboard/AppointmentModal";
import { InvoiceModal } from "@/components/dashboard/InvoiceModal";
import { AppointmentLinkModal } from "@/components/dashboard/AppointmentLinkModal";
import { ProductSalesTable } from '@/components/dashboard/ProductSalesTable';
import { EditProductSaleModal } from '@/components/dashboard/EditProductSaleModal';
import ObjectiveRings from "@/components/dashboard/ObjectiveRings";
import MonthlyGoalsChart from "@/components/dashboard/MonthlyGoalsChart";
import CadenaStatsChart from '@/components/dashboard/CadenaStatsChart';
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { ObjectiveRingsSkeleton, TableSkeleton } from "@/components/ui/SkeletonLoader";
import useSWR from "swr";

export default function Dashboard() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // --- SWR HOOKS ---
    const {
        appointments: dailyCitas,
        userPlan,
        loading: appointmentsLoading,
        deleteCita,
        saveCita,
        updateAppointmentStatus,
        refreshAppointments
    } = useAppointments(selectedDate);

    const { 
        shopData: { services, barbers, profile: shopProfile }, 
        loading: shopLoading,
        refreshShopData
    } = useShopData();

    const userId = shopProfile?.id;

    // SWR for daily metrics/objectives (metricas_diarias)
    const { 
        data: metricsData, 
        mutate: mutateMetrics, 
        isLoading: loadingMetrics 
    } = useSWR(
        userId ? ['dashboard-metrics', selectedDate, userId] : null,
        async () => {
            const { data: metrics } = await supabase
                .from('metricas_diarias')
                .select('*')
                .eq('barberia_id', userId)
                .eq('dia', selectedDate)
                .single();

            const objectives = {
                ingresos: Number(shopProfile?.ingresos_dia) || 0,
                cortes: Number(shopProfile?.cortes_dia) || 0,
                productos: Number(shopProfile?.productos_dia) || 0
            };

            return { metrics, objectives };
        }
    );

    // SWR for Product Sales (Ventas Productos)
    const {
        data: productSalesRaw = [],
        mutate: mutateSales,
        isLoading: loadingSales
    } = useSWR(
        userId ? ['product-sales', selectedDate, userId] : null,
        async () => {
            const startOfDay = `${selectedDate} 00:00:00`;
            const endOfDay = `${selectedDate} 23:59:59`;

            const { data } = await supabase
                .from('ventas_productos')
                .select('*')
                .eq('barberia_id', userId)
                .gte('created_at', startOfDay)
                .lte('created_at', endOfDay);

            return (data || []).map((venta: any) => ({
                id: venta.id,
                created_at: venta.created_at,
                Nombre: venta.nombre_producto,
                Dia: selectedDate,
                Hora: venta.created_at.split('T')[1].substring(0, 5),
                Telefono: String(venta.cantidad),
                Precio: venta.precio,
                pago: venta.metodo_pago,
                confirmada: true,
                _isProductSale: true,
            }));
        }
    );

    const { chartData, loading: trendsLoading } = useTrends(selectedDate);

    // --- REALTIME ---
    useEffect(() => {
        if (!userId) return;
        const channel = supabase
            .channel(`dashboard-realtime-${userId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'metricas_diarias', filter: `barberia_id=eq.${userId}` }, () => mutateMetrics())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ventas_productos', filter: `barberia_id=eq.${userId}` }, () => mutateSales())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'citas', filter: `barberia_id=eq.${userId}` }, () => refreshAppointments())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'barberos', filter: `barberia_id=eq.${userId}` }, () => refreshShopData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'servicios', filter: `barberia_id=eq.${userId}` }, () => refreshShopData())
            .subscribe();
        return () => { supabase.removeChannel(channel) };
    }, [userId, mutateMetrics, mutateSales, refreshAppointments, refreshShopData]);

    // --- CALCULATED PROPERTIES ---
    const metricasDia = metricsData?.metrics || { ingresos: 0, cortes: 0, productos: 0, citas: 0, caja_esperada: 0, caja_real: 0 };
    const objectives = metricsData?.objectives || { ingresos: 0, cortes: 0, productos: 0 };
    
    const allAppointments = useMemo(() => {
        return [...dailyCitas, ...productSalesRaw].sort((a, b) => a.Hora.localeCompare(b.Hora));
    }, [dailyCitas, productSalesRaw]);

    const stats = {
        ingresos: { actual: metricasDia.ingresos, objetivo: objectives.ingresos, label: 'Ingresos del Día' },
        cortes: { actual: metricasDia.cortes, objetivo: objectives.cortes, label: 'Cortes Realizados' },
        productos: { actual: metricasDia.productos, objetivo: objectives.productos, label: 'Ventas Productos' }
    };

    const isCadena = shopProfile?.cadena === true;
    const cadenaIds = shopProfile?.barberias_cadena_id ? (
        typeof shopProfile.barberias_cadena_id === 'string' 
            ? JSON.parse(shopProfile.barberias_cadena_id) 
            : shopProfile.barberias_cadena_id
    ) : [];

    // --- MODAL STATE ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCita, setEditingCita] = useState<Appointment | null>(null);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [invoiceAppointment, setInvoiceAppointment] = useState<Appointment | null>(null);
    const [isProductEditModalOpen, setIsProductEditModalOpen] = useState(false);
    const [editingProductSale, setEditingProductSale] = useState<any>(null);
    const [appointmentLinkUuid, setAppointmentLinkUuid] = useState<string | null>(null);

    // --- HANDLERS ---
    const handleEdit = (item: Appointment) => {
        if ((item as any)._isProductSale) {
            setEditingProductSale(item);
            setIsProductEditModalOpen(true);
        } else {
            setEditingCita(item);
            setIsModalOpen(true);
        }
    };

    const handleDelete = async (item: Appointment) => {
        const isProductSale = (item as any)._isProductSale;
        let promise: Promise<any>;

        if (isProductSale) {
            promise = supabase.from('ventas_productos').delete().eq('id', item.id).then(({ error }) => {
                if (error) return { success: false, error: error.message };
                mutateSales();
                mutateMetrics();
                return { success: true };
            }) as any;
        } else {
            promise = deleteCita(item.id).then((res: any) => {
                if (res.success) mutateMetrics();
                return res;
            });
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
        const promise = saveCita(data, editingCita?.id || null).then((res: any) => {
            if (res.success) mutateMetrics();
            return res;
        });

        toast.promise(promise, {
            loading: 'Guardando...',
            success: (result) => {
                if (!result.success) throw new Error(result.error);
                setIsModalOpen(false);
                setEditingCita(null);
                // NOTA: Se ha omitido mostrar el generador de links de gestión 
                // para citas introducidas manualmente desde el dashboard.
                return 'Registro guardado correctamente';
            },
            error: (err) => `Error: ${err}`
        });
    };

    const handleSaveProductSale = async (data: { cantidad: number; precioTotal: number; metodoPago: string }) => {
        if (!editingProductSale || !userId) return;

        const updateAction = async () => {
            const { error } = await supabase
                .from('ventas_productos')
                .update({ cantidad: data.cantidad, precio: data.precioTotal, metodo_pago: data.metodoPago })
                .eq('id', editingProductSale.id)
                .eq('barberia_id', userId);
            if (error) throw error;
            mutateSales();
            mutateMetrics();
            return { success: true };
        };

        toast.promise(updateAction(), {
            success: 'Venta actualizada correctamente',
            error: (err) => `Error: ${err.message || 'Error al actualizar'}`
        });
    };

    const handleUpdateStatus = async (id: number, status: 'pendiente' | 'confirmada' | 'cancelada', pago?: string) => {
        const promise = updateAppointmentStatus(id, status, pago).then((res: any) => {
            if (!res.success) throw new Error(res.error);
            mutateMetrics();
            return res;
        });
        toast.promise(promise, { loading: 'Actualizando estado...', success: 'Estado actualizado', error: (err) => `Error: ${err.message}` });
    };

    const handleGenerateInvoice = (cita: Appointment) => {
        setInvoiceAppointment(cita);
        setIsInvoiceModalOpen(true);
    };

    const handleGenerateProductInvoice = (sale: Appointment) => {
        setInvoiceAppointment({ ...sale, servicio: sale.Nombre, Nombre: '', Telefono: '', Dia: sale.Dia || selectedDate } as any);
        setIsInvoiceModalOpen(true);
    };

    const updateShopCIF = async (newCIF: string) => {
        if (!userId) return;
        const { error } = await supabase.from('perfiles').update({ 'CIF/NIF': newCIF }).eq('id', userId);
        if (!error) refreshShopData?.();
    };

    return (
        <main className="flex-1 p-4 lg:p-10 max-w-7xl mx-auto w-full pb-24 lg:pb-10">
            <DashboardHeader selectedDate={selectedDate} setSelectedDate={setSelectedDate} />

            <div className="flex flex-col lg:flex-row gap-0 lg:gap-6 mb-6 lg:mb-10 items-stretch justify-start">
                <div className="flex flex-row gap-0 w-full lg:flex-1 items-stretch min-h-[160px] lg:min-h-0">
                    <div className="w-[75%] lg:w-full">
                        <ObjectiveRings {...stats} loading={loadingMetrics || shopLoading} />
                    </div>
                    <div className="w-[25%] lg:hidden flex justify-end">
                        <DashboardStats 
                            citas={metricasDia.citas || dailyCitas.length} 
                            cajaEsperada={metricasDia.caja_esperada} 
                            cajaReal={metricasDia.caja_real}
                            onNewAppointment={() => { setEditingCita(null); setIsModalOpen(true); }} 
                        />
                    </div>
                </div>
                <div className="w-full lg:flex-1 hidden lg:flex flex-col gap-6 items-end">
                    <div className="w-full">
                        <MonthlyGoalsChart data={chartData} loading={trendsLoading} />
                    </div>
                </div>
            </div>

            <div className="hidden lg:flex mb-6 lg:mb-10 lg:px-4">
                <DashboardStats 
                    citas={metricasDia.citas || dailyCitas.length} 
                    cajaEsperada={metricasDia.caja_esperada} 
                    cajaReal={metricasDia.caja_real}
                    onNewAppointment={() => { setEditingCita(null); setIsModalOpen(true); }} 
                />
            </div>

            <div className="space-y-4 lg:space-y-10">
                {isCadena ? (
                    <CadenaStatsChart barberiasIds={cadenaIds} selectedDate={selectedDate} />
                ) : (
                    <>
                        <AppointmentTable 
                            appointments={dailyCitas} selectedDate={selectedDate} userPlan={userPlan}
                            onEdit={handleEdit} onDelete={handleDelete} onUpdateStatus={handleUpdateStatus}
                            onGenerateInvoice={handleGenerateInvoice} loading={appointmentsLoading} barbers={barbers}
                        />
                        <ProductSalesTable 
                            sales={productSalesRaw} onEdit={handleEdit} onDelete={handleDelete}
                            onGenerateInvoice={handleGenerateProductInvoice} loading={loadingSales}
                        />
                    </>
                )}
            </div>

            <AppointmentModal
                isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingCita(null); }}
                onSave={handleSave} services={services} barbers={barbers} isEditing={!!editingCita}
                initialData={editingCita ? { ...editingCita, Telefono: String(editingCita.Telefono), Precio: String(editingCita.Precio) } as any : {
                    Nombre: '', servicio: '', barbero: '', barbero_id: '', Dia: selectedDate, Hora: '09:00', Telefono: '', Precio: '', confirmada: false
                }}
            />

            <InvoiceModal
                isOpen={isInvoiceModalOpen} onClose={() => { setIsInvoiceModalOpen(false); setInvoiceAppointment(null); }}
                appointment={invoiceAppointment} shopData={shopProfile ? { name: shopProfile.nombre_barberia || 'Mi Barbería', cif: shopProfile["CIF/NIF"] || '' } : { name: 'Mi Barbería', cif: '' }}
                onUpdateCIF={updateShopCIF}
            />

            <EditProductSaleModal
                isOpen={isProductEditModalOpen} onClose={() => { setIsProductEditModalOpen(false); setEditingProductSale(null); }}
                onSave={handleSaveProductSale} sale={editingProductSale}
            />

            {appointmentLinkUuid && <AppointmentLinkModal uuid={appointmentLinkUuid} onClose={() => setAppointmentLinkUuid(null)} />}
        </main>
    );
}