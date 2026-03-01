import { Loader2 } from 'lucide-react'

export default function StaffLoading() {
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-4" />
            <p className="text-zinc-500 text-sm font-medium animate-pulse tracking-widest uppercase">
                Conectando con la Base de Datos...
            </p>
        </div>
    )
}
