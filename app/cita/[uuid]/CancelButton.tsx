'use client'

import { useState } from 'react'
import { XCircle, Loader2, CheckCircle2 } from 'lucide-react'
import { cancelAppointmentByUuid } from '@/app/actions/cancel-appointment'

export default function CancelButton({ uuid }: { uuid: string }) {
    const [status, setStatus] = useState<'idle' | 'confirming' | 'loading' | 'done' | 'error'>('idle')
    const [errorMsg, setErrorMsg] = useState('')

    const handleCancel = async () => {
        setStatus('loading')
        const result = await cancelAppointmentByUuid(uuid)
        if (result.success) {
            setStatus('done')
        } else {
            setStatus('error')
            setErrorMsg(result.error || 'Error desconocido')
        }
    }

    if (status === 'done') {
        return (
            <div className="flex flex-col items-center gap-2 py-4">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
                <p className="text-white font-black uppercase tracking-tight text-lg">Cita Cancelada</p>
                <p className="text-zinc-500 text-xs">Tu reserva ha sido cancelada correctamente.</p>
            </div>
        )
    }

    if (status === 'confirming') {
        return (
            <div className="space-y-3">
                <p className="text-zinc-400 text-sm text-center font-medium mb-1">
                    ¿Confirmas que deseas cancelar esta cita?
                </p>
                <button
                    onClick={handleCancel}
                    className="w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-wide bg-red-500 hover:bg-red-400 text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    <XCircle className="w-4 h-4" />
                    Sí, Cancelar Cita
                </button>
                <button
                    onClick={() => setStatus('idle')}
                    className="w-full py-3 rounded-xl font-black text-sm uppercase tracking-wide bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all"
                >
                    Volver
                </button>
            </div>
        )
    }

    if (status === 'error') {
        return (
            <div className="text-center py-2">
                <p className="text-red-400 text-sm font-bold mb-3">{errorMsg}</p>
                <button
                    onClick={() => setStatus('idle')}
                    className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wide bg-zinc-800 hover:bg-zinc-700 text-white transition-all"
                >
                    Reintentar
                </button>
            </div>
        )
    }

    return (
        <button
            onClick={() => setStatus('confirming')}
            disabled={status === 'loading'}
            className="w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-wide bg-red-500 hover:bg-red-400 shadow-lg shadow-red-500/20 text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
            {status === 'loading' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <XCircle className="w-4 h-4" />
            )}
            Cancelar Cita
        </button>
    )
}
