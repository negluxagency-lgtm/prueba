'use client'

import { useState } from 'react'
import { impersonateUser } from '@/app/actions/impersonate'
import { Lock } from 'lucide-react'

export default function GodMode() {
    const [link, setLink] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setLink(null)
        const res = await impersonateUser(formData)
        if (res.url) {
            setLink(res.url)
        } else {
            alert('Error: ' + typeof res.error === 'string' ? res.error : 'Ocurrió un error desconocido')
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md p-8 border border-red-900/50 bg-red-950/10 rounded-2xl">
                <div className="flex items-center gap-3 mb-6 text-red-500">
                    <Lock />
                    <h1 className="text-2xl font-bold">GOD MODE ACCESS</h1>
                </div>

                <form action={handleSubmit} className="flex flex-col gap-4">
                    <input
                        name="email"
                        type="email"
                        placeholder="Email del usuario..."
                        className="p-4 rounded-lg bg-zinc-900 text-white border border-zinc-800 focus:border-red-500 outline-none"
                        required
                    />
                    <button
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Generando...' : 'Hackear (Generar Link)'}
                    </button>
                </form>

                {link && (
                    <div className="mt-8 p-4 bg-zinc-900 border border-green-500/50 rounded-lg break-all">
                        <p className="text-green-500 text-xs uppercase font-bold mb-2">Link de Acceso:</p>
                        <a href={link} className="text-white text-sm underline hover:text-green-400 block">
                            Click aquí para entrar
                        </a>
                    </div>
                )}
            </div>
        </div>
    )
}
