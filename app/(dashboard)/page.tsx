"use client";

import React, { useState } from "react";
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
import { WelcomeModal } from "@/components/dashboard/WelcomeModal";

import { useRouter, useSearchParams } from "next/navigation";

export default function Dashboard() {
  const router = useRouter(); // Asegúrate de tener esto si no lo tienes
  const searchParams = useSearchParams();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showWelcome, setShowWelcome] = useState(false);

  // Efecto para mostrar el modal de bienvenida post-registro
  React.useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setShowWelcome(true);
    }
  }, [searchParams]);

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    // Limpiar la URL solo cuando el usuario cierre el modal
    router.replace('/');
  };

  const {
    appointments: allAppointments,
    // ... rest of the code
    monthlyRevenue,
    loading: appointmentsLoading,
    deleteCita,
    saveCita,
    updateAppointmentStatus
  } = useAppointments(selectedDate);

  const { chartData, loading: trendsLoading, setRange } = useTrends(selectedDate);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCita, setEditingCita] = useState<Appointment | null>(null);

  // Separar citas de ventas usando el Servicio como identificador
  const appointments = allAppointments.filter(a => a.Servicio !== 'Venta de Producto');
  const productSales = allAppointments.filter(a => a.Servicio === 'Venta de Producto');

  // Cálculos para ObjectiveRings
  const stats = {
    ingresos: {
      actual: allAppointments.filter(a => a.confirmada).reduce((sum, a) => sum + (Number(a.Precio) || 0), 0),
      objetivo: 1000, // Objetivo diario personalizable
      label: 'Ingresos del Día'
    },
    cortes: {
      actual: appointments.filter(a => a.confirmada).length,
      objetivo: 50,
      label: 'Cortes Realizados'
    },
    productos: {
      actual: productSales.length,
      objetivo: 3,
      label: 'Ventas Productos'
    }
  };

  const handleEdit = (cita: Appointment) => {
    setEditingCita(cita);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const promise = deleteCita(id);
    toast.promise(promise, {
      loading: 'Eliminando...',
      success: (result) => {
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
            />
          </div>
          <div className="w-[25%] lg:hidden flex justify-end">
            <DashboardStats
              appointments={appointments}
              monthlyRevenue={monthlyRevenue}
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
          monthlyRevenue={monthlyRevenue}
          onNewAppointment={() => { setEditingCita(null); setIsModalOpen(true); }}
        />
      </div>

      <div className="space-y-4 md:space-y-10">
        <AppointmentTable
          appointments={appointments}
          selectedDate={selectedDate}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onUpdateStatus={handleUpdateStatus}
          loading={appointmentsLoading}
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
        initialData={editingCita ? {
          Nombre: editingCita.Nombre,
          Servicio: editingCita.Servicio,
          Dia: editingCita.Dia,
          Hora: editingCita.Hora,
          Telefono: String(editingCita.Telefono),
          Precio: String(editingCita.Precio),
          confirmada: !!editingCita.confirmada,
          producto: !!editingCita.producto
        } : {
          Nombre: '',
          Servicio: 'Corte Normal',
          Dia: selectedDate,
          Hora: '',
          Telefono: '',
          Precio: '',
          producto: false,
          confirmada: false
        }}
        isEditing={!!editingCita}
      />

      <WelcomeModal
        isOpen={showWelcome}
        onClose={handleCloseWelcome}
      />
    </main>
  );
}