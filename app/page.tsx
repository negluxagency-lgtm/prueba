"use client";

import React, { useState } from "react";
import { useAppointments } from "@/hooks/useAppointments";
import { Appointment, AppointmentFormData } from "@/types";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { AppointmentTable } from "@/components/dashboard/AppointmentTable";
import { AppointmentModal } from "@/components/dashboard/AppointmentModal";
import { ProductSalesTable } from '@/components/dashboard/ProductSalesTable';
import ObjectiveRings from "@/components/dashboard/ObjectiveRings";
import MonthlyStats from "@/components/dashboard/MonthlyStats";
import { toast } from "sonner";

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const {
    appointments: allAppointments,
    monthlyRevenue,
    monthlyCuts,
    monthlyProducts,
    loading,
    deleteCita,
    saveCita,
    toggleConfirmation
  } = useAppointments(selectedDate);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCita, setEditingCita] = useState<Appointment | null>(null);

  // Separar citas de ventas usando el Servicio como identificador
  const appointments = allAppointments.filter(a => a.Servicio !== 'Venta de Producto');
  const productSales = allAppointments.filter(a => a.Servicio === 'Venta de Producto');

  // Cálculos para ObjectiveRings
  const stats = {
    ingresos: {
      actual: allAppointments.reduce((sum, a) => sum + (Number(a.Precio) || 0), 0),
      objetivo: 500, // Objetivo diario personalizable
      label: 'Ingresos del Día'
    },
    cortes: {
      actual: appointments.length,
      objetivo: 15,
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

  const handleToggleConfirmation = async (id: number, currentStatus: boolean) => {
    const promise = toggleConfirmation(id, currentStatus).then(res => {
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

      <div className="flex flex-col lg:flex-row gap-6 mb-10 items-start">
        <div className="w-full lg:flex-1">
          <ObjectiveRings
            ingresos={stats.ingresos}
            cortes={stats.cortes}
            productos={stats.productos}
          />
        </div>
        <div className="w-full lg:w-auto flex flex-col gap-6 items-end">
          <DashboardStats
            appointments={appointments}
            monthlyRevenue={monthlyRevenue}
            onNewAppointment={() => { setEditingCita(null); setIsModalOpen(true); }}
          />
          <div className="hidden md:block">
            <MonthlyStats
              revenue={monthlyRevenue}
              cuts={monthlyCuts}
              products={monthlyProducts}
            />
          </div>
        </div>
      </div>

      <div className="space-y-10">
        <AppointmentTable
          appointments={appointments}
          selectedDate={selectedDate}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleConfirmation={handleToggleConfirmation}
          loading={loading}
        />

        <ProductSalesTable
          sales={productSales}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
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
          productos: !!editingCita.productos
        } : {
          Nombre: '',
          Servicio: 'Corte Normal',
          Dia: selectedDate,
          Hora: '',
          Telefono: '',
          Precio: '',
          productos: false,
          confirmada: false
        }}
        isEditing={!!editingCita}
      />
    </main>
  );
}