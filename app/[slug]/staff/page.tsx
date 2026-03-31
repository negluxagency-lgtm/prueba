import { Lock } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function OldStaffPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mb-6 shadow-2xl">
                <Lock className="w-10 h-10 text-amber-500" />
            </div>
            
            <h1 className="text-2xl lg:text-3xl font-black text-white italic uppercase tracking-tighter mb-4">
                Enlace Expirado o Inválido
            </h1>
            
            <p className="max-w-md text-zinc-400 text-sm md:text-base mb-8">
                Por motivos de seguridad, el acceso al portal de equipo requiere ahora de un <strong className="text-white">código de 4 dígitos</strong> en la URL.
            </p>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 w-full max-w-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-2">
                    Acción Requerida
                </p>
                <p className="text-sm text-amber-400">
                    Por favor, solicita a tu encargado o administrador el nuevo enlace seguro de la barbería.
                </p>
            </div>
        </div>
    )
}
