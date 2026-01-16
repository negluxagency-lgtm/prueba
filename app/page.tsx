"use client";

import React, { useState } from "react";
import { useAppointments } from "@/hooks/useAppointments";
import { Appointment, AppointmentFormData } from "@/types";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { AppointmentTable } from "@/components/dashboard/AppointmentTable";
import { AppointmentModal } from "@/components/dashboard/AppointmentModal";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { toast } from "sonner";

export default function BarberDashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { appointments, monthlyRevenue, saveCita, deleteCita, loading } = useAppointments(selectedDate);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const defaultFormData: AppointmentFormData = {
    Nombre: "",
    Servicio: "Corte Normal",
    Dia: selectedDate,
    Hora: "",
    Telefono: "",
    Precio: ""
  };

  const [formData, setFormData] = useState<AppointmentFormData>(defaultFormData);

  const openNewCitaModal = () => {
    setEditingId(null);
    setFormData({ ...defaultFormData, Dia: selectedDate });
    setIsModalOpen(true);
  };

  const openEditCitaModal = (cita: Appointment) => {
    setEditingId(cita.id);
    setFormData({
      Nombre: cita.Nombre,
      Servicio: cita.Servicio,
      Dia: cita.Dia,
      Hora: cita.Hora,
      Telefono: cita.Telefono || "",
      Precio: String(cita.Precio)
    });
    setIsModalOpen(true);
  };

  const handleSave = async (data: AppointmentFormData) => {
    const promise = saveCita(data, editingId);

    toast.promise(promise, {
      loading: 'Guardando...',
      success: (result) => {
        if (!result.success) throw new Error(result.error);
        setIsModalOpen(false);
        return 'Cita guardada correctamente';
      },
      error: (err) => `Error: ${err}`
    });
  };

  const handleDelete = async (id: number) => {
    const promise = deleteCita(id);
    toast.promise(promise, {
      loading: 'Eliminando...',
      success: (result) => {
        if (!result.success) throw new Error(result.error);
        return 'Cita eliminada';
      },
      error: (err) => `Error al eliminar: ${err}`
    });
  };
  return (
    <>
      <main className="flex-1 p-2 md:p-10 max-w-3xl md:max-w-6xl mx-auto w-full pb-20 md:pb-10">
        <DashboardHeader
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />

        <div className="flex justify-end mb-8 md:mb-3">
          <DashboardStats
            appointments={appointments}
            monthlyRevenue={monthlyRevenue}
            onNewAppointment={openNewCitaModal}
          />
        </div>

        {(!loading && appointments.length === 0) ? (
          <EmptyState onAction={openNewCitaModal} />
        ) : (
          <div className="pb-8">
            <AppointmentTable
              appointments={appointments}
              selectedDate={selectedDate}
              onEdit={openEditCitaModal}
              onDelete={handleDelete}
              loading={loading}
            />
          </div>
        )}
      </main>

      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={formData}
        isEditing={!!editingId}
      />
    </>
  );
}