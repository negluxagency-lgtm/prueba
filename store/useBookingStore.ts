import { create } from 'zustand'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export type BookingStep = 'SERVICE' | 'DATE' | 'FORM' | 'SUCCESS'

export interface BookingService {
    id: string
    nombre: string
    precio: number
    duracion: number
}

export interface BookingBarber {
    id: string
    barberia_id: string
    nombre: string
    foto?: string
    horario_semanal?: Array<{
        dia: number
        activo?: boolean
        abierto?: boolean
        turnos?: { inicio: string; fin: string }[]
        franjas?: { inicio: string; fin: string }[]
    }>
}

// ──────────────────────────────────────────────
// Store State
// ──────────────────────────────────────────────

interface BookingState {
    // Navigation
    step: BookingStep

    // Step 1: Service
    selectedService: BookingService | null

    // Step 2: Date & Time & Barber
    selectedDate: Date | null
    selectedTime: string
    selectedBarberId: string | null

    // Step 3: Form (guest info)
    guestName: string
    guestPhone: string

    // Internal
    isSubmitting: boolean
    bookingUuid: string | null
}

// ──────────────────────────────────────────────
// Store Actions
// ──────────────────────────────────────────────

interface BookingActions {
    setStep: (step: BookingStep) => void
    setService: (service: BookingService) => void
    setDate: (date: Date | null) => void
    setTime: (time: string) => void
    setBarberId: (id: string | null) => void
    setGuestName: (name: string) => void
    setGuestPhone: (phone: string) => void
    setIsSubmitting: (val: boolean) => void
    setBookingUuid: (uuid: string | null) => void
    reset: () => void
}

// ──────────────────────────────────────────────
// Initial State
// ──────────────────────────────────────────────

const initialState: BookingState = {
    step: 'SERVICE',
    selectedService: null,
    selectedDate: null,
    selectedTime: '',
    selectedBarberId: null,
    guestName: '',
    guestPhone: '',
    isSubmitting: false,
    bookingUuid: null,
}

// ──────────────────────────────────────────────
// Zustand Store
// ──────────────────────────────────────────────

export const useBookingStore = create<BookingState & BookingActions>()((set) => ({
    ...initialState,

    setStep: (step) => set({ step }),
    setService: (service) => set({ selectedService: service }),
    setDate: (date) => set({ selectedDate: date, selectedTime: '' }), // Reset time when date changes
    setTime: (time) => set({ selectedTime: time }),
    setBarberId: (id) => set({ selectedBarberId: id }),
    setGuestName: (name) => set({ guestName: name }),
    setGuestPhone: (phone) => set({ guestPhone: phone }),
    setIsSubmitting: (val) => set({ isSubmitting: val }),
    setBookingUuid: (uuid) => set({ bookingUuid: uuid }),
    reset: () => set(initialState),
}))
