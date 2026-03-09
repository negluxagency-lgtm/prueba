'use client'

import { useState } from 'react'
import { CalendarDays, Loader2, CheckCircle2, ChevronRight, X } from 'lucide-react'
import { updateAppointmentDate } from '@/app/actions/update-appointment-date'

interface EditDateButtonProps {
    uuid: string
    currentDia: string
    currentHora: string
}

// Generate half-hour time slots 08:00 → 21:30
function generateSlots() {
    const slots: string[] = []
    for (let h = 8; h <= 21; h++) {
        slots.push(`${String(h).padStart(2, '0')}:00`)
        if (h < 21) slots.push(`${String(h).padStart(2, '0')}:30`)
    }
    return slots
}

const TIME_SLOTS = generateSlots()

export default function EditDateButton({ uuid, currentDia, currentHora }: EditDateButtonProps) {
    const [status, setStatus] = useState<'idle' | 'open' | 'loading' | 'done' | 'error'>('idle')
    const [newDia, setNewDia] = useState(currentDia)
    const [newHora, setNewHora] = useState(currentHora.substring(0, 5))
    const [errorMsg, setErrorMsg] = useState('')

    const today = new Date().toISOString().split('T')[0]

    const handleSubmit = async () => {
        if (!newDia || !newHora) return
        setStatus('loading')
        const result = await updateAppointmentDate(uuid, newDia, newHora)
        if (result.success) {
            setStatus('done')
        } else {
            setStatus('error')
            setErrorMsg(result.error || 'Error desconocido')
        }
    }

    if (status === 'done') {
        return (
            <div className="flex flex-col items-center gap-2 py-3 text-center">
                <CheckCircle2 className="w-9 h-9 text-amber-500" />
                <p className="text-white font-black uppercase tracking-tight">¡Fecha Actualizada!</p>
                <p className="text-zinc-500 text-xs">Tu cita ha sido reprogramada. Quedará pendiente de confirmación.</p>
            </div>
        )
    }

    if (status === 'open' || status === 'loading' || status === 'error') {
        return (
            <div className="space-y-3 mt-4 border-t border-zinc-800 pt-4">
                <div className="flex items-center justify-between mb-1">
                    <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Nueva fecha y hora</p>
                    <button
                        onClick={() => { setStatus('idle'); setErrorMsg('') }}
                        className="text-zinc-600 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <input
                    type="date"
                    value={newDia}
                    min={today}
                    onChange={(e) => setNewDia(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-500 focus:outline-none transition-colors [color-scheme:dark]"
                />

                <select
                    value={newHora}
                    onChange={(e) => setNewHora(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-500 focus:outline-none transition-colors"
                >
                    {TIME_SLOTS.map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                    ))}
                </select>

                {status === 'error' && (
                    <p className="text-red-400 text-xs font-bold pl-1">{errorMsg}</p>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={status === 'loading' || !newDia || !newHora}
                    className="w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-wide bg-amber-500 hover:bg-amber-400 text-black transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {status === 'loading' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <ChevronRight className="w-4 h-4" />
                    )}
                    {status === 'loading' ? 'Guardando...' : 'Confirmar Nueva Fecha'}
                </button>
            </div>
        )
    }

    // idle
    return (
        <button
            onClick={() => setStatus('open')}
            className="w-full py-3 rounded-xl font-black text-sm uppercase tracking-wide bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/30 text-zinc-300 hover:text-amber-400 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
        >
            <CalendarDays className="w-4 h-4" />
            Cambiar Fecha
        </button>
    )
}
