'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LogOut } from 'lucide-react'
import { toast } from 'sonner'

export default function ProfileLogoutButton() {
    const router = useRouter()

    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut()

            if (error) {
                toast.error('Error al cerrar sesión')
                console.error('Error:', error)
                return
            }

            toast.success('Sesión cerrada correctamente')
            router.push('/')
            router.refresh()
        } catch (error) {
            toast.error('Error inesperado al cerrar sesión')
            console.error('Error:', error)
        }
    }

    return (
        <div className="border-t border-red-900/30 pt-6">
            <h3 className="text-sm font-semibold text-red-400 mb-3">
                Zona de Peligro
            </h3>
            <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 
                   bg-red-950/30 hover:bg-red-900/40 border border-red-800/50 
                   hover:border-red-700 text-red-400 hover:text-red-300 
                   rounded-lg transition-all duration-200"
            >
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Cerrar Sesión</span>
            </button>
        </div>
    )
}
