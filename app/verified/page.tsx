import Link from 'next/link'

export default function VerifiedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
            <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center shadow-2xl">
                {/* Icono */}
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-8 w-8 text-amber-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                </div>
                {/* Textos */}
                <h1 className="text-2xl font-bold text-white mb-2">¡Cuenta Verificada!</h1>
                <p className="text-zinc-400 mb-8">
                    Tu correo electrónico ha sido confirmado correctamente. Ya tienes acceso completo a Nelux.
                </p>
                {/* Botón */}
                <Link
                    href="/inicio"
                    className="block w-full rounded-md bg-amber-500 px-4 py-3 text-sm font-semibold text-zinc-950 hover:bg-amber-400 transition-colors"
                >
                    Iniciar Sesión
                </Link>
            </div>
        </div>
    )
}
